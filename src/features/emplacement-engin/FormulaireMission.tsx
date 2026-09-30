import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConducteurs } from "@/features/conducteurs/api";
import { erreurMission, type Occupation } from "@/features/emplacement-engin/occupations";
import { useCreerMission } from "@/features/missions/api";
import { ApiError } from "@/lib/api-client";
import type { Engin } from "@/types/engin";
import { libelleVehicule } from "@/lib/vehicule";

interface FormulaireMissionProps {
  engin: Engin;
  occupations: Occupation[];
  onTermine: () => void;
  onAnnuler: () => void;
}

/**
 * Partie « Mission » du formulaire de la carte « Localisation »
 * (2026-09-25) : motif, conducteur (toujours à choisir, sans
 * présélection — choix de l'utilisateur), début et fin. Bloquée si la
 * mission chevauche une période du véhicule sur un chantier (même règle que
 * le serveur, OccupationEngin).
 */
export function FormulaireMission({ engin, occupations, onTermine, onAnnuler }: FormulaireMissionProps) {
  const { data: conducteurs, isPending: conducteursEnChargement } = useConducteurs();
  const creer = useCreerMission();
  const [motif, setMotif] = useState("");
  const [idConducteur, setIdConducteur] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const enService = (conducteurs ?? [])
    .filter((c) => c.statut === "EN_SERVICE")
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));
  const erreurDates = debut || fin ? erreurMission(debut, fin, format(new Date(), "yyyy-MM-dd'T'HH:mm"), occupations) : null;
  const complet = motif.trim() !== "" && idConducteur !== "" && debut !== "" && fin !== "";
  const valide = complet && erreurDates === null;

  const valider = async () => {
    if (!valide) return;
    setEnvoi(true);
    try {
      await creer.mutateAsync({
        motif: motif.trim(),
        dateDebutPrevue: debut,
        dateFinPrevue: fin,
        idEngin: engin.idEngin,
        idConducteur: Number(idConducteur),
      });
      toast.success(`Mission planifiée pour ${libelleVehicule(engin)}`);
      onTermine();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer la mission");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mission-motif">Motif</Label>
        <Input
          id="mission-motif"
          value={motif}
          maxLength={255}
          placeholder="Ex. : livraison de matériel à Toamasina"
          onChange={(e) => setMotif(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mission-conducteur">Conducteur</Label>
        <Select value={idConducteur} onValueChange={setIdConducteur}>
          <SelectTrigger id="mission-conducteur">
            <SelectValue placeholder={conducteursEnChargement ? "Chargement…" : "Choisir un conducteur"} />
          </SelectTrigger>
          <SelectContent>
            {enService.map((c) => (
              <SelectItem key={c.idConducteur} value={String(c.idConducteur)}>
                {c.prenom} {c.nom} ({c.matricule})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!conducteursEnChargement && enService.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucun conducteur en service.</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mission-debut">Début</Label>
          <Input id="mission-debut" type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mission-fin">Fin</Label>
          <Input id="mission-fin" type="datetime-local" value={fin} min={debut || undefined} onChange={(e) => setFin(e.target.value)} />
        </div>
      </div>
      {erreurDates && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erreurDates}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onAnnuler} disabled={envoi}>
          Annuler
        </Button>
        <Button onClick={valider} disabled={!valide || envoi}>
          {envoi && <Loader2 className="h-4 w-4 animate-spin" />}
          Planifier la mission
        </Button>
      </div>
    </div>
  );
}
