/**
 * Raccourcis clavier (2026-09-30). Logique pure, testée : une touche (et la
 * précédente, pour « G puis V ») donne une action ; l'exécution est dans
 * useRaccourcis.ts. Les touches simples sont ignorées pendant une saisie.
 */
export type ActionRaccourci =
  | { type: "aide" }
  | { type: "chercherListe" }
  | { type: "nouveau" }
  | { type: "enregistrer" }
  | { type: "aller"; chemin: string };

export interface Touche {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
}

/** « G » puis une lettre : aller à une page. */
export const PAGES_RACCOURCIES: { touche: string; chemin: string; libelle: string }[] = [
  { touche: "d", chemin: "/", libelle: "Tableau de bord" },
  { touche: "v", chemin: "/engins", libelle: "Véhicules" },
  { touche: "t", chemin: "/missions", libelle: "Missions" },
  { touche: "h", chemin: "/chantiers", libelle: "Chantiers" },
  { touche: "c", chemin: "/carburant", libelle: "Carburant" },
  { touche: "i", chemin: "/incidents", libelle: "Incidents" },
  { touche: "a", chemin: "/alertes", libelle: "Alertes" },
  { touche: "m", chemin: "/maintenance", libelle: "Maintenance" },
];

/** Délai pour la seconde touche de « G puis … ». */
export const DELAI_SEQUENCE_MS = 1500;

export function interpreter(
  t: Touche,
  precedente: string | null,
  dansSaisie: boolean,
): { action: ActionRaccourci | null; attente: string | null } {
  const key = t.key.toLowerCase();
  if ((t.ctrl || t.meta) && !t.alt && key === "s") return { action: { type: "enregistrer" }, attente: null };
  if (dansSaisie || t.ctrl || t.meta || t.alt) return { action: null, attente: null };
  if (precedente === "g") {
    const page = PAGES_RACCOURCIES.find((p) => p.touche === key);
    return { action: page ? { type: "aller", chemin: page.chemin } : null, attente: null };
  }
  if (t.key === "?") return { action: { type: "aide" }, attente: null };
  if (t.key === "/") return { action: { type: "chercherListe" }, attente: null };
  if (key === "n") return { action: { type: "nouveau" }, attente: null };
  if (key === "g") return { action: null, attente: "g" };
  return { action: null, attente: null };
}

/** Libellé d'un bouton de création : « Nouveau plein », « Déclarer un incident »… */
export const MOTIF_CREATION = /^\s*(nouveau|nouvelle|ajouter|déclarer|créer)\b/i;
