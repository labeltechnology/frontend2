import {
  Bell,
  CircleCheck,
  CircleHelp,
  Cog,
  FileText,
  Fuel,
  MapPin,
  OctagonAlert,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { FamilleBloc, NiveauRapport } from "@/features/rapport-engin/niveaux";

/**
 * Présentation des niveaux du rapport véhicule : couleurs (tokens badge-* du
 * thème, lisibles en clair, sombre et « Nuit vitrée »), libellés et
 * pictogrammes. La couleur n'est jamais le seul indice : chaque niveau a
 * aussi son pictogramme et son libellé (accessibilité, impression N&B).
 *
 * Classes écrites en toutes lettres : Tailwind ne génère que les classes
 * qu'il trouve telles quelles dans le code.
 */
export const LIBELLES_NIVEAU: Record<NiveauRapport, string> = {
  ok: "OK",
  avertissement: "Avertissement",
  alerte: "Alerte",
  inconnu: "Non renseigné",
};

export const ICONES_NIVEAU: Record<NiveauRapport, LucideIcon> = {
  ok: CircleCheck,
  avertissement: TriangleAlert,
  alerte: OctagonAlert,
  inconnu: CircleHelp,
};

export const CLASSES_NIVEAU: Record<
  NiveauRapport,
  {
    /** Pastille / badge : fond pâle + texte vif. */
    pastille: string;
    /** Texte ou icône seule. */
    texte: string;
    /** Bordure d'accent de la carte. */
    bordure: string;
    /** Trait et points du connecteur SVG. */
    trait: string;
    point: string;
  }
> = {
  ok: {
    pastille: "bg-badge-successBg text-badge-successFg",
    texte: "text-badge-successFg",
    bordure: "border-badge-successFg/60",
    trait: "stroke-badge-successFg",
    point: "fill-badge-successFg",
  },
  avertissement: {
    pastille: "bg-badge-warningBg text-badge-warningFg",
    texte: "text-badge-warningFg",
    bordure: "border-badge-warningFg/60",
    trait: "stroke-badge-warningFg",
    point: "fill-badge-warningFg",
  },
  alerte: {
    pastille: "bg-badge-dangerBg text-badge-dangerFg",
    texte: "text-badge-dangerFg",
    bordure: "border-badge-dangerFg/60",
    trait: "stroke-badge-dangerFg",
    point: "fill-badge-dangerFg",
  },
  inconnu: {
    pastille: "bg-badge-neutralBg text-badge-neutralFg",
    texte: "text-badge-neutralFg",
    bordure: "border-border",
    trait: "stroke-badge-neutralFg",
    point: "fill-badge-neutralFg",
  },
};

export const ICONES_FAMILLE: Record<FamilleBloc, LucideIcon> = {
  alertes: Bell,
  documents: FileText,
  equipements: ShieldCheck,
  entretien: Cog,
  emplacement: MapPin,
  conducteur: UserRound,
  carburant: Fuel,
  incidents: ShieldAlert,
};

/**
 * Variante du composant Badge pour chaque niveau (tableaux de la page
 * historique) — mêmes couleurs que les cartes du rapport.
 */
export const VARIANTE_BADGE_NIVEAU: Record<NiveauRapport, "success" | "warning" | "destructive" | "secondary"> = {
  ok: "success",
  avertissement: "warning",
  alerte: "destructive",
  inconnu: "secondary",
};
