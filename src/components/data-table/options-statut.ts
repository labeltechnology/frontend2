import type { OptionFiltre } from "@/components/data-table/liste";
import { libelleEnum } from "@/lib/utils";

/** Options d'un filtre rapide par statut, libellés comme les pastilles (StatutBadge). */
export function optionsStatut(codes: readonly string[]): OptionFiltre[] {
  return codes.map((valeur) => ({ valeur, libelle: libelleEnum(valeur) }));
}
