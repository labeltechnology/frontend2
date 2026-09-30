import type { Maintenance } from "@/types/maintenance";

/**
 * Ce qui est fait lors d'une maintenance, en une phrase : les travaux
 * réalisés (V45, 2026-09-25) suivis de la description, sinon le poste
 * d'entretien, sinon la description. Partagé par le rapport véhicule et la
 * page historique.
 */
export function objetMaintenance(m: Pick<Maintenance, "travaux" | "libellePosteEntretien" | "description">): string | null {
  const travaux = (m.travaux ?? []).map((t) => t.libelle);
  if (travaux.length > 0) return travaux.join(", ") + (m.description ? ` — ${m.description}` : "");
  return m.libellePosteEntretien ?? m.description ?? null;
}
