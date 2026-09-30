import { useSyncExternalStore } from "react";

/**
 * Thèmes disponibles :
 *  - « clair » : palette `:root` d'index.css ;
 *  - « sombre » : palette « Sable & Ambre » (`.dark`), thème par défaut ;
 *  - « nuit » : « Nuit vitrée » (ajouté le 2026-09-24) — fond dégradé bleu
 *    nuit → indigo → prune, panneaux en verre dépoli, bleu vif / vert /
 *    rouge, police Source Sans 3 en graisses légères. C'est une variante
 *    sombre : il garde la classe `dark` (les variantes Tailwind `dark:`
 *    continuent de s'appliquer) et ajoute `data-theme="nuit"` sur <html>,
 *    qui surcharge les variables dans index.css.
 */
export type Theme = "clair" | "sombre" | "nuit";

export const THEMES: readonly Theme[] = ["clair", "sombre", "nuit"];

export const LIBELLES_THEME: Record<Theme, string> = {
  clair: "Clair",
  sombre: "Sombre",
  nuit: "Nuit vitrée",
};

/** Clé localStorage — même préfixe que le token (voir auth-storage.ts). Lue aussi par le script inline d'index.html. */
const CLE_THEME = "parcauto.theme";
// Sombre par défaut : c'est le preset « Sable & Ambre » retenu (voir la
// palette dans index.css). Doit rester cohérent avec le script inline
// d'index.html, qui applique le thème avant le premier rendu React.
const THEME_PAR_DEFAUT: Theme = "sombre";

const ecouteurs = new Set<() => void>();

function estTheme(valeur: unknown): valeur is Theme {
  return THEMES.includes(valeur as Theme);
}

/** Vrai pour tout thème à fond foncé (« sombre » et « nuit ») — à utiliser plutôt que `theme === "sombre"`. */
export function estThemeFonce(theme: Theme): boolean {
  return theme !== "clair";
}

export function lireThemeStocke(): Theme {
  try {
    const valeur = localStorage.getItem(CLE_THEME);
    return estTheme(valeur) ? valeur : THEME_PAR_DEFAUT;
  } catch {
    return THEME_PAR_DEFAUT;
  }
}

/**
 * Applique le thème au document : Tailwind est configuré en `darkMode: "class"`
 * et index.css définit la palette sombre sous `.dark` (la palette claire vit en
 * `:root`, « Nuit vitrée » sous `.dark[data-theme="nuit"]`). `color-scheme`
 * aligne aussi les contrôles natifs (scrollbars, <select>).
 * Doit rester identique au script inline d'index.html.
 */
export function appliquerTheme(theme: Theme): void {
  const racine = document.documentElement;
  const fonce = estThemeFonce(theme);
  racine.classList.toggle("dark", fonce);
  if (theme === "nuit") racine.dataset.theme = "nuit";
  else delete racine.dataset.theme;
  racine.style.colorScheme = fonce ? "dark" : "light";
}

export function changerTheme(theme: Theme): void {
  try {
    localStorage.setItem(CLE_THEME, theme);
  } catch {
    // stockage indisponible (navigation privée stricte) : le thème vaut pour la session courante
  }
  appliquerTheme(theme);
  ecouteurs.forEach((notifier) => notifier());
}

function souscrire(notifier: () => void): () => void {
  ecouteurs.add(notifier);
  // Synchronise aussi les autres onglets ouverts sur l'application.
  const surStorage = (e: StorageEvent) => {
    if (e.key === CLE_THEME) {
      appliquerTheme(lireThemeStocke());
      notifier();
    }
  };
  window.addEventListener("storage", surStorage);
  return () => {
    ecouteurs.delete(notifier);
    window.removeEventListener("storage", surStorage);
  };
}

/** Thème courant + changement, réactifs (le store est le localStorage, source unique de vérité). */
export function useTheme(): {
  theme: Theme;
  /** Vrai pour « sombre » et « nuit ». */
  fonce: boolean;
  /** Conservé pour compatibilité : clair ↔ sombre (depuis « nuit », revient au clair). */
  basculerTheme: () => void;
  changerTheme: (t: Theme) => void;
} {
  const theme = useSyncExternalStore(souscrire, lireThemeStocke, () => THEME_PAR_DEFAUT);
  return {
    theme,
    fonce: estThemeFonce(theme),
    basculerTheme: () => changerTheme(estThemeFonce(theme) ? "clair" : "sombre"),
    changerTheme,
  };
}
