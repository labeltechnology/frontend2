import { lireSessionStockee } from "@/lib/auth-storage";

/**
 * Mémoire du navigateur par utilisateur (2026-09-30) : filtres des listes,
 * favoris, pages récentes. Rangée sous « parkauto:<idUtilisateur>:<clé> »
 * pour que deux comptes sur le même poste ne se mélangent pas. Jamais de
 * donnée sensible ici : seulement des préférences d'affichage. Toute erreur
 * (navigation privée, stockage plein ou bloqué) est ignorée : la valeur par
 * défaut s'applique.
 */
const PREFIXE = "parkauto";

export function cleMemoire(cle: string, idUtilisateur = lireSessionStockee()?.idUtilisateur ?? 0): string {
  return `${PREFIXE}:${idUtilisateur}:${cle}`;
}

function stockage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Valeur mémorisée si elle passe `valider`, sinon `defaut`. */
export function lireMemoire<T>(cle: string, defaut: T, valider: (v: unknown) => v is T): T {
  try {
    const brut = stockage()?.getItem(cleMemoire(cle));
    if (!brut) return defaut;
    const valeur: unknown = JSON.parse(brut);
    return valider(valeur) ? valeur : defaut;
  } catch {
    return defaut;
  }
}

export function ecrireMemoire(cle: string, valeur: unknown): void {
  try {
    stockage()?.setItem(cleMemoire(cle), JSON.stringify(valeur));
  } catch {
    // Stockage indisponible : la préférence ne sera simplement pas gardée.
  }
}

export function effacerMemoire(cle: string): void {
  try {
    stockage()?.removeItem(cleMemoire(cle));
  } catch {
    // idem
  }
}
