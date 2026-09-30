import { Badge } from "@/components/ui/badge";
import type { Alerte } from "@/types/alerte";
import { etatTraitement, LIBELLES_ETAT_TRAITEMENT, motifTraitement } from "@/features/alertes/traitement";

const VARIANTE = { OUVERTE: "default", MANUELLE: "success", AUTOMATIQUE: "secondary" } as const;

/**
 * Colonne Statut de la page Alertes (2026-09-30) : « À traiter »,
 * « Traitée » ou « Close auto » avec le motif en dessous (ex. « Document
 * remplacé par une nouvelle version »).
 */
export function StatutTraitementAlerte({ alertes }: { alertes: readonly Alerte[] }) {
  const etat = etatTraitement(alertes);
  const motif = etat === "AUTOMATIQUE" ? motifTraitement(alertes) : null;
  return (
    <span className="inline-flex max-w-[16rem] flex-col items-start gap-0.5">
      <Badge
        variant={VARIANTE[etat]}
        title={etat === "AUTOMATIQUE" ? "Close par le système : la cause de l'alerte a disparu" : undefined}
      >
        {LIBELLES_ETAT_TRAITEMENT[etat]}
      </Badge>
      {motif && <span className="text-[11px] leading-snug text-muted-foreground">{motif}</span>}
    </span>
  );
}
