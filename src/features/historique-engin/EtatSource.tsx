import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface EtatSourceProps {
  enChargement: boolean;
  enErreur: boolean;
  vide: boolean;
  /** Message quand il n'y a rien à afficher (ex. « Aucune alerte pour ce véhicule. »). */
  messageVide: string;
  children: ReactNode;
}

/**
 * Chargement / erreur / liste vide, identiques dans tous les onglets de la
 * page historique. Une erreur vient le plus souvent d'un profil qui n'a pas
 * accès à cette donnée : le message le dit sans bloquer les autres onglets.
 */
export function EtatSource({ enChargement, enErreur, vide, messageVide, children }: EtatSourceProps) {
  if (enChargement) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Chargement…
      </p>
    );
  }
  if (enErreur) {
    return (
      <p className="py-6 text-sm text-destructive">
        Historique indisponible (accès refusé pour votre profil ou erreur de chargement).
      </p>
    );
  }
  if (vide) {
    return <p className="py-6 text-sm text-muted-foreground">{messageVide}</p>;
  }
  return <>{children}</>;
}
