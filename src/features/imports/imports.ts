import type { StatutLigneImport, TypeImport } from "@/types/importation";

/**
 * Import Excel / CSV (2026-09-29) : types proposés, statuts et contrôles du
 * fichier avant envoi, sans React. Colonnes et règles : serveur
 * (importation/calcul/TypeImport, Conversions).
 */
export const TYPES_IMPORT: { cle: TypeImport; chemin: string; libelle: string; description: string }[] = [
  { cle: "VEHICULES", chemin: "vehicules", libelle: "Véhicules", description: "Type, marque, modèle, immatriculation ou n° de série, fiche technique, compteurs." },
  { cle: "CONDUCTEURS", chemin: "conducteurs", libelle: "Conducteurs", description: "Matricule, nom, prénom, catégorie, permis ou CACES." },
  { cle: "PLEINS", chemin: "pleins", libelle: "Pleins de carburant", description: "Relevé de carte carburant : véhicule, date, kilométrage, litres, montant." },
];

export const STATUTS_LIGNE: Record<StatutLigneImport, { libelle: string; classes: string }> = {
  OK: { libelle: "Prête", classes: "bg-badge-successBg text-badge-successFg" },
  AVERTISSEMENT: { libelle: "À vérifier", classes: "bg-badge-warningBg text-badge-warningFg" },
  ERREUR: { libelle: "Erreur", classes: "bg-badge-dangerBg text-badge-dangerFg" },
};

export const TAILLE_MAX_OCTETS = 5 * 1024 * 1024;
const EXTENSIONS = [".xlsx", ".csv", ".txt"];

/** Message d'erreur si le fichier ne peut pas être envoyé, sinon null. */
export function erreurFichier(f: { name: string; size: number } | null): string | null {
  if (!f) return "Choisissez un fichier.";
  const nom = f.name.toLowerCase();
  if (nom.endsWith(".xls")) return "Format .xls : enregistrez le fichier au format .xlsx depuis Excel.";
  if (!EXTENSIONS.some((e) => nom.endsWith(e))) return "Formats acceptés : .xlsx ou .csv.";
  if (f.size > TAILLE_MAX_OCTETS) return "Le fichier dépasse 5 Mo : découpez-le.";
  if (f.size === 0) return "Le fichier est vide.";
  return null;
}

export function cheminImport(type: TypeImport): string {
  return TYPES_IMPORT.find((t) => t.cle === type)?.chemin ?? "vehicules";
}
