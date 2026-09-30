import { CalendarClock, CheckCircle2, Coins, Wrench, type LucideIcon } from "lucide-react";
import type { FiltreStatut, IndicateursMaintenance as Indicateurs } from "@/features/maintenance/liste/maintenance-liste";
import { cn, formatMontant } from "@/lib/utils";

interface Tuile {
  cle: string;
  libelle: string;
  valeur: string;
  detail: string | null;
  icone: LucideIcon;
  ton: string;
  filtre: FiltreStatut | null;
}

/**
 * Quatre chiffres en tête de la page Maintenance (2026-09-28). Un clic sur
 * une tuile filtre la liste (planifiées, en cours, terminées).
 */
export function IndicateursMaintenance({
  indicateurs,
  filtreActif,
  onFiltrer,
}: {
  indicateurs: Indicateurs;
  filtreActif: FiltreStatut;
  onFiltrer: (statut: FiltreStatut) => void;
}) {
  const tuiles: Tuile[] = [
    {
      cle: "planifiees",
      libelle: "Planifiées",
      valeur: String(indicateurs.planifiees),
      detail: indicateurs.enRetard > 0 ? `dont ${indicateurs.enRetard} en retard` : null,
      icone: CalendarClock,
      ton: indicateurs.enRetard > 0 ? "text-badge-warningFg" : "text-foreground",
      filtre: indicateurs.enRetard > 0 ? "EN_RETARD" : "PLANIFIEE",
    },
    {
      cle: "en-cours",
      libelle: "En cours",
      valeur: String(indicateurs.enCours),
      detail: `${indicateurs.vehiculesImmobilises} véhicule(s) immobilisé(s)`,
      icone: Wrench,
      ton: indicateurs.enCours > 0 ? "text-badge-infoFg" : "text-foreground",
      filtre: "EN_COURS",
    },
    {
      cle: "terminees",
      libelle: "Terminées ce mois",
      valeur: String(indicateurs.termineesCeMois),
      detail: null,
      icone: CheckCircle2,
      ton: "text-badge-successFg",
      filtre: "TERMINEE",
    },
    {
      cle: "cout",
      libelle: "Coût du mois",
      valeur: formatMontant(indicateurs.coutCeMois),
      detail: "maintenances terminées",
      icone: Coins,
      ton: "text-foreground",
      filtre: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tuiles.map(({ cle, libelle, valeur, detail, icone: Icone, ton, filtre }) => {
        const actif = filtre !== null && filtreActif === filtre;
        const contenu = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{libelle}</span>
              <Icone className={cn("h-4 w-4", ton)} aria-hidden />
            </div>
            <div className={cn("mt-1 text-2xl font-semibold tabular-nums", ton)}>{valeur}</div>
            {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
          </>
        );
        const classes = cn(
          "rounded-lg border bg-card p-3 text-left transition-colors",
          actif && "border-primary ring-1 ring-primary",
        );
        return filtre === null ? (
          <div key={cle} className={classes}>
            {contenu}
          </div>
        ) : (
          <button
            key={cle}
            type="button"
            aria-pressed={actif}
            onClick={() => onFiltrer(actif ? "TOUTES" : filtre)}
            className={cn(classes, "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
          >
            {contenu}
          </button>
        );
      })}
    </div>
  );
}
