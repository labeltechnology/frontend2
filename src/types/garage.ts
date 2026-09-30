export interface GarageExterne {
  idGarageExterne: number;
  nom: string;
  personneContact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  actif: boolean;
}

export interface CreerGarageExterneRequest {
  nom: string;
  personneContact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

export type ModifierGarageExterneRequest = CreerGarageExterneRequest;
