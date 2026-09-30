import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api-client";

/** Chargement ou erreur d'une requête (pages Fiabilité et Renouvellement). */
export function EtatChargement({
  enCours,
  erreur,
  texte = "Calcul en cours…",
}: {
  enCours: boolean;
  erreur: unknown;
  texte?: string;
}) {
  if (enCours) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" /> {texte}
      </p>
    );
  }
  if (erreur) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
        {erreur instanceof ApiError ? erreur.message : "Calcul impossible pour le moment."}
      </p>
    );
  }
  return null;
}

/** Pastille colorée (priorité, état, responsabilité). */
export function Pastille({ libelle, classes }: { libelle: string; classes: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>{libelle}</span>;
}
