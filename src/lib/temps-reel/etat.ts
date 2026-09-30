/**
 * État de la connexion temps réel (2026-09-29), lisible partout
 * (useSyncExternalStore) : témoin « En direct », fréquence de relecture de
 * secours du GPS…
 */
export type EtatTempsReel = "hors-ligne" | "connexion" | "en-direct";

let etat: EtatTempsReel = "hors-ligne";
const abonnes = new Set<() => void>();

export function etatTempsReel(): EtatTempsReel {
  return etat;
}

export function definirEtatTempsReel(nouveau: EtatTempsReel): void {
  if (nouveau === etat) return;
  etat = nouveau;
  abonnes.forEach((f) => f());
}

export function suivreEtatTempsReel(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/**
 * Relecture de secours d'une donnée « en direct » (GPS) : lente quand la
 * connexion temps réel pousse les changements, plus rapide sinon.
 */
export function intervalleSecours(rapideMs: number, lentMs = 120_000): () => number {
  return () => (etat === "en-direct" ? lentMs : rapideMs);
}
