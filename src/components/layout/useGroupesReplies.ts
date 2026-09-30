import { useCallback, useState } from "react";
import type { IdGroupeNav } from "@/routes/nav-config";

/**
 * Groupes de la barre latérale que l'utilisateur a repliés, mémorisés dans ce
 * navigateur (préférence d'affichage seulement, rien de sensible). Par
 * défaut tout est ouvert. Le stockage peut être indisponible (navigation
 * privée, stockage bloqué) : on retombe alors sur l'état en mémoire.
 */
const CLE_STOCKAGE = "parcauto.navigation.groupes-replies";

function lire(): Set<string> {
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    const valeur: unknown = brut ? JSON.parse(brut) : [];
    return new Set(Array.isArray(valeur) ? valeur.filter((v): v is string => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function ecrire(replies: Set<string>) {
  try {
    window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify([...replies]));
  } catch {
    // Stockage indisponible : la préférence reste valable pour cette session seulement.
  }
}

export function useGroupesReplies() {
  const [replies, setReplies] = useState<Set<string>>(lire);

  const basculer = useCallback((id: IdGroupeNav) => {
    setReplies((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      ecrire(suivant);
      return suivant;
    });
  }, []);

  /** Rouvre un groupe (ex. quand on navigue vers une de ses pages) ; sans effet s'il est déjà ouvert. */
  const deplier = useCallback((id: IdGroupeNav) => {
    setReplies((precedent) => {
      if (!precedent.has(id)) return precedent;
      const suivant = new Set(precedent);
      suivant.delete(id);
      ecrire(suivant);
      return suivant;
    });
  }, []);

  const estReplie = useCallback((id: IdGroupeNav) => replies.has(id), [replies]);

  return { estReplie, basculer, deplier };
}
