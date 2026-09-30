import { MOTIF_CREATION } from "@/components/layout/raccourcis/raccourcis";

/**
 * Actions sur la page affichée, appelées par les raccourcis et par la
 * recherche globale (« Ajouter un plein » ouvre /carburant?action=nouveau).
 * Elles cherchent les commandes déjà présentes à l'écran : aucune page n'a
 * à les déclarer.
 */
function visible(el: Element): boolean {
  const r = (el as HTMLElement).getBoundingClientRect?.();
  return !!r && r.width > 0 && r.height > 0;
}

/** Bouton « Nouveau… » des actions de l'en-tête, sinon premier bouton de création visible de la page. */
export function trouverBoutonNouveau(racine: ParentNode = document): HTMLElement | null {
  const candidats = [
    ...Array.from(racine.querySelectorAll<HTMLElement>("[data-actions-page] button, [data-actions-page] a")),
    ...Array.from(racine.querySelectorAll<HTMLElement>("main button, main a[href]")),
  ];
  return candidats.find((el) => MOTIF_CREATION.test(el.textContent ?? "") && !(el as HTMLButtonElement).disabled && visible(el)) ?? null;
}

export function cliquerNouveau(): boolean {
  const bouton = trouverBoutonNouveau();
  bouton?.click();
  return Boolean(bouton);
}

/** Champ de recherche de la liste affichée. */
export function focaliserRecherche(): boolean {
  const champ = Array.from(
    document.querySelectorAll<HTMLInputElement>("main input[type=search], main input[data-recherche-liste], main input[placeholder*='echerch' i], main input[aria-label*='echerch' i]"),
  ).find(visible);
  champ?.focus();
  champ?.select();
  return Boolean(champ);
}

/** Enregistre le formulaire où se trouve le curseur, ou le seul formulaire de la page. */
export function enregistrerFormulaire(): boolean {
  const actif = document.activeElement as HTMLElement | null;
  const formulaires = Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter(visible);
  const cible = actif?.closest("form") ?? (formulaires.length === 1 ? formulaires[0] : null);
  if (!cible) return false;
  cible.requestSubmit();
  return true;
}

export function estChampDeSaisie(el: EventTarget | null): boolean {
  const e = el as HTMLElement | null;
  if (!e || !e.tagName) return false;
  return e.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName);
}
