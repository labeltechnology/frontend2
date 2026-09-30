import type { TableauExport } from "@/lib/tableau-export";
import type { PosteCoutChantier, RentabiliteChantier, UniteTarif } from "@/types/chantier";

/**
 * Rentabilité matériel des chantiers (V64, 2026-09-29) — logique pure :
 * libellés, couleur de la marge, tableau Excel du classement.
 */

export const LIBELLES_POSTE: Record<PosteCoutChantier, string> = {
  CARBURANT: "Carburant",
  MAINTENANCE: "Maintenance",
  COUTS_FIXES: "Coûts fixes",
};

export const LIBELLES_UNITE: Record<UniteTarif, string> = {
  JOUR: "par jour",
  HEURE: "par heure",
};

/** Verdict matériel : rentable (marge ≥ 0), déficitaire, ou non chiffré (aucun tarif). */
export type Verdict = "RENTABLE" | "DEFICITAIRE" | "NON_CHIFFRE";

export function verdict(r: Pick<RentabiliteChantier, "refacturable" | "marge">): Verdict {
  if (r.refacturable <= 0) return "NON_CHIFFRE";
  return r.marge >= 0 ? "RENTABLE" : "DEFICITAIRE";
}

export const LIBELLES_VERDICT: Record<Verdict, string> = {
  RENTABLE: "Rentable",
  DEFICITAIRE: "Déficitaire",
  NON_CHIFFRE: "Non chiffré",
};

export const VARIANT_VERDICT: Record<Verdict, "success" | "destructive" | "outline"> = {
  RENTABLE: "success",
  DEFICITAIRE: "destructive",
  NON_CHIFFRE: "outline",
};

/** Budget dépassé (écart positif) en rouge, sinon vert ; rien sans budget. */
export function classeEcartBudget(ecart: number | null): string {
  if (ecart == null) return "text-muted-foreground";
  return ecart > 0 ? "text-destructive" : "text-emerald-600";
}

export function tableauClassement(lignes: RentabiliteChantier[], date: string): TableauExport {
  return {
    titre: "Classement des chantiers — coût du matériel",
    sousTitre: `Coûts réels au ${date}`,
    colonnes: [
      { libelle: "Chantier", format: "TEXTE" },
      { libelle: "Type", format: "TEXTE" },
      { libelle: "Jours-véhicule", format: "NOMBRE" },
      { libelle: "Coût réel", format: "MONTANT" },
      { libelle: "Coût / jour-véhicule", format: "MONTANT" },
      { libelle: "Poste dominant", format: "TEXTE" },
      { libelle: "Budget", format: "MONTANT" },
      { libelle: "Écart au budget", format: "MONTANT" },
      { libelle: "Refacturable", format: "MONTANT" },
      { libelle: "Marge", format: "MONTANT" },
      { libelle: "Taux de marge (%)", format: "DECIMAL" },
      { libelle: "Verdict", format: "TEXTE" },
    ],
    lignes: lignes.map((r) => [
      r.nomChantier,
      r.typeChantier ?? "",
      r.joursVehicules,
      r.coutReel,
      r.coutParJourVehicule,
      r.posteDominant ? LIBELLES_POSTE[r.posteDominant] : "",
      r.budgetMateriel,
      r.ecartBudget,
      r.refacturable,
      r.marge,
      r.tauxMarge,
      LIBELLES_VERDICT[verdict(r)],
    ]),
  };
}
