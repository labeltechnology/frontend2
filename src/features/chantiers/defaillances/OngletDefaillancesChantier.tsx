import { useState } from "react";
import { Link2, Replace } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { BarresPareto } from "@/features/chantiers/defaillances/BarresPareto";
import { useDefaillancesChantier, useImputer, useRemplacants, useRemplacer } from "@/features/chantiers/defaillances/defaillances-api";
import {
  CAUSES,
  LIBELLES_CAUSE,
  libelleTypeDefaillance,
  sansCause,
  trierDefaillances,
} from "@/features/chantiers/defaillances/defaillances";
import { useTerrainChantier } from "@/features/chantiers/terrain/terrain-api";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatMontant, libelleEnum } from "@/lib/utils";
import type { CauseDefaillance, Defaillance, TerrainVehicule } from "@/types/chantier";

const SANS_CAUSE = "aucune";

/**
 * Onglet « Incidents » de la fiche chantier (V64, 2026-09-29) : incidents et
 * maintenances rattachés au chantier (d'office à la déclaration), cause de
 * chaque défaillance et Pareto, candidats à rattacher, remplacement d'un
 * véhicule en panne par un véhicule libre du même type.
 */
export function OngletDefaillancesChantier({
  idChantier,
  peutGererParc,
  peutGererMaintenance,
}: {
  idChantier: number;
  peutGererParc: boolean;
  peutGererMaintenance: boolean;
}) {
  const { data, isLoading, isError } = useDefaillancesChantier(idChantier);
  const terrain = useTerrainChantier(idChantier);
  const [imputation, setImputation] = useState<{ d: Defaillance; rattacher: boolean } | null>(null);
  const [aRemplacer, setARemplacer] = useState<TerrainVehicule | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des incidents…</p>;
  if (isError || !data) return <p className="text-sm text-destructive">Impossible de charger les incidents du chantier.</p>;

  const peutImputer = (d: Defaillance) => (d.nature === "INCIDENT" ? peutGererParc : peutGererMaintenance);
  const toutes = trierDefaillances([...data.incidents, ...data.maintenances]);
  const enPanne = (terrain.data?.vehicules ?? []).filter(
    (v) => v.statutRattachement === "ACTIVE" && (v.statutEngin === "EN_PANNE" || v.statutEngin === "EN_MAINTENANCE"),
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CarteChiffre titre="Incidents" valeur={data.incidents.length} precision={`dont ${data.pannes} panne(s)`} />
        <CarteChiffre titre="Maintenances imputées" valeur={formatMontant(data.coutMaintenances)} precision={`${data.maintenances.length} maintenance(s)`} />
        <CarteChiffre titre="Coût estimé des incidents" valeur={formatMontant(data.coutIncidentsEstime)} precision="Hors total : la réparation compte en maintenance" />
        <CarteChiffre titre="Sans cause" valeur={data.sansCause} classeValeur={data.sansCause > 0 ? "text-badge-warningFg" : undefined}
          precision="À expliquer pour l'analyse des causes" />
      </div>

      {enPanne.length > 0 && (
        <section aria-label="Véhicules à remplacer" className="space-y-2 rounded-md border border-badge-warningFg/40 bg-badge-warningBg p-3">
          <h3 className="text-sm font-medium">Véhicules indisponibles sur le chantier</h3>
          <ul className="space-y-1">
            {enPanne.map((v) => (
              <li key={v.idAffectation} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium">{v.vehicule}</span> — {libelleEnum(v.statutEngin)}, prévu jusqu'au {formatDate(v.fin)}
                </span>
                {peutGererParc && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setARemplacer(v)}>
                    <Replace className="h-4 w-4" />
                    Remplacer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Causes" className="space-y-2">
        <h3 className="text-sm font-medium">Causes des défaillances du chantier</h3>
        <BarresPareto lignes={data.pareto} />
      </section>

      <section aria-label="Incidents et maintenances" className="space-y-2">
        <h3 className="text-sm font-medium">Incidents et maintenances du chantier</h3>
        {toutes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun incident ni maintenance rattaché.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cause</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {toutes.map((d) => (
                  <TableRow key={`${d.nature}-${d.id}`}>
                    <TableCell className="whitespace-nowrap">{formatDate(d.date)}</TableCell>
                    <TableCell>{d.vehicule ?? "—"}</TableCell>
                    <TableCell>
                      <div>{libelleTypeDefaillance(d)}</div>
                      {d.description && <div className="line-clamp-2 text-xs text-muted-foreground">{d.description}</div>}
                    </TableCell>
                    <TableCell>
                      {d.cause ? LIBELLES_CAUSE[d.cause] : sansCause(d) ? <Badge variant="warning">À renseigner</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatMontant(d.cout)}</TableCell>
                    <TableCell className="text-right">
                      {peutImputer(d) && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => setImputation({ d, rattacher: false })}>
                          Modifier
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {data.aRattacher.length > 0 && (
        <section aria-label="À rattacher" className="space-y-2">
          <h3 className="text-sm font-medium">Survenus pendant le chantier, sans chantier</h3>
          <ul className="space-y-1">
            {data.aRattacher.map((d) => (
              <li key={`${d.nature}-${d.id}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {formatDate(d.date)} — {d.vehicule} — {libelleTypeDefaillance(d)}
                  {d.description && <span className="text-muted-foreground"> : {d.description}</span>}
                </span>
                {peutImputer(d) && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setImputation({ d, rattacher: true })}>
                    <Link2 className="h-4 w-4" />
                    Rattacher
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {imputation && (
        <ImputationDialog idChantier={idChantier} defaillance={imputation.d} rattacher={imputation.rattacher}
          onClose={() => setImputation(null)} />
      )}
      {aRemplacer && <RemplacementDialog idChantier={idChantier} vehicule={aRemplacer} onClose={() => setARemplacer(null)} />}
    </div>
  );
}

function ImputationDialog({
  idChantier,
  defaillance,
  rattacher,
  onClose,
}: {
  idChantier: number;
  defaillance: Defaillance;
  rattacher: boolean;
  onClose: () => void;
}) {
  const imputer = useImputer(idChantier);
  const [cause, setCause] = useState<CauseDefaillance | null>(defaillance.cause);

  const envoyer = async (garderSurChantier: boolean) => {
    try {
      await imputer.mutateAsync({
        nature: defaillance.nature,
        id: defaillance.id,
        requete: { idChantier: garderSurChantier ? idChantier : null, cause },
      });
      toast.success(garderSurChantier ? "Enregistré" : "Retiré du chantier");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rattacher ? "Rattacher au chantier" : "Cause et chantier"}</DialogTitle>
          <DialogDescription>
            {libelleTypeDefaillance(defaillance)} du {formatDate(defaillance.date)} — {defaillance.vehicule}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Cause</Label>
          <Select value={cause ?? SANS_CAUSE} onValueChange={(v) => setCause(v === SANS_CAUSE ? null : (v as CauseDefaillance))}>
            <SelectTrigger aria-label="Cause">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SANS_CAUSE}>Non renseignée</SelectItem>
              {CAUSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {LIBELLES_CAUSE[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2">
          {!rattacher && (
            <Button type="button" variant="ghost" className="mr-auto" onClick={() => envoyer(false)} disabled={imputer.isPending}>
              Retirer du chantier
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={() => envoyer(true)} disabled={imputer.isPending}>
            {rattacher ? "Rattacher" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemplacementDialog({ idChantier, vehicule, onClose }: { idChantier: number; vehicule: TerrainVehicule; onClose: () => void }) {
  const { data: remplacants, isLoading } = useRemplacants(idChantier, vehicule.idAffectation);
  const remplacer = useRemplacer(idChantier);
  const [choix, setChoix] = useState("");

  const valider = async () => {
    if (!choix) return;
    try {
      await remplacer.mutateAsync({ idAffectation: vehicule.idAffectation, idEngin: Number(choix) });
      toast.success("Véhicule remplacé sur le chantier");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Remplacement impossible");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remplacer {vehicule.vehicule}</DialogTitle>
          <DialogDescription>
            Véhicules du même type ({vehicule.typeEngin ?? "—"}) libres jusqu'au {formatDate(vehicule.fin)}. L'ancien est retiré du
            chantier, le remplaçant est prévu du jour à la fin de la période.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Recherche…</p>}
        {remplacants && remplacants.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun véhicule du même type n'est libre sur la période : faites une demande ou une location.</p>
        )}
        {remplacants && remplacants.length > 0 && (
          <Select value={choix} onValueChange={setChoix}>
            <SelectTrigger aria-label="Remplaçant">
              <SelectValue placeholder="Choisir le remplaçant" />
            </SelectTrigger>
            <SelectContent>
              {remplacants.map((r) => (
                <SelectItem key={r.idEngin} value={String(r.idEngin)}>
                  {r.vehicule} — {libelleEnum(r.statut)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={valider} disabled={!choix || remplacer.isPending}>
            Remplacer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
