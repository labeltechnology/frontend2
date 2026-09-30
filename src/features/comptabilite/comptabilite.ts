import type { ClePeriode } from "@/features/rapports/periodes";
import type { ParametresComptables, SourceComptable } from "@/types/comptabilite";

/**
 * Export comptable (2026-09-29, question du DG « intégration comptable »),
 * règles d'écran sans React. Miroir de comptabilite/calcul/GenerateurEcritures :
 * chaque opération devient une pièce équilibrée (débit = crédit).
 */
export const SOURCES: { cle: SourceComptable; libelle: string; description: string }[] = [
  { cle: "VENTES_LOCATION", libelle: "Factures de location (ventes)", description: "Client au débit, vente et TVA au crédit. Journal des ventes." },
  { cle: "FACTURES_GARAGE", libelle: "Factures de garage", description: "Entretien au débit, fournisseur au crédit. Journal des achats." },
  { cle: "LOCATION_ENTRANTE", libelle: "Location d'engins (entrante)", description: "Location au débit, prestataire au crédit. Journal des achats." },
  { cle: "CARBURANT", libelle: "Carburant", description: "Carburant au débit, contrepartie au crédit. Journal des achats." },
  {
    cle: "MAINTENANCE_INTERNE",
    libelle: "Maintenance à l'atelier",
    description: "Entretien au débit, pièces et main-d'œuvre au crédit. Opérations diverses.",
  },
];

export const TOUTES_SOURCES: SourceComptable[] = SOURCES.map((s) => s.cle);

export function libelleSource(s: SourceComptable): string {
  return SOURCES.find((x) => x.cle === s)?.libelle ?? s;
}

/** Périodes proposées (les plus utiles pour une clôture). */
export const PERIODES_EXPORT: ClePeriode[] = ["MOIS_DERNIER", "CE_MOIS", "TRIMESTRE", "CETTE_ANNEE"];

/** Même limite que le serveur (performance/calcul/Periode.JOURS_MAXIMUM). */
export const JOURS_MAXIMUM = 1100;

/** Message d'erreur de la période, ou null si elle est valide. Dates AAAA-MM-JJ. */
export function erreurPeriode(debut: string, fin: string): string | null {
  if (!debut || !fin) return "Choisissez un début et une fin.";
  if (fin < debut) return "La fin doit être après le début.";
  const jours = Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${debut}T00:00:00Z`)) / 86_400_000) + 1;
  if (jours > JOURS_MAXIMUM) return `La période ne peut pas dépasser ${JOURS_MAXIMUM} jours.`;
  return null;
}

/** Paramètre « sources » attendu par le serveur (liste séparée par des virgules ; vide = toutes). */
export function parametreSources(sources: SourceComptable[]): string | undefined {
  return sources.length === 0 || sources.length === TOUTES_SOURCES.length ? undefined : sources.join(",");
}

/** Comptes et journaux affichés dans le formulaire des paramètres, par groupe. */
export const CHAMPS_PLAN: { groupe: string; champs: { cle: Exclude<keyof ParametresComptables, "separateur">; libelle: string }[] }[] = [
  {
    groupe: "Journaux",
    champs: [
      { cle: "journalVentes", libelle: "Ventes" },
      { cle: "journalAchats", libelle: "Achats" },
      { cle: "journalOperationsDiverses", libelle: "Opérations diverses" },
    ],
  },
  {
    groupe: "Tiers",
    champs: [
      { cle: "compteClients", libelle: "Clients" },
      { cle: "compteFournisseurs", libelle: "Fournisseurs" },
    ],
  },
  {
    groupe: "Ventes",
    champs: [
      { cle: "compteVentesLocation", libelle: "Location de véhicules" },
      { cle: "compteTvaCollectee", libelle: "TVA collectée" },
    ],
  },
  {
    groupe: "Charges",
    champs: [
      { cle: "compteCarburant", libelle: "Carburant" },
      { cle: "compteContrepartieCarburant", libelle: "Contrepartie du carburant" },
      { cle: "compteEntretienGarage", libelle: "Entretien par garage" },
      { cle: "compteLocationEntrante", libelle: "Location d'engins" },
      { cle: "compteMaintenanceInterne", libelle: "Maintenance à l'atelier" },
      { cle: "compteContrepartieMaintenanceInterne", libelle: "Contrepartie (pièces, main-d'œuvre)" },
    ],
  },
];
