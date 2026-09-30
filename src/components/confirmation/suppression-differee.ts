/**
 * Suppression annulable (2026-09-30) : la ligne disparaît tout de suite de
 * l'écran, l'appel au serveur part après le délai, sauf si l'utilisateur
 * clique « Annuler ». Logique pure (minuterie injectable), testée.
 */
export const DELAI_ANNULATION_MS = 8000;

export interface SuppressionEnAttente {
  annuler: () => boolean;
  executerMaintenant: () => void;
  enAttente: () => boolean;
}

export function planifierSuppression(
  executer: () => void,
  delaiMs = DELAI_ANNULATION_MS,
  minuterie: { lancer: (f: () => void, ms: number) => unknown; arreter: (id: unknown) => void } = {
    lancer: (f, ms) => setTimeout(f, ms),
    arreter: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  },
): SuppressionEnAttente {
  let etat: "attente" | "faite" | "annulee" = "attente";
  const faire = () => {
    if (etat !== "attente") return;
    etat = "faite";
    executer();
  };
  const id = minuterie.lancer(faire, delaiMs);
  return {
    annuler: () => {
      if (etat !== "attente") return false;
      etat = "annulee";
      minuterie.arreter(id);
      return true;
    },
    executerMaintenant: () => {
      minuterie.arreter(id);
      faire();
    },
    enAttente: () => etat === "attente",
  };
}

/** Retire d'une liste (ou d'une page de données) les éléments visés ; les autres formes sont rendues telles quelles. */
export function retirerDuCache<T>(donnees: unknown, estVise: (element: T) => boolean): unknown {
  return Array.isArray(donnees) ? (donnees as T[]).filter((e) => !estVise(e)) : donnees;
}
