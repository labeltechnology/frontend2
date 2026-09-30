import type { EtapeMiseEnService, MiseEnService } from "@/features/mise-en-service/types";

/** Pourcentage d'une étape, arrondi. */
export function pourcentageEtape(e: Pick<EtapeMiseEnService, "faits" | "total">): number {
  return e.total === 0 ? 0 : Math.round((e.faits * 100) / e.total);
}

/** Première étape pas terminée : celle à faire maintenant (null si tout est fait). */
export function etapeEnCours(m: Pick<MiseEnService, "etapes">): EtapeMiseEnService | null {
  return m.etapes.find((e) => e.faits < e.total) ?? null;
}

/** « 12 points sur 17 », « Tout est réglé ». */
export function texteAvancement(m: Pick<MiseEnService, "faits" | "total">): string {
  if (m.total > 0 && m.faits === m.total) return "Tout est réglé";
  return `${m.faits} point${m.faits > 1 ? "s" : ""} sur ${m.total}`;
}
