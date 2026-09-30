import { Badge } from "@/components/ui/badge";
import type { NiveauRapport } from "@/features/rapport-engin/niveaux";
import { LIBELLES_NIVEAU, VARIANTE_BADGE_NIVEAU } from "@/features/rapport-engin/presentation";

/** Badge à la couleur d'un niveau du rapport (vert / jaune / rouge / gris), avec un libellé au choix. */
export function PastilleNiveau({ niveau, libelle }: { niveau: NiveauRapport; libelle?: string }) {
  return <Badge variant={VARIANTE_BADGE_NIVEAU[niveau]}>{libelle ?? LIBELLES_NIVEAU[niveau]}</Badge>;
}
