/**
 * Identifiant aléatoire de cet onglet (2026-09-29), envoyé avec chaque
 * requête (en-tête X-Onglet-Id) : le serveur le renvoie dans les événements
 * temps réel, et l'onglet reconnaît ainsi ses propres modifications (pas
 * d'avis « modifié par un autre » pour lui-même). Aucune donnée personnelle.
 */
function genererIdOnglet(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("-");
}

export const ENTETE_ONGLET = "X-Onglet-Id";
export const ID_ONGLET = genererIdOnglet();
