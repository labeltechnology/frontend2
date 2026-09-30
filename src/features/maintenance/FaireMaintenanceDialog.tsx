import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePostesEntretien } from "@/features/entretien/api";
import { useGaragesExternes } from "@/features/garages/api";
import { useAjouterPieceMaintenance, useCreerMaintenance, useDemarrerMaintenance, useMaintenances, usePieces } from "@/features/maintenance/api";
import { avertissementsVehicule } from "@/features/maintenance/choix-vehicule";
import { debutAujourdhui } from "@/features/maintenance/dates-maintenance";
import { ChoixVehiculeMaintenance } from "@/features/maintenance/ChoixVehiculeMaintenance";
import { useDefinirCoutsGarage } from "@/features/maintenance/couts-garage-api";
import {
  basculerTravail,
  requeteFaireMaintenance,
  saisieSuffisante,
  travauxProposes,
  typeSuggere,
  type MomentMaintenance,
} from "@/features/maintenance/faire-maintenance";
import {
  calculerLignesGarage,
  calculerLignesStock,
  lireMainOeuvre,
  requeteCoutsGarage,
  requetesPiecesStock,
  type LigneGarageSaisie,
  type LigneStockSaisie,
} from "@/features/maintenance/pieces-maintenance";
import { SaisiePiecesGarage } from "@/features/maintenance/SaisiePiecesGarage";
import { SaisiePiecesStock } from "@/features/maintenance/SaisiePiecesStock";
import { useTravauxMaintenance } from "@/features/maintenance/travaux-api";
import { porteeConcerne } from "@/features/referentiels-fiche/libelles";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Engin } from "@/types/engin";
import type { TypeMaintenance } from "@/types/maintenance";
import { libelleVehicule } from "@/lib/vehicule";
import { LienAide } from "@/features/aide/LienAide";

const ATELIER_INTERNE = "__interne__";
const AUCUN_POSTE = "__aucun__";

const LIBELLES_TYPE: Record<TypeMaintenance, string> = {
  PREVENTIVE: "Préventive",
  CORRECTIVE: "Corrective",
};

interface FaireMaintenanceDialogProps {
  /** Véhicule déjà choisi (rapport véhicule) ; null = choix du véhicule en première étape (page Maintenance). */
  engin: Engin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * « Faire la maintenance » (2026-09-25, bouton de la carte « Alertes et
 * maintenance » du rapport véhicule) : l'engin est déjà choisi ; on coche
 * les travaux à faire (référentiel modifiable « Travaux de maintenance »,
 * plusieurs possibles), puis on choisit de commencer tout de suite (la
 * maintenance passe EN_COURS et l'engin EN_MAINTENANCE) ou de planifier.
 * Règles dans faire-maintenance.ts ; les contrôles qui font foi restent
 * ceux du backend (MaintenanceService, TravailMaintenanceService).
 *
 * Depuis le 2026-09-28, c'est aussi le formulaire « Nouvelle maintenance »
 * de la page Maintenance (un seul formulaire à maintenir) : sans véhicule
 * imposé, la première étape est le choix du véhicule (ChoixVehiculeMaintenance),
 * avec les avertissements utiles (maintenance déjà en cours, en mission…).
 * Pour « Planifier », une date prévue facultative (V54).
 *
 * Pièces et montants (2026-09-25) : atelier interne = pièces du stock
 * (seulement si l'on commence maintenant : le stock ne diminue qu'à
 * l'utilisation réelle) ; garage externe = pièces facturées + main-d'œuvre,
 * coût total calculé (enregistrables dès la planification, sans effet sur
 * le stock). Règles dans pieces-maintenance.ts.
 */
export function FaireMaintenanceDialog({ engin, open, onOpenChange }: FaireMaintenanceDialogProps) {
  const [choisi, setChoisi] = useState<Engin | null>(engin);
  useEffect(() => {
    if (open) setChoisi(engin);
  }, [open, engin]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {choisi ? (
          <ContenuFaireMaintenance
            key={choisi.idEngin}
            engin={choisi}
            onFermer={() => onOpenChange(false)}
            onChangerVehicule={engin ? undefined : () => setChoisi(null)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nouvelle maintenance</DialogTitle>
              <DialogDescription>Choisissez le véhicule concerné.</DialogDescription>
              <LienAide idPage="guide-creer-maintenance" libelle="Comment faire ?" />
            </DialogHeader>
            <ChoixVehiculeMaintenance onChoisir={setChoisi} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ContenuFaireMaintenanceProps {
  engin: Engin;
  onFermer: () => void;
  /** Absent quand le véhicule est imposé (ouvert depuis le rapport véhicule). */
  onChangerVehicule?: () => void;
}

function ContenuFaireMaintenance({ engin, onFermer, onChangerVehicule }: ContenuFaireMaintenanceProps) {
  const queryClient = useQueryClient();
  const travaux = useTravauxMaintenance();
  const { data: postes } = usePostesEntretien();
  const { data: garages } = useGaragesExternes();
  const creer = useCreerMaintenance();
  const demarrer = useDemarrerMaintenance();
  const { data: pieces } = usePieces();
  const ajouterPiece = useAjouterPieceMaintenance();
  const definirCoutsGarage = useDefinirCoutsGarage();

  const [idsTravaux, setIdsTravaux] = useState<number[]>([]);
  const [typeChoisi, setTypeChoisi] = useState<TypeMaintenance | null>(null);
  const [description, setDescription] = useState("");
  const [idGarage, setIdGarage] = useState(ATELIER_INTERNE);
  const [idPoste, setIdPoste] = useState(AUCUN_POSTE);
  const [moment, setMoment] = useState<MomentMaintenance>("MAINTENANT");
  const [envoi, setEnvoi] = useState(false);
  const [lignesStock, setLignesStock] = useState<LigneStockSaisie[]>([]);
  const [lignesGarage, setLignesGarage] = useState<LigneGarageSaisie[]>([]);
  const [mainOeuvre, setMainOeuvre] = useState("");
  // Date prévue (2026-09-28, V54) : seulement pour « Planifier » ; vide = sans date.
  const [datePrevue, setDatePrevue] = useState("");
  const { data: maintenances } = useMaintenances();
  const avertissements = useMemo(() => avertissementsVehicule(engin, maintenances ?? []), [engin, maintenances]);

  const categorie = engin.typeEngin.categorie;
  const enMission = engin.statut === "EN_MISSION";
  const proposes = useMemo(() => travauxProposes(travaux.data ?? [], categorie), [travaux.data, categorie]);
  const postesProposes = useMemo(
    () => (postes ?? []).filter((p) => p.actif && porteeConcerne(p.portee, categorie)),
    [postes, categorie],
  );
  // Le type suit les travaux cochés tant que l'utilisateur ne l'a pas choisi lui-même.
  const type = typeChoisi ?? typeSuggere(idsTravaux, proposes);
  const suffisant = saisieSuffisante({ idsTravaux, description });

  const interne = idGarage === ATELIER_INTERNE;
  const piecesStockActives = interne && moment === "MAINTENANT";
  const calculsStock = useMemo(() => calculerLignesStock(lignesStock, pieces ?? []), [lignesStock, pieces]);
  const calculsGarage = useMemo(() => calculerLignesGarage(lignesGarage), [lignesGarage]);
  const mainOeuvreLue = lireMainOeuvre(mainOeuvre);
  const piecesInvalides = piecesStockActives
    ? calculsStock.some((c) => c.erreur !== null)
    : !interne && (calculsGarage.some((c) => c.erreur !== null) || mainOeuvreLue === null);

  // Remis à zéro à chaque ouverture : le composant est remonté (clé = véhicule) par FaireMaintenanceDialog.
  useEffect(() => {
    setIdsTravaux([]);
    setTypeChoisi(null);
    setDescription("");
    setIdGarage(ATELIER_INTERNE);
    setIdPoste(AUCUN_POSTE);
    setMoment(enMission ? "PLANIFIER" : "MAINTENANT");
    setLignesStock([]);
    setLignesGarage([]);
    setMainOeuvre("");
    setDatePrevue("");
  }, [enMission]);

  /** Pièces après création (et démarrage) ; renvoie les problèmes rencontrés, sans annuler la maintenance. */
  const enregistrerPieces = async (idMaintenance: number, demarree: boolean): Promise<string[]> => {
    const problemes: string[] = [];
    const message = (e: unknown) => (e instanceof ApiError ? e.message : "erreur inattendue");
    if (interne && demarree) {
      for (const requete of requetesPiecesStock(calculsStock)) {
        try {
          await ajouterPiece.mutateAsync({ id: idMaintenance, requete });
        } catch (e) {
          const nom = pieces?.find((p) => p.idPiece === requete.idPiece)?.nom ?? `pièce ${requete.idPiece}`;
          problemes.push(`${nom} : ${message(e)}`);
        }
      }
    }
    if (!interne && (lignesGarage.length > 0 || (mainOeuvreLue ?? 0) > 0)) {
      try {
        await definirCoutsGarage.mutateAsync({
          idMaintenance,
          requete: requeteCoutsGarage(lignesGarage, calculsGarage, mainOeuvreLue ?? 0),
        });
      } catch (e) {
        problemes.push(`pièces et main-d'œuvre du garage : ${message(e)}`);
      }
    }
    return problemes;
  };

  const valider = async () => {
    if (!suffisant || piecesInvalides) return;
    setEnvoi(true);
    try {
      const maintenance = await creer.mutateAsync(
        requeteFaireMaintenance(engin.idEngin, {
          idsTravaux,
          type,
          description,
          idGarageExterne: idGarage === ATELIER_INTERNE ? null : Number(idGarage),
          idPosteEntretien: idPoste === AUCUN_POSTE ? null : Number(idPoste),
          datePrevue: moment === "PLANIFIER" && datePrevue ? datePrevue : null,
        }),
      );
      let demarree = false;
      if (moment === "MAINTENANT") {
        try {
          await demarrer.mutateAsync(maintenance.idMaintenance);
          demarree = true;
          toast.success(`Maintenance commencée — ${libelleVehicule(engin)} passe en maintenance`);
        } catch (e) {
          toast.warning(
            `Maintenance créée mais pas commencée : ${e instanceof ApiError ? e.message : "erreur inattendue"}. Démarrez-la depuis l'écran Maintenance.`,
          );
        }
        // Le statut de l'engin change au démarrage : le rapport et la liste des véhicules doivent le relire.
        void queryClient.invalidateQueries({ queryKey: ["engins"] });
      } else {
        toast.success("Maintenance planifiée");
      }
      const problemes = await enregistrerPieces(maintenance.idMaintenance, demarree);
      if (problemes.length > 0) {
        toast.warning(`Maintenance enregistrée, mais pas tout : ${problemes.join(" ; ")}. Complétez depuis l'écran Maintenance.`);
      }
      onFermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer la maintenance");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>{onChangerVehicule ? "Nouvelle maintenance" : "Faire la maintenance"} — {libelleVehicule(engin)}</DialogTitle>
          <DialogDescription>
            Cochez les travaux à faire ; plusieurs travaux peuvent être regroupés.
            {onChangerVehicule && (
              <>
                {" "}
                <button type="button" onClick={onChangerVehicule} className="font-medium text-primary underline-offset-2 hover:underline">
                  Changer de véhicule
                </button>
              </>
            )}
          </DialogDescription>
          <LienAide idPage="guide-creer-maintenance" libelle="Comment faire ?" />
        </DialogHeader>

        {avertissements.length > 0 && (
          <ul className="space-y-1">
            {avertissements.map((a) => (
              <li
                key={a.message}
                className={cn(
                  "rounded-md px-3 py-2 text-xs",
                  a.niveau === "attention" ? "bg-badge-warning text-badge-warningFg" : "bg-muted text-muted-foreground",
                )}
              >
                {a.message}
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Travaux à faire</legend>
            {travaux.isPending && !travaux.isError ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Chargement des travaux…
              </p>
            ) : travaux.isError ? (
              <p className="text-sm text-destructive">Liste des travaux indisponible : décrivez la maintenance ci-dessous.</p>
            ) : proposes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun travail défini pour ce type de véhicule (voir « Listes de la fiche »).
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {proposes.map((t) => {
                  const coche = idsTravaux.includes(t.idTravailMaintenance);
                  return (
                    <label
                      key={t.idTravailMaintenance}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        coche ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={coche}
                        onChange={() => setIdsTravaux((ids) => basculerTravail(ids, t.idTravailMaintenance))}
                      />
                      <span className="min-w-0 flex-1">{t.libelle}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="faire-maintenance-type">Type</Label>
              <Select value={type} onValueChange={(v) => setTypeChoisi(v as TypeMaintenance)}>
                <SelectTrigger id="faire-maintenance-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LIBELLES_TYPE) as TypeMaintenance[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {LIBELLES_TYPE[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeChoisi === null && idsTravaux.length > 0 && (
                <p className="text-xs text-muted-foreground">Proposé d'après les travaux cochés.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faire-maintenance-garage">Atelier</Label>
              <Select value={idGarage} onValueChange={setIdGarage}>
                <SelectTrigger id="faire-maintenance-garage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ATELIER_INTERNE}>Atelier interne</SelectItem>
                  {garages?.map((g) => (
                    <SelectItem key={g.idGarageExterne} value={String(g.idGarageExterne)}>
                      {g.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faire-maintenance-poste">Poste d'entretien périodique (optionnel)</Label>
            <Select value={idPoste} onValueChange={setIdPoste}>
              <SelectTrigger id="faire-maintenance-poste">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUCUN_POSTE}>Aucun</SelectItem>
                {postesProposes.map((p) => (
                  <SelectItem key={p.idPosteEntretien} value={String(p.idPosteEntretien)}>
                    {p.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">À la clôture, la prochaine échéance de ce poste sera recalculée.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faire-maintenance-description">Précisions (optionnel)</Label>
            <Textarea
              id="faire-maintenance-description"
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. : pneu avant gauche crevé, bruit au freinage…"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Quand ?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={cn(
                  "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                  enMission ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  moment === "MAINTENANT" ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="moment-maintenance"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={moment === "MAINTENANT"}
                  disabled={enMission}
                  onChange={() => setMoment("MAINTENANT")}
                />
                <span>
                  <span className="font-medium">Commencer maintenant</span>
                  <span className="block text-xs text-muted-foreground">
                    {enMission
                      ? "Impossible : le véhicule est en mission."
                      : "La maintenance passe en cours et le véhicule en maintenance."}
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm",
                  moment === "PLANIFIER" ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="moment-maintenance"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={moment === "PLANIFIER"}
                  onChange={() => setMoment("PLANIFIER")}
                />
                <span>
                  <span className="font-medium">Planifier</span>
                  <span className="block text-xs text-muted-foreground">
                    À démarrer plus tard depuis l'écran Maintenance.
                  </span>
                </span>
              </label>
            </div>
            {moment === "PLANIFIER" && (
              <div className="space-y-1 pt-1 sm:w-1/2">
                <Label htmlFor="faire-maintenance-date">Date prévue (optionnel)</Label>
                <Input
                  id="faire-maintenance-date"
                  type="datetime-local"
                  min={debutAujourdhui()}
                  value={datePrevue}
                  onChange={(e) => setDatePrevue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Placée à cette date dans le planning des véhicules.</p>
              </div>
            )}
          </fieldset>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {interne ? "Pièces du stock (atelier interne)" : "Pièces et main-d'œuvre du garage externe"}
          </legend>
          {interne ? (
            piecesStockActives ? (
              <SaisiePiecesStock lignes={lignesStock} calculs={calculsStock} pieces={pieces ?? []} onChange={setLignesStock} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Les pièces du stock se saisissent au démarrage de la maintenance (écran Maintenance) : le stock ne diminue
                qu'à l'utilisation réelle.
              </p>
            )
          ) : (
            <SaisiePiecesGarage
              lignes={lignesGarage}
              calculs={calculsGarage}
              mainOeuvre={mainOeuvre}
              mainOeuvreLue={mainOeuvreLue}
              onChangeLignes={setLignesGarage}
              onChangeMainOeuvre={setMainOeuvre}
            />
          )}
        </fieldset>

        <DialogFooter className="gap-2 sm:items-center">
          {!suffisant && <p className="text-xs text-muted-foreground sm:mr-auto">Cochez au moins un travail ou décrivez la maintenance.</p>}
          {suffisant && piecesInvalides && (
            <p className="text-xs text-destructive sm:mr-auto">Corrigez les pièces signalées en rouge.</p>
          )}
          <Button variant="outline" onClick={onFermer} disabled={envoi}>
            Annuler
          </Button>
          <Button onClick={valider} disabled={!suffisant || piecesInvalides || envoi}>
            {envoi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
            {moment === "MAINTENANT" ? "Commencer la maintenance" : "Planifier la maintenance"}
          </Button>
        </DialogFooter>
    </>
  );
}
