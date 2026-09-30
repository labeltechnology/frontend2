import type { Carburant, TypeApprovisionnement } from "@/types/carburant";

/**
 * Type de saisie carburant (2026-09-28) : plein complet, appoint ou bidon.
 * Miroir de backend carburant/TypeApprovisionnement et ConsommationUtils —
 * même règle « plein à plein » des deux côtés. Fonctions pures.
 */

export const TYPES_APPROVISIONNEMENT: readonly TypeApprovisionnement[] = ["PLEIN_COMPLET", "APPOINT", "BIDON"];

export const LIBELLES_APPROVISIONNEMENT: Record<TypeApprovisionnement, string> = {
  PLEIN_COMPLET: "Plein complet",
  APPOINT: "Appoint",
  BIDON: "Bidon",
};

/** Libellé d'une saisie ; valeur absente (ancienne donnée) = plein complet. */
export function libelleApprovisionnement(type: TypeApprovisionnement | null | undefined): string {
  return LIBELLES_APPROVISIONNEMENT[type ?? "PLEIN_COMPLET"];
}

export function estPleinComplet(saisie: Pick<Carburant, "typeApprovisionnement">): boolean {
  return (saisie.typeApprovisionnement ?? "PLEIN_COMPLET") === "PLEIN_COMPLET";
}

export interface TronconConsommation {
  distance: number;
  litres: number;
}

/**
 * Tronçons plein à plein : de chaque plein complet au suivant, litres de
 * toutes les saisies après le premier jusqu'au second inclus (appoints et
 * bidons compris). Les saisies avant le premier plein complet et après le
 * dernier sont ignorées. `saisies` : un même véhicule, dans n'importe quel ordre.
 */
export function tronconsPleinAPlein(saisies: readonly Carburant[]): TronconConsommation[] {
  const triees = [...saisies].sort((a, b) => a.kilometrageAuPlein - b.kilometrageAuPlein);
  const troncons: TronconConsommation[] = [];
  let kmPlein: number | null = null;
  let litres = 0;
  for (const s of triees) {
    if (kmPlein === null) {
      if (estPleinComplet(s)) kmPlein = s.kilometrageAuPlein;
      continue;
    }
    litres += s.quantiteLitres;
    if (estPleinComplet(s)) {
      const distance = s.kilometrageAuPlein - kmPlein;
      if (distance > 0) troncons.push({ distance, litres });
      kmPlein = s.kilometrageAuPlein;
      litres = 0;
    }
  }
  return troncons;
}
