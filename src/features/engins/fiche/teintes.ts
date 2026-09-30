/**
 * Teintes des rubriques de la fiche véhicule (bannière + tuiles, 2026-09-24,
 * d'après une maquette « Car Assistance » fournie par l'utilisateur : une
 * couleur par rubrique, reprise sur la tuile, la pastille ronde et l'en-tête
 * de la section). Uniquement des tokens du thème (badge-*), pour rester
 * lisible en clair comme en sombre.
 */
export type TeinteRubrique = "succes" | "info" | "alerte" | "danger" | "neutre";

export const CLASSES_TEINTE: Record<
  TeinteRubrique,
  { pastille: string; texte: string; bouton: string }
> = {
  succes: {
    pastille: "bg-badge-successBg text-badge-successFg",
    texte: "text-badge-successFg",
    bouton: "bg-badge-successBg text-badge-successFg hover:opacity-80",
  },
  info: {
    pastille: "bg-badge-infoBg text-badge-infoFg",
    texte: "text-badge-infoFg",
    bouton: "bg-badge-infoBg text-badge-infoFg hover:opacity-80",
  },
  alerte: {
    pastille: "bg-badge-warningBg text-badge-warningFg",
    texte: "text-badge-warningFg",
    bouton: "bg-badge-warningBg text-badge-warningFg hover:opacity-80",
  },
  danger: {
    pastille: "bg-badge-dangerBg text-badge-dangerFg",
    texte: "text-badge-dangerFg",
    bouton: "bg-badge-dangerBg text-badge-dangerFg hover:opacity-80",
  },
  neutre: {
    pastille: "bg-badge-neutralBg text-badge-neutralFg",
    texte: "text-badge-neutralFg",
    bouton: "bg-badge-neutralBg text-badge-neutralFg hover:opacity-80",
  },
};
