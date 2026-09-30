import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { HardHat, Route } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormulaireChantier } from "@/features/emplacement-engin/FormulaireChantier";
import { FormulaireMission } from "@/features/emplacement-engin/FormulaireMission";
import { occupationsDuVehicule } from "@/features/emplacement-engin/occupations";
import { cn } from "@/lib/utils";
import type { AffectationChantier } from "@/types/chantier";
import type { Engin } from "@/types/engin";
import type { Mission } from "@/types/mission";
import { libelleVehicule } from "@/lib/vehicule";

type Choix = "mission" | "chantier";

interface PlanifierEmplacementDialogProps {
  engin: Engin;
  /** Missions et rattachements déjà chargés par le rapport (pour les contrôles de chevauchement). */
  missions: Mission[];
  rattachements: AffectationChantier[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHOIX: { cle: Choix; libelle: string; description: string; icone: typeof Route }[] = [
  { cle: "mission", libelle: "Mission", description: "Déplacement avec un conducteur", icone: Route },
  { cle: "chantier", libelle: "Chantier", description: "Période sur un chantier existant", icone: HardHat },
];

/**
 * « Mission ou chantier » (2026-09-25, bouton de la carte « Emplacement du
 * jour » du rapport véhicule) : planifier une mission ou prévoir le
 * véhicule sur un chantier, avec une date de début et de fin. Chaque partie
 * est un composant séparé (FormulaireMission, FormulaireChantier) ; les
 * règles sont dans occupations.ts.
 */
export function PlanifierEmplacementDialog({
  engin,
  missions,
  rattachements,
  open,
  onOpenChange,
}: PlanifierEmplacementDialogProps) {
  const [choix, setChoix] = useState<Choix>("mission");
  useEffect(() => {
    if (open) setChoix("mission");
  }, [open]);

  const occupations = useMemo(
    () => occupationsDuVehicule(engin.idEngin, missions, rattachements),
    [engin.idEngin, missions, rattachements],
  );
  const idsChantiersDejaRattaches = useMemo(
    () =>
      new Set(
        rattachements
          .filter((r) => r.engin.idEngin === engin.idEngin && r.statut === "ACTIVE")
          .map((r) => r.chantier.idChantier),
      ),
    [engin.idEngin, rattachements],
  );
  const aujourdhui = format(new Date(), "yyyy-MM-dd");
  const fermer = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Mission ou chantier — {libelleVehicule(engin)}</DialogTitle>
          <DialogDescription>
            Le véhicule ne peut pas être en mission et sur un chantier les mêmes jours.
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Type d'emplacement" className="grid grid-cols-2 gap-2">
          {CHOIX.map(({ cle, libelle, description, icone: Icone }) => (
            <button
              key={cle}
              type="button"
              role="radio"
              aria-checked={choix === cle}
              onClick={() => setChoix(cle)}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                choix === cle ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
              )}
            >
              <Icone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium">{libelle}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
            </button>
          ))}
        </div>

        {choix === "mission" ? (
          <FormulaireMission key="mission" engin={engin} occupations={occupations} onTermine={fermer} onAnnuler={fermer} />
        ) : (
          <FormulaireChantier
            key="chantier"
            engin={engin}
            occupations={occupations}
            idsChantiersDejaRattaches={idsChantiersDejaRattaches}
            aujourdhui={aujourdhui}
            onTermine={fermer}
            onAnnuler={fermer}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
