import type { ValeurEquipementBord } from "@/features/equipements-bord/ChecklistEquipementsBord";
import type { EquipementBord, SaisieEquipementBordRequest } from "@/types/equipement-bord";

/** Lignes réellement renseignées (Oui ou Non), au format attendu par l'API. */
export function saisiesRenseignees(valeurs: Record<number, ValeurEquipementBord>): SaisieEquipementBordRequest[] {
  return Object.entries(valeurs)
    .filter(([, v]) => v.present !== undefined)
    .map(([id, v]) => ({
      idElementBord: Number(id),
      present: v.present as boolean,
      observation: v.observation.trim() || undefined,
    }));
}

/** État déjà enregistré d'un engin → valeurs éditables de la checklist. */
export function valeursDepuisEtat(etat: EquipementBord[]): Record<number, ValeurEquipementBord> {
  const valeurs: Record<number, ValeurEquipementBord> = {};
  for (const ligne of etat) {
    valeurs[ligne.idElementBord] = { present: ligne.present ?? undefined, observation: ligne.observation ?? "" };
  }
  return valeurs;
}
