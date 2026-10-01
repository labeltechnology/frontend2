/**
 * Accord selon le nombre (2026-10-01, relecture du français) : remplace les
 * formes « véhicule(s) disponible(s) » par un vrai singulier ou pluriel.
 * En français, 0 et 1 (et tout nombre inférieur à 2) prennent le singulier.
 *
 *   accord(3, "véhicule")                → « véhicules »
 *   accord(1, "travail", "travaux")      → « travail »
 *   pluriel(3, "véhicule")               → « 3 véhicules »
 *   pluriel(1, "alerte ouverte", "alertes ouvertes") → « 1 alerte ouverte »
 */
export function accord(n: number, singulier: string, pluriel?: string): string {
  return Math.abs(n) < 2 ? singulier : (pluriel ?? pluralRegulier(singulier));
}

/** Nombre suivi du mot accordé (séparés par une espace). */
export function pluriel(n: number, singulier: string, formePlurielle?: string): string {
  return `${n.toLocaleString("fr-FR")} ${accord(n, singulier, formePlurielle)}`;
}

/** Pluriel régulier mot par mot : « véhicule disponible » → « véhicules disponibles » ; -s, -x, -z invariables ; -al → -aux ; -eau, -eu → -x (sauf pneu, bleu). Formes irrégulières : passer le pluriel explicitement. */
function pluralRegulier(expression: string): string {
  return expression
    .split(" ")
    .map((mot) => {
      if (mot.length < 2 || /^(de|du|des|en|à|au|aux|et|ou|sur|par|pour|le|la|les|l'|d'|non)$/i.test(mot)) return mot;
      if (/[sxz]$/i.test(mot)) return mot;
      if (/al$/i.test(mot) && !/^(bal|carnaval|chacal|festival|récital|régal)$/i.test(mot)) return mot.replace(/al$/i, "aux");
      if (/(eau|eu)$/i.test(mot) && !/^(pneu|bleu|émeu)$/i.test(mot)) return `${mot}x`;
      return `${mot}s`;
    })
    .join(" ");
}
