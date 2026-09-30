/**
 * Onglets de la page « Historique du véhicule » (2026-09-25) : un par carte
 * du rapport. La clé d'un onglet est la clé du bloc correspondant du rapport
 * (BlocRapport.cle) : le bouton « Voir détail » d'une carte ouvre donc
 * directement le bon onglet (paramètre d'URL `?onglet=`).
 */
export const ONGLETS_HISTORIQUE = [
  { cle: "alertes", libelle: "Alertes et maintenance" },
  { cle: "documents", libelle: "Documents" },
  { cle: "equipements", libelle: "Sécurité et outils" },
  { cle: "entretien", libelle: "Entretien" },
  { cle: "emplacement", libelle: "Emplacements" },
  { cle: "conducteur", libelle: "Conducteurs" },
  { cle: "carburant", libelle: "Carburant" },
  { cle: "incidents", libelle: "Incidents" },
] as const;

export type OngletHistorique = (typeof ONGLETS_HISTORIQUE)[number]["cle"];

export const ONGLET_PAR_DEFAUT: OngletHistorique = "alertes";

export function estOngletHistorique(valeur: string | null | undefined): valeur is OngletHistorique {
  return ONGLETS_HISTORIQUE.some((o) => o.cle === valeur);
}

/** Onglet demandé dans l'URL, ou l'onglet par défaut s'il est absent ou inconnu. */
export function ongletDepuisParametre(valeur: string | null | undefined): OngletHistorique {
  return estOngletHistorique(valeur) ? valeur : ONGLET_PAR_DEFAUT;
}

/** « /engins/12/historique?onglet=documents » ; une clé inconnue ouvre l'onglet par défaut. */
export function cheminHistorique(idEngin: number, onglet?: string): string {
  const cle = ongletDepuisParametre(onglet);
  return `/engins/${idEngin}/historique?onglet=${cle}`;
}
