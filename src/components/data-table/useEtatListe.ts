import { useCallback, useState } from "react";
import { ETAT_INITIAL, estEtatListe, type EtatListe } from "@/components/data-table/liste";
import { ecrireMemoire, lireMemoire } from "@/lib/memoire-locale";

/**
 * État d'une liste (tri, page, taille de page, filtre rapide). Avec une clé,
 * il est gardé d'une visite à l'autre, par utilisateur : revenir d'une fiche
 * retrouve la liste telle qu'on l'a laissée.
 */
export function useEtatListe(cle: string | undefined, initial: Partial<EtatListe> = {}) {
  const [etat, setEtat] = useState<EtatListe>(() => {
    const defaut = { ...ETAT_INITIAL, ...initial };
    return cle ? lireMemoire(`liste:${cle}`, defaut, estEtatListe) : defaut;
  });

  const modifier = useCallback(
    (changement: Partial<EtatListe>) => {
      setEtat((ancien) => {
        const nouveau = { ...ancien, ...changement };
        if (cle) ecrireMemoire(`liste:${cle}`, nouveau);
        return nouveau;
      });
    },
    [cle],
  );

  const reinitialiser = useCallback(() => modifier({ ...ETAT_INITIAL, ...initial }), [modifier, initial]);

  return { etat, modifier, reinitialiser };
}
