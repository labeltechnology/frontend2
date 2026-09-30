import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { CANAUX, CLE_FLOTTE_GPS, type DefinitionCanal } from "@/lib/temps-reel/canaux";
import type { EvenementChangement } from "@/lib/temps-reel/protocole";

/**
 * Range un changement reçu dans le cache react-query (2026-09-29).
 *
 * - Modification avec données : l'objet remplace l'ancien dans les listes
 *   du canal et dans son détail — l'écran change tout de suite, sans requête.
 * - Suppression : l'objet disparaît des listes, son détail est oublié.
 * - Création : rien n'est inséré (ordre et filtres des listes inconnus) ;
 *   la relecture qui suit l'ajoute.
 * - Sans données (signal) : rien ici, la relecture fait tout.
 *
 * Renvoie vrai si les listes « complètes » et le détail sont déjà à jour
 * (la relecture qui suit peut alors les épargner).
 */
export function appliquerChangement(client: QueryClient, evenement: EvenementChangement): boolean {
  const def = CANAUX[evenement.canal];
  if (!def) return false;
  if (evenement.canal === "gps") {
    if (Array.isArray(evenement.donnees)) client.setQueryData(CLE_FLOTTE_GPS, evenement.donnees);
    return false;
  }
  const { id } = evenement;
  const champ = def.champId;
  if (id === null || !champ) return false;
  const correspond = (x: unknown): boolean =>
    !!x && typeof x === "object" && (x as Record<string, unknown>)[champ] === id;

  if (evenement.operation === "SUPPRIME") {
    for (const [cle, donnees] of client.getQueriesData<unknown>({ predicate: (q) => !!def.listes?.(q.queryKey) })) {
      if (Array.isArray(donnees) && donnees.some(correspond)) {
        client.setQueryData(cle, donnees.filter((x) => !correspond(x)));
      }
    }
    if (def.detail) client.removeQueries({ queryKey: def.detail(id), exact: true });
    return false;
  }

  const objet = evenement.donnees;
  if (!correspond(objet)) return false;
  for (const [cle, donnees] of client.getQueriesData<unknown>({ predicate: (q) => !!def.listes?.(q.queryKey) })) {
    if (Array.isArray(donnees) && donnees.some(correspond)) {
      client.setQueryData(cle, donnees.map((x) => (correspond(x) ? objet : x)));
    }
  }
  if (def.detail) {
    // Seulement si le détail est déjà en cache : on ne crée pas d'entrée.
    client.setQueryData(def.detail(id), (ancien: unknown) => (ancien === undefined ? undefined : objet));
  }
  return evenement.operation === "MODIFIE";
}

/**
 * Requêtes déjà à jour après {@link appliquerChangement} : liste complète du
 * canal (clé d'un seul segment) et détail. Les listes filtrées (alertes non
 * traitées…) sont toujours relues : l'objet peut devoir en sortir.
 */
export function dejaAJour(def: DefinitionCanal, cle: QueryKey): boolean {
  if (cle.length === 1 && def.listes?.(cle)) return true;
  if (!def.detail || cle.length !== 2 || typeof cle[1] !== "number") return false;
  const modele = def.detail(cle[1]);
  return modele.length === 2 && modele[0] === cle[0];
}

/** La requête dépend-elle du canal (première partie de sa clé parmi ses racines) ? */
export function dependDuCanal(def: DefinitionCanal, cle: QueryKey): boolean {
  return typeof cle[0] === "string" && def.racines.includes(cle[0]);
}
