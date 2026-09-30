import { Fragment } from "react";

/**
 * Texte d'aide avec le nom exact des boutons et menus en gras (étape 4) :
 * « **Nouveau véhicule** » devient <strong>. Aucun HTML interprété.
 */
export function TexteAide({ texte }: { texte: string }) {
  const morceaux = texte.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {morceaux.map((morceau, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {morceau}
          </strong>
        ) : (
          <Fragment key={i}>{morceau}</Fragment>
        ),
      )}
    </>
  );
}
