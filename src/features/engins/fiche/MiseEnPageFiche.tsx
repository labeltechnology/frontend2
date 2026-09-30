import type { ReactNode } from "react";

/**
 * Mise en page en 2 colonnes de la fiche véhicule (2026-09-25, « trop
 * d'espace libre à droite et à gauche, mettre en 2 colonnes ») :
 *  - à gauche (360 px), le bandeau du véhicule et les rubriques, qui restent
 *    visibles pendant le défilement (collants) sur grand écran ;
 *  - à droite, toute la largeur restante pour le contenu (formulaire,
 *    photos, sécurité, entretien).
 * Petit et moyen écran : une seule colonne, dans le même ordre.
 */
export function MiseEnPageFiche({ colonneGauche, children }: { colonneGauche: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1600px] items-start gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-6">
      <aside className="space-y-3 lg:sticky lg:top-0">{colonneGauche}</aside>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}
