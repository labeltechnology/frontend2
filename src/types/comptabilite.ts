/** Export comptable (2026-09-29) — miroir des DTO serveur (package comptabilite). */
export type SourceComptable = "VENTES_LOCATION" | "FACTURES_GARAGE" | "LOCATION_ENTRANTE" | "CARBURANT" | "MAINTENANCE_INTERNE";

export interface ParametresComptables {
  separateur: ";" | ",";
  journalVentes: string;
  journalAchats: string;
  journalOperationsDiverses: string;
  compteClients: string;
  compteFournisseurs: string;
  compteVentesLocation: string;
  compteTvaCollectee: string;
  compteCarburant: string;
  compteContrepartieCarburant: string;
  compteEntretienGarage: string;
  compteLocationEntrante: string;
  compteMaintenanceInterne: string;
  compteContrepartieMaintenanceInterne: string;
}

export interface ApercuExport {
  debut: string;
  fin: string;
  nombreEcritures: number;
  totalDebit: number;
  totalCredit: number;
  equilibre: boolean;
  nombreIgnores: number;
  sources: { source: SourceComptable; nombreOperations: number; montant: number }[];
  journaux: { journal: string; nombreEcritures: number; debit: number; credit: number }[];
}
