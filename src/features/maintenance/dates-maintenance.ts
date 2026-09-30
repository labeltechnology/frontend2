/**
 * Dates des champs « date et heure » de la maintenance (2026-09-28) :
 * format « AAAA-MM-JJTHH:mm » de l'input datetime-local, heure locale.
 * Partagé par le formulaire (FaireMaintenanceDialog) et « Replanifier ».
 */

/** Minuit aujourd'hui : borne basse des dates prévues (le serveur refuse un jour passé). */
export function debutAujourdhui(maintenant: Date = new Date()): string {
  const d = maintenant;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00`;
}

/** Date serveur (« 2026-10-02T08:00:00 ») → valeur du champ (« 2026-10-02T08:00 ») ; vide si absente. */
export function versChampDateHeure(dateServeur: string | null | undefined): string {
  return dateServeur ? dateServeur.slice(0, 16) : "";
}

/** Jour passé ? (comparaison au jour, comme le serveur) */
export function estJourPasse(valeurChamp: string, maintenant: Date = new Date()): boolean {
  return valeurChamp !== "" && valeurChamp.slice(0, 10) < debutAujourdhui(maintenant).slice(0, 10);
}
