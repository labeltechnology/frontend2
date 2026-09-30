import type { CoutsChantier } from "@/types/chantier";
import type { TableauExport } from "@/lib/tableau-export";
import { formatDate } from "@/lib/utils";

/**
 * Coûts réels à date d'un chantier (2026-09-29) — logique pure : tableau
 * Excel et parts de chaque poste. Les montants viennent du serveur
 * (SuiviChantiersService.couts) : carburant de la période, maintenances
 * commencées pendant la période, coûts fixes au prorata des jours.
 */

export type PosteCout = "carburant" | "maintenance" | "coutsFixes";

export const LIBELLES_POSTES: Record<PosteCout, string> = {
  carburant: "Carburant",
  maintenance: "Maintenance",
  coutsFixes: "Coûts fixes",
};

/** Part (0–100, arrondie) de chaque poste dans le total ; 0 partout si le total est nul. */
export function partsPostes(couts: Pick<CoutsChantier, PosteCout | "total">): Record<PosteCout, number> {
  const part = (v: number) => (couts.total > 0 ? Math.round((v / couts.total) * 100) : 0);
  return { carburant: part(couts.carburant), maintenance: part(couts.maintenance), coutsFixes: part(couts.coutsFixes) };
}

/** Tableau exporté : une ligne par véhicule puis une ligne « Total ». */
export function tableauCoutsChantier(couts: CoutsChantier): TableauExport {
  return {
    titre: `Coûts du chantier ${couts.nomChantier}`,
    sousTitre: `Coûts réels au ${formatDate(couts.calculeLe)}`,
    colonnes: [
      { libelle: "Véhicule", format: "TEXTE" },
      { libelle: "Type", format: "TEXTE" },
      { libelle: "Du", format: "TEXTE" },
      { libelle: "Au", format: "TEXTE" },
      { libelle: "Jours", format: "NOMBRE" },
      { libelle: "Litres", format: "DECIMAL" },
      { libelle: "Carburant", format: "MONTANT" },
      { libelle: "Maintenance", format: "MONTANT" },
      { libelle: "Coûts fixes", format: "MONTANT" },
      { libelle: "Total", format: "MONTANT" },
      { libelle: "Heures (journal)", format: "DECIMAL" },
      { libelle: "Coût / heure", format: "MONTANT" },
    ],
    lignes: [
      ...couts.vehicules.map((l) => [
        l.vehicule,
        l.typeEngin ?? "",
        formatDate(l.debut),
        formatDate(l.fin),
        l.jours,
        l.litres,
        l.carburant,
        l.maintenance,
        l.coutsFixes,
        l.total,
        l.heuresJournal,
        l.coutParHeure,
      ]),
      [
        "Total",
        "",
        "",
        "",
        couts.joursVehicules,
        couts.vehicules.reduce((s, l) => s + l.litres, 0),
        couts.carburant,
        couts.maintenance,
        couts.coutsFixes,
        couts.total,
        couts.heuresJournal,
        couts.heuresJournal > 0 ? Math.round((couts.total / couts.heuresJournal) * 100) / 100 : null,
      ],
    ],
  };
}
