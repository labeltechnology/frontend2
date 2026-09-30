import { useCallback, useState } from "react";

/**
 * Un seul menu ouvert à la fois dans la barre de navigation (2026-09-25,
 * demande de l'utilisateur : « si un ruban s'ouvre, l'autre se ferme »).
 * Chaque menu (groupes, thème, avatar) reçoit `open` / `onOpenChange` d'ici :
 * ouvrir un menu ferme donc celui qui était ouvert, y compris en passant
 * directement d'un bouton à l'autre.
 */
export interface ControleMenu {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
}

/** Menu ouvert après un changement demandé par le menu `id` (pur, testé). */
export function prochainMenuOuvert(courant: string | null, id: string, ouvert: boolean): string | null {
  if (ouvert) return id;
  // Fermeture : seulement si c'est bien ce menu qui est ouvert (un autre a pu s'ouvrir entre-temps).
  return courant === id ? null : courant;
}

export function useMenuUnique() {
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);

  const controle = useCallback(
    (id: string): ControleMenu => ({
      open: menuOuvert === id,
      onOpenChange: (ouvert: boolean) => setMenuOuvert((courant) => prochainMenuOuvert(courant, id, ouvert)),
    }),
    [menuOuvert],
  );

  return { controle };
}
