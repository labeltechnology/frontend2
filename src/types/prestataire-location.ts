/**
 * Liste maîtresse des prestataires externes auprès desquels l'entreprise
 * peut louer un engin/véhicule (voir ContratLocationEntrante). Demande
 * explicite de l'utilisateur (« une section prestataire au lieu d'ecrire
 * tous le temps sur la location entrant ») : remplace la saisie libre du
 * nom/contact du prestataire à chaque contrat — mêmes champs que
 * Fournisseur/GarageExterne, page dédiée de gestion (CRUD + activation).
 */
export interface PrestataireLocation {
  idPrestataireLocation: number;
  nom: string;
  personneContact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  actif: boolean;
}

export interface CreerPrestataireLocationRequest {
  nom: string;
  personneContact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

export type ModifierPrestataireLocationRequest = CreerPrestataireLocationRequest;
