import type { TypeDocument } from "@/types/document";

/**
 * Libellés affichés des types de document — une seule source pour l'écran
 * Documents et la fiche véhicule (ajouté le 2026-09-24 avec les trois
 * nouveaux types de la fiche de suivi de l'utilisateur).
 */
export const LIBELLES_TYPE_DOCUMENT: Record<TypeDocument, string> = {
  CARTE_GRISE: "Carte grise",
  ASSURANCE: "Assurance",
  VISITE_TECHNIQUE: "Visite technique",
  CONFORMITE_FISCALE: "Conformité fiscale",
  LICENCE_TRANSPORT: "Licence de transport",
  CARTE_CARBURANT: "Carte carburant",
  PERMIS_CONDUIRE: "Permis de conduire",
  AUTRE: "Autre",
};

/** Ordre de présentation (celui de la fiche papier), réutilisé par les listes déroulantes. */
export const TYPES_DOCUMENT: TypeDocument[] = [
  "ASSURANCE",
  "VISITE_TECHNIQUE",
  "CARTE_GRISE",
  "CONFORMITE_FISCALE",
  "LICENCE_TRANSPORT",
  "CARTE_CARBURANT",
  "PERMIS_CONDUIRE",
  "AUTRE",
];
