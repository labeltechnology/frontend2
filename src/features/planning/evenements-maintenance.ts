import type { Maintenance } from "@/types/maintenance";
import type { EvenementPlanningRessource } from "@/types/planning";

/**
 * Maintenances → barres ROUGES du planning des véhicules (2026-09-25,
 * « ajouter le planning de maintenance en rouge »). Logique pure, testable.
 *
 * - En cours : du début jusqu'à aujourd'hui (la fin n'est pas encore connue).
 * - Terminée : du début à la fin.
 * - Planifiée : à sa date de début si elle est connue (une journée, ou jusqu'à
 *   la date de fin si elle est renseignée), sinon à sa date prévue (V54,
 *   2026-09-28) ; sans date, rien à placer.
 * Libellé : poste d'entretien, sinon description, sinon type (préventive…).
 * Non déplaçable dans le planning (pas de mission derrière).
 */
function jour(dateIso: string): string {
  return dateIso.slice(0, 10);
}

function libelle(m: Maintenance): string {
  if (m.libellePosteEntretien) return m.libellePosteEntretien;
  if (m.description?.trim()) return m.description.trim();
  return m.type === "PREVENTIVE" ? "Maintenance préventive" : "Maintenance corrective";
}

export function evenementsMaintenances(maintenances: Maintenance[], aujourdhui: Date): EvenementPlanningRessource[] {
  const jourCourant = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}-${String(aujourdhui.getDate()).padStart(2, "0")}`;
  const evenements: EvenementPlanningRessource[] = [];
  for (const m of maintenances) {
    const dateDepart = m.dateDebut ?? (m.statut === "PLANIFIEE" ? m.datePrevue : null);
    if (!m.engin || !dateDepart) continue;
    const debut = jour(dateDepart);
    let fin: string;
    if (m.statut === "EN_COURS") fin = m.dateFin ? jour(m.dateFin) : jourCourant < debut ? debut : jourCourant;
    else fin = m.dateFin ? jour(m.dateFin) : debut;
    if (fin < debut) fin = debut;
    evenements.push({
      id: `maintenance-${m.idMaintenance}`,
      idRessource: m.engin.idEngin,
      type: "MAINTENANCE",
      libelle: libelle(m),
      sousLibelle: m.nomGarageExterne ?? "Atelier interne",
      // Heure locale explicite (même raison que evenements-chantier.ts).
      debut: `${debut}T00:00:00`,
      fin: `${fin}T00:00:00`,
      statut: m.statut,
    });
  }
  return evenements;
}
