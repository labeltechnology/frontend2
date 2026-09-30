import { useSyncExternalStore } from "react";
import { ajouterRecent, basculerFavori, estListeChemins, estListeRecents, type PageRecente } from "@/components/layout/favoris/favoris";
import { ecrireMemoire, lireMemoire } from "@/lib/memoire-locale";

/**
 * Favoris et récents de l'utilisateur connecté, gardés dans le navigateur
 * (2026-09-30). Partagés entre les composants par un petit abonnement : une
 * étoile cliquée dans l'en-tête met à jour le menu ★ tout de suite.
 */
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

let cacheFavoris: { brut: string; valeur: string[] } | null = null;
let cacheRecents: { brut: string; valeur: PageRecente[] } | null = null;

function lireFavoris(): string[] {
  const valeur = lireMemoire("favoris", [] as string[], estListeChemins);
  const brut = JSON.stringify(valeur);
  if (!cacheFavoris || cacheFavoris.brut !== brut) cacheFavoris = { brut, valeur };
  return cacheFavoris.valeur;
}

function lireRecents(): PageRecente[] {
  const valeur = lireMemoire("recents", [] as PageRecente[], estListeRecents);
  const brut = JSON.stringify(valeur);
  if (!cacheRecents || cacheRecents.brut !== brut) cacheRecents = { brut, valeur };
  return cacheRecents.valeur;
}

export function useFavoris() {
  const favoris = useSyncExternalStore(abonner, lireFavoris, lireFavoris);
  return {
    favoris,
    estFavori: (chemin: string) => favoris.includes(chemin),
    basculer: (chemin: string) => {
      ecrireMemoire("favoris", basculerFavori(lireFavoris(), chemin));
      prevenir();
    },
  };
}

export function useRecents(): PageRecente[] {
  return useSyncExternalStore(abonner, lireRecents, lireRecents);
}

export function noterPageRecente(page: PageRecente) {
  const avant = lireRecents();
  if (avant[0]?.chemin === page.chemin && avant[0]?.libelle === page.libelle) return;
  ecrireMemoire("recents", ajouterRecent(avant, page));
  prevenir();
}
