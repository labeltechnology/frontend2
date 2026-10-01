import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { estSaisieAConfirmer } from "@/features/carburant/ConfirmationSaisieDialog";
import { useAnnulerMission, useDemarrerMission, useTerminerMission } from "@/features/missions/api";
import { ConfirmationFinMissionDialog } from "@/features/missions/ConfirmationFinMissionDialog";
import { formatNombre } from "@/lib/utils";
import { aCompteurHoraire, lireCompteurHeures } from "@/features/engins/compteur-vehicule";
import type { Mission } from "@/types/mission";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface MissionActionDialogsProps {
  demarrerCible: Mission | null;
  terminerCible: Mission | null;
  annulerCible: Mission | null;
  onFermer: () => void;
}

/** Regroupe les trois dialogues d'action mission (démarrer/terminer/annuler) : un seul à la fois est ouvert. */
export function MissionActionDialogs({
  demarrerCible,
  terminerCible,
  annulerCible,
  onFermer,
}: MissionActionDialogsProps) {
  const [kmDepart, setKmDepart] = useState("");
  const [kmRetour, setKmRetour] = useState("");
  // Compteur horaire (engin de chantier, facultatif — 2026-09-28) : sert au calcul des heures travaillées.
  const [heuresDepart, setHeuresDepart] = useState("");
  const [heuresRetour, setHeuresRetour] = useState("");
  const [motif, setMotif] = useState("");
  // Fin rapide en attente de confirmation (2026-10-01) : relevés saisis et points renvoyés par le serveur.
  const [finAConfirmer, setFinAConfirmer] = useState<{ kilometrageRetour: number; compteurHeuresRetour?: number; points: string[] } | null>(null);
  const demarrer = useDemarrerMission();
  const terminer = useTerminerMission();
  const annuler = useAnnulerMission();

  const fermer = () => {
    setKmDepart("");
    setKmRetour("");
    setHeuresDepart("");
    setHeuresRetour("");
    setMotif("");
    setFinAConfirmer(null);
    onFermer();
  };

  const validerDemarrer = async () => {
    if (!demarrerCible) return;
    const valeur = Number(kmDepart);
    if (!Number.isFinite(valeur) || valeur < 0) return toast.error("Kilométrage invalide");
    const heures = lireCompteurHeures(heuresDepart);
    if (heures === null) return toast.error("Compteur horaire invalide");
    try {
      await demarrer.mutateAsync({ id: demarrerCible.idMission, kilometrageDepart: valeur, compteurHeuresDepart: heures });
      toast.success("Mission démarrée");
      fermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const validerTerminer = async () => {
    if (!terminerCible) return;
    const valeur = Number(kmRetour);
    if (!Number.isFinite(valeur) || valeur < 0) return toast.error("Kilométrage invalide");
    const heures = lireCompteurHeures(heuresRetour);
    if (heures === null) return toast.error("Compteur horaire invalide");
    await envoyerFin(valeur, heures, false);
  };

  const envoyerFin = async (kilometrageRetour: number, compteurHeuresRetour: number | undefined, confirmer: boolean) => {
    if (!terminerCible) return;
    try {
      await terminer.mutateAsync({ id: terminerCible.idMission, kilometrageRetour, compteurHeuresRetour, confirmer });
      toast.success(confirmer ? "Mission terminée — fin rapide inscrite au journal d'audit" : "Mission terminée");
      fermer();
    } catch (e) {
      if (!confirmer && estSaisieAConfirmer(e)) {
        setFinAConfirmer({ kilometrageRetour, compteurHeuresRetour, points: e.details });
        return;
      }
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const validerAnnuler = async () => {
    if (!annulerCible) return;
    if (!motif.trim()) return toast.error("Motif requis");
    try {
      await annuler.mutateAsync({ id: annulerCible.idMission, motifAnnulation: motif.trim() });
      toast.success("Mission annulée");
      fermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <>
      <Dialog open={!!demarrerCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démarrer la mission</DialogTitle>
            <DialogDescription>{demarrerCible?.motif}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="kmDepart">Kilométrage au départ</Label>
            <Input id="kmDepart" type="number" min={0} value={kmDepart} onChange={(e) => setKmDepart(e.target.value)} />
          </div>
          {aCompteurHoraire(demarrerCible?.engin) && (
            <div className="space-y-2">
              <Label htmlFor="heuresDepart">Compteur horaire au départ (h, facultatif)</Label>
              <Input id="heuresDepart" type="number" min={0} step="0.1" value={heuresDepart} onChange={(e) => setHeuresDepart(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button onClick={validerDemarrer} disabled={demarrer.isPending}>
              {demarrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Démarrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!terminerCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer la mission</DialogTitle>
            <DialogDescription>{terminerCible?.motif}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="kmRetour">Kilométrage au retour</Label>
            <Input id="kmRetour" type="number" min={0} value={kmRetour} onChange={(e) => setKmRetour(e.target.value)} />
            {terminerCible?.kilometrageDepart != null && (
              <p className="text-xs text-muted-foreground">Au départ : {formatNombre(terminerCible.kilometrageDepart)} km</p>
            )}
          </div>
          {aCompteurHoraire(terminerCible?.engin) && (
            <div className="space-y-2">
              <Label htmlFor="heuresRetour">Compteur horaire au retour (h, facultatif)</Label>
              <Input id="heuresRetour" type="number" min={0} step="0.1" value={heuresRetour} onChange={(e) => setHeuresRetour(e.target.value)} />
              {terminerCible?.compteurHeuresDepart != null && (
                <p className="text-xs text-muted-foreground">Au départ : {terminerCible.compteurHeuresDepart} h</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={validerTerminer} disabled={terminer.isPending}>
              {terminer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Terminer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationFinMissionDialog
        points={finAConfirmer?.points ?? null}
        enCours={terminer.isPending}
        onCorriger={() => setFinAConfirmer(null)}
        onConfirmer={() => finAConfirmer && envoyerFin(finAConfirmer.kilometrageRetour, finAConfirmer.compteurHeuresRetour, true)}
      />

      <Dialog open={!!annulerCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la mission</DialogTitle>
            <DialogDescription>{annulerCible?.motif}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motifAnnulation">Motif d'annulation</Label>
            <Input id="motifAnnulation" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={validerAnnuler} disabled={annuler.isPending}>
              {annuler.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Annuler la mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
