import type { EvenementServeur } from "@/lib/temps-reel/protocole";

/**
 * Diffusion interne des événements temps réel (2026-09-29) : la connexion
 * unique (useTempsReel) les publie ici, les modules qui en ont besoin
 * (messagerie…) s'y abonnent. « OUVERTURE » signale une (re)connexion :
 * de quoi relire ce qui a pu arriver pendant la coupure.
 */
export type EvenementBus = EvenementServeur | { type: "OUVERTURE"; reconnexion: boolean };

const ecouteurs = new Set<(e: EvenementBus) => void>();

export function publierTempsReel(evenement: EvenementBus): void {
  ecouteurs.forEach((f) => {
    try {
      f(evenement);
    } catch {
      // un écouteur en erreur ne bloque pas les autres
    }
  });
}

export function ecouterTempsReel(f: (e: EvenementBus) => void): () => void {
  ecouteurs.add(f);
  return () => ecouteurs.delete(f);
}
