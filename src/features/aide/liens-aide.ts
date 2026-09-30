import type { PageGuide } from "@/types/aide";

/** Lien vers une page du centre d'aide (paramètre « page » de /aide). */
export function cheminPage(id: string): string {
  return `/aide?page=${encodeURIComponent(id)}`;
}

export const LIBELLES_FREQUENCE: Record<PageGuide["frequence"], string> = {
  QUOTIDIENNE: "Tous les jours",
  HEBDOMADAIRE: "Chaque semaine",
  MENSUELLE: "Chaque mois",
  OCCASIONNELLE: "De temps en temps",
};
