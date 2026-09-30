export interface LigneProforma {
  libelle: string;
  prixUnitaire: number;
  quantite: number;
  /** Nombre de jours facturés pour cette ligne (location d'engin) — 1 pour une prestation ponctuelle. */
  nombreJours: number;
  total: number;
}

export interface LigneProformaRequest {
  libelle: string;
  prixUnitaire: number;
  quantite: number;
  /** Nombre de jours facturés pour cette ligne (location d'engin) — 1 pour une prestation ponctuelle. */
  nombreJours: number;
}

/**
 * Facture proforma — document libre et indépendant (devis), non lié à un
 * contrat de location existant (choix confirmé avec l'utilisateur). Pas de
 * statut : un devis non engageant se refait plutôt qu'il ne se corrige.
 */
export interface FactureProforma {
  idFactureProforma: number;
  reference: string;
  clientNom: string;
  clientContact: string | null;
  clientTelephone: string | null;
  clientAdresse: string | null;
  dateEmission: string;
  validiteJours: number | null;
  mentionPied: string | null;
  tauxTvaApplique: number;
  montantHt: number;
  montantTva: number;
  montantTtc: number;
  lignes: LigneProforma[];
}

export interface CreerFactureProformaRequest {
  clientNom: string;
  clientContact?: string;
  clientTelephone?: string;
  clientAdresse?: string;
  validiteJours?: number;
  mentionPied?: string;
  lignes: LigneProformaRequest[];
}
