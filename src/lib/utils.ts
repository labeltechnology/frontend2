import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind conditionnelles (patron standard shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate une date ISO (LocalDate) "yyyy-MM-dd" en affichage FR "jj/mm/aaaa". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** Formate un LocalDateTime ISO ("yyyy-MM-ddTHH:mm:ss") en affichage FR. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formate un Instant ISO (UTC, avec Z) en affichage FR. */
export function formatInstant(value: string | null | undefined): string {
  return formatDateTime(value);
}

export function formatNombre(value: number | null | undefined, decimales = 0): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: decimales, minimumFractionDigits: decimales });
}

export function formatMontant(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${formatNombre(value, 2)} Ar`;
}

/** Convertit une valeur d'enum (SCREAMING_SNAKE_CASE) en libellé lisible ("EN_MISSION" -> "En mission"). */
export function libelleEnum(value: string | null | undefined): string {
  if (!value) return "—";
  const mot = value.toLowerCase().replaceAll("_", " ");
  return mot.charAt(0).toUpperCase() + mot.slice(1);
}

/**
 * Initiales (2 lettres) à partir d'un prénom/nom — utilisé pour la pastille
 * avatar des conducteurs (itération 12), qui disposent bien de ces champs
 * (à la différence de SessionUtilisateur, voir initialesDepuisEmail).
 */
export function initiales(nom: string | null | undefined, prenom: string | null | undefined): string {
  const lettreNom = (nom ?? "").trim().charAt(0).toUpperCase();
  const lettrePrenom = (prenom ?? "").trim().charAt(0).toUpperCase();
  return `${lettrePrenom}${lettreNom}` || "?";
}

/**
 * Initiales (2 lettres) dérivées de la partie locale d'une adresse e-mail
 * (ex. "oswald.a@..." -> "OA") — utilisé pour la pastille avatar du chip
 * utilisateur de la barre latérale : SessionUtilisateur n'expose ni nom ni
 * prénom, seulement l'e-mail.
 */
export function initialesDepuisEmail(email: string | null | undefined): string {
  if (!email) return "?";
  const partieLocale = email.split("@")[0] ?? "";
  const segments = partieLocale.split(/[._-]+/).filter(Boolean);
  if (segments.length >= 2) return (segments[0].charAt(0) + segments[1].charAt(0)).toUpperCase();
  if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase();
  return "?";
}

/**
 * Déclenche l'enregistrement d'un blob reçu du backend (export PDF/Excel) :
 * un lien <a download> temporaire, inséré puis retiré, est la seule façon
 * fiable de forcer le téléchargement d'un blob en mémoire.
 */
export function declencherTelechargementBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  // Firefox n'ouvre pas le téléchargement si le lien n'appartient pas au
  // document : on l'y insère le temps du clic, puis on le retire.
  lien.style.display = "none";
  document.body.append(lien);
  lien.click();
  lien.remove();
  // Révoquer juste après click() est une course : le navigateur peut n'avoir
  // pas encore commencé à lire le blob, et l'export arrive vide ou échoue
  // (surtout sur les gros fichiers). On libère au tour de boucle suivant, une
  // fois le téléchargement engagé.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Normalise un nombre saisi à la française avant conversion : « 85 000 » →
 * « 85000 », « 12,5 » → « 12.5 ». `\s` suffit à couvrir les séparateurs de
 * milliers — en JavaScript il inclut déjà l'espace insécable (U+00A0) et
 * l'espace fine insécable (U+202F), que produisent les claviers et les
 * copier-coller depuis Excel ou un PDF.
 *
 * Mutualisée ici plutôt que redéfinie dans chaque formulaire : les deux
 * copies précédentes (fiche engin, intervention d'entretien) écrivaient ces
 * espaces en toutes lettres dans la classe de caractères — donc invisibles à
 * la relecture, et signalés par ESLint (no-irregular-whitespace).
 */
export function normaliserNombre(valeur: string): string {
  return valeur.replace(/\s/g, "").replace(",", ".");
}
