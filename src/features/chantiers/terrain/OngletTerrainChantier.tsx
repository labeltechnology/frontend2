import { useMemo, useState } from "react";
import { AlertTriangle, LogIn, LogOut, RefreshCw, Satellite, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { MouvementDialog } from "@/features/chantiers/terrain/MouvementDialog";
import {
  useMouvementsChantier,
  usePreventifChantier,
  useRecalculerTerrain,
  useTerrainChantier,
} from "@/features/chantiers/terrain/terrain-api";
import {
  CLASSE_PRESENCE,
  classeTaux,
  LIBELLES_ETAT,
  LIBELLES_PRESENCE,
  libelleRemiseEnService,
  libelleSource,
  texteTaux,
  VARIANT_ETAT,
} from "@/features/chantiers/terrain/terrain";
import { ApiError } from "@/lib/api-client";
import { cn, formatDate, formatNombre } from "@/lib/utils";
import type { JourPresence, MouvementsVehicule, TypeMouvement } from "@/types/chantier";

/** Pastilles des derniers jours : présence GPS et heures du journal. */
function Pastilles({ jours }: { jours: JourPresence[] }) {
  if (jours.length === 0) return <span className="text-xs text-muted-foreground">Pas encore commencé</span>;
  return (
    <div className="flex flex-wrap gap-0.5" aria-label="Présence des derniers jours">
      {jours.map((j) => {
        const titre = `${formatDate(j.jour)} : ${j.statut ? LIBELLES_PRESENCE[j.statut] : "pas encore calculé"}${
          j.heures != null ? ` · ${formatNombre(j.heures, 1)} h au journal` : ""
        }${j.km != null ? ` · ${formatNombre(j.km, 1)} km` : ""}`;
        return (
          <span
            key={j.jour}
            title={titre}
            className={cn("h-3 w-3 rounded-sm border", j.statut ? CLASSE_PRESENCE[j.statut] : "bg-transparent")}
          />
        );
      })}
    </div>
  );
}

/**
 * Onglet « Terrain » de la fiche chantier (V64, 2026-09-29) : présence GPS
 * des véhicules sur le chantier (calculée chaque nuit), heures du journal,
 * taux de disponibilité et d'utilisation réelle, sorties et retours (états
 * des lieux) et entretiens qui tombent pendant le chantier.
 */
export function OngletTerrainChantier({ idChantier, peutGerer }: { idChantier: number; peutGerer: boolean }) {
  const terrain = useTerrainChantier(idChantier);
  const mouvements = useMouvementsChantier(idChantier);
  const preventif = usePreventifChantier(idChantier);
  const recalculer = useRecalculerTerrain(idChantier);
  const [edition, setEdition] = useState<{ idAffectation: number; type: TypeMouvement } | null>(null);

  const mouvementsParId = useMemo(
    () => new Map((mouvements.data ?? []).map((m) => [m.idAffectation, m])),
    [mouvements.data],
  );
  const vehiculeEdite: MouvementsVehicule | undefined = edition ? mouvementsParId.get(edition.idAffectation) : undefined;

  const surRecalculer = async () => {
    try {
      const { joursCalcules } = await recalculer.mutateAsync();
      toast.success(`${joursCalcules} journée(s) recalculée(s)`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Recalcul impossible");
    }
  };

  if (terrain.isLoading) return <p className="text-sm text-muted-foreground">Chargement du terrain…</p>;
  if (terrain.isError || !terrain.data) return <p className="text-sm text-destructive">Impossible de charger le terrain du chantier.</p>;
  const t = terrain.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Satellite className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {libelleSource(t.sourcePresence, t.rayonPresenceMetres)} Calcul de nuit, jusqu'au {formatDate(t.calculeJusquAu)} ;{" "}
            {formatNombre(t.heuresJourPrevues, 1)} h de travail attendues par véhicule et par jour.
          </span>
        </p>
        {peutGerer && (
          <Button type="button" variant="outline" size="sm" onClick={surRecalculer} disabled={recalculer.isPending}>
            <RefreshCw className={cn("h-4 w-4", recalculer.isPending && "animate-spin")} />
            Recalculer
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CarteChiffre titre="Présence sur le chantier (GPS)" valeur={texteTaux(t.tauxPresence)} classeValeur={classeTaux(t.tauxPresence)}
          precision="Jours sur place ÷ jours avec positions" />
        <CarteChiffre titre="Disponibilité du matériel" valeur={texteTaux(t.tauxDisponibilite)} classeValeur={classeTaux(t.tauxDisponibilite)}
          precision="Jours servis ÷ jours renseignés" />
        <CarteChiffre titre="Utilisation réelle" valeur={texteTaux(t.tauxUtilisation)} classeValeur={classeTaux(t.tauxUtilisation)}
          precision={`${formatNombre(t.heuresJournal, 1)} h au journal / ${formatNombre(t.heuresPrevues, 0)} h prévues`} />
        <CarteChiffre titre="Kilomètres (GPS)" valeur={`${formatNombre(t.km, 1)} km`} precision="Sur les jours écoulés des périodes" />
      </div>

      {t.vehicules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun véhicule prévu sur ce chantier.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>14 derniers jours</TableHead>
                <TableHead className="text-right">Présence</TableHead>
                <TableHead className="text-right">Disponibilité</TableHead>
                <TableHead className="text-right">Utilisation</TableHead>
                <TableHead className="text-right">km</TableHead>
                <TableHead>Sortie / retour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.vehicules.map((v) => {
                const m = mouvementsParId.get(v.idAffectation);
                return (
                  <TableRow key={v.idAffectation}>
                    <TableCell>
                      <div className="font-medium">{v.vehicule}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.typeEngin ?? "—"} · du {formatDate(v.debut)} au {formatDate(v.fin)}
                        {!v.equipeGps && " · sans GPS"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {v.statutRattachement !== "ACTIVE" && <Badge variant="outline">Retiré</Badge>}
                        {v.absencesConsecutives >= 2 && (
                          <Badge variant="destructive">Absent {v.absencesConsecutives} j</Badge>
                        )}
                        {v.inactiviteConsecutive >= 3 && <Badge variant="warning">Inactif {v.inactiviteConsecutive} j</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Pastilles jours={v.derniersJours} />
                    </TableCell>
                    <TableCell className={cn("text-right", classeTaux(v.tauxPresence))}>{texteTaux(v.tauxPresence)}</TableCell>
                    <TableCell className={cn("text-right", classeTaux(v.tauxDisponibilite))}>{texteTaux(v.tauxDisponibilite)}</TableCell>
                    <TableCell className="text-right">
                      <div className={classeTaux(v.tauxUtilisation)}>{texteTaux(v.tauxUtilisation)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNombre(v.heuresJournal, 1)} / {formatNombre(v.heuresPrevues, 0)} h
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNombre(v.km, 1)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {(["SORTIE", "RETOUR"] as const).map((type) => {
                          const fait = type === "SORTIE" ? m?.sortie : m?.retour;
                          const Icone = type === "SORTIE" ? LogOut : LogIn;
                          return (
                            <Button
                              key={type}
                              type="button"
                              size="sm"
                              variant={fait ? "ghost" : "outline"}
                              className="h-7 justify-start"
                              disabled={!m || (!fait && !peutGerer)}
                              onClick={() => setEdition({ idAffectation: v.idAffectation, type })}
                            >
                              <Icone className="h-3.5 w-3.5" />
                              {fait ? (
                                <>
                                  {formatDate(fait.dateHeure)}
                                  <Badge variant={VARIANT_ETAT[fait.etat]} className="ml-1">
                                    {LIBELLES_ETAT[fait.etat]}
                                  </Badge>
                                  {fait.note != null && <span className="ml-1 text-xs">{"★".repeat(fait.note)}</span>}
                                </>
                              ) : type === "SORTIE" ? (
                                "Enregistrer la sortie"
                              ) : (
                                "Enregistrer le retour"
                              )}
                            </Button>
                          );
                        })}
                        {m?.retour && (
                          <span className="text-xs text-muted-foreground">
                            {m.kmParcourus != null && `${formatNombre(m.kmParcourus, 1)} km · `}
                            {m.heuresMoteur != null && `${formatNombre(m.heuresMoteur, 1)} h moteur · `}
                            remise en service : {libelleRemiseEnService(m.delaiRemiseEnServiceJours, true)}
                          </span>
                        )}
                        {m?.sortie && m.sortie.elementsManquants.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-badge-warningFg">
                            <AlertTriangle className="h-3 w-3" />
                            Manque au départ : {m.sortie.elementsManquants.join(", ")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <section aria-label="Entretiens pendant le chantier" className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Wrench className="h-4 w-4" />
          Entretiens qui tombent pendant le chantier
        </h3>
        {preventif.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {preventif.data && preventif.data.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune échéance d'entretien pendant les périodes des véhicules.</p>
        )}
        <ul className="space-y-1">
          {(preventif.data ?? []).map((e) => (
            <li key={`${e.idEngin}-${e.poste}`} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{e.vehicule}</span>
              <span>« {e.poste} »</span>
              <span className="text-muted-foreground">vers le {formatDate(e.dateEstimee)} — {e.motif}</span>
              {e.avantDepart && <Badge variant="warning">À faire avant le départ</Badge>}
            </li>
          ))}
        </ul>
      </section>

      {edition && vehiculeEdite && (
        <MouvementDialog
          idChantier={idChantier}
          vehicule={vehiculeEdite}
          type={edition.type}
          modifiable={peutGerer}
          onClose={() => setEdition(null)}
        />
      )}
    </div>
  );
}
