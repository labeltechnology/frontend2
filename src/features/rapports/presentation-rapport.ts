import {
  BarChart3,
  Building2,
  Car,
  ClipboardList,
  FileWarning,
  Fuel,
  Gauge,
  HardHat,
  LayoutDashboard,
  Route,
  TrendingUp,
  TriangleAlert,
  UserRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CleIconeRapport, FamilleRapport } from "@/features/rapports/catalogue";
import type { TonIndicateur } from "@/types/rapport";

/**
 * Icônes et couleurs de la page Rapports (2026-09-28). Les teintes suivent les
 * jetons du thème (badge-*), en clair comme en nuit ; mêmes sens que le PDF
 * (vert = bon, orange = à surveiller, rouge = critique).
 */
export const ICONES_RAPPORT: Record<CleIconeRapport, LucideIcon> = {
  synthese: LayoutDashboard,
  vehicule: Car,
  conducteur: UserRound,
  chantier: HardHat,
  missions: Route,
  maintenance: Wrench,
  carburant: Fuel,
  incidents: TriangleAlert,
  rentabilite: TrendingUp,
  tresorerie: Wallet,
  parc: Building2,
  documents: FileWarning,
  utilisation: Gauge,
};

export const ICONE_PAR_DEFAUT: LucideIcon = BarChart3;
export const ICONE_LISTE: LucideIcon = ClipboardList;

/** Pastille d'icône de chaque famille. */
export const TEINTE_FAMILLE: Record<FamilleRapport, string> = {
  SYNTHESES: "bg-badge-infoBg text-badge-infoFg",
  ACTIVITE: "bg-badge-warningBg text-badge-warningFg",
  FINANCES: "bg-badge-successBg text-badge-successFg",
  PARC: "bg-badge-neutralBg text-badge-neutralFg",
};

export const CLASSES_TON: Record<TonIndicateur, { bande: string; valeur: string; barre: string }> = {
  NEUTRE: { bande: "bg-badge-infoFg", valeur: "text-foreground", barre: "bg-badge-infoFg" },
  POSITIF: { bande: "bg-badge-successFg", valeur: "text-badge-successFg", barre: "bg-badge-successFg" },
  ATTENTION: { bande: "bg-badge-warningFg", valeur: "text-badge-warningFg", barre: "bg-badge-warningFg" },
  CRITIQUE: { bande: "bg-badge-dangerFg", valeur: "text-badge-dangerFg", barre: "bg-badge-dangerFg" },
};

/** Barres sans signification particulière : teintes froides tournantes (comme le PDF). */
export const BARRES_NEUTRES = ["bg-badge-infoFg", "bg-primary", "bg-badge-neutralFg"];
