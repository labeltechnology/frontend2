import { NIVEAUX_ECART, texteEcart } from "@/features/performance/performance";
import { cn } from "@/lib/utils";
import type { NiveauEcart } from "@/types/performance";

/** Écart au coût de référence : « +12,5 % · Trop cher » (texte + couleur, jamais la couleur seule). */
export function BadgeEcart({ niveau, pourcent }: { niveau: NiveauEcart; pourcent: number | null }) {
  const ecart = texteEcart(pourcent);
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", NIVEAUX_ECART[niveau].classes)}>
      {ecart ? `${ecart} · ` : ""}
      {NIVEAUX_ECART[niveau].libelle}
    </span>
  );
}
