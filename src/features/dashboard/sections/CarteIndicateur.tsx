import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TonIndicateur = "neutre" | "succes" | "info" | "alerte" | "danger";

const CLASSES_TON: Record<TonIndicateur, string> = {
  neutre: "bg-badge-neutralBg text-badge-neutralFg",
  succes: "bg-badge-successBg text-badge-successFg",
  info: "bg-badge-infoBg text-badge-infoFg",
  alerte: "bg-badge-warningBg text-badge-warningFg",
  danger: "bg-badge-dangerBg text-badge-dangerFg",
};

/**
 * Indicateur cliquable du tableau de bord : titre, grand chiffre, précision,
 * pastille colorée. Toute la carte mène à la page où agir. Un indicateur
 * « danger » non nul est souligné d'un liseré rouge pour attirer l'œil.
 */
export function CarteIndicateur({
  titre,
  valeur,
  precision,
  icone: Icone,
  ton,
  lien,
  enChargement,
}: {
  titre: string;
  valeur: string | number;
  precision: string;
  icone: LucideIcon;
  ton: TonIndicateur;
  lien: string;
  enChargement?: boolean;
}) {
  const souligne = ton === "danger" && valeur !== 0 && valeur !== "0";
  return (
    <Link
      to={lien}
      className={cn(
        "group relative flex items-start justify-between gap-3 overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all",
        "hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        souligne && "border-badge-dangerFg/50",
      )}
    >
      {souligne && <span className="absolute inset-x-0 top-0 h-0.5 bg-badge-dangerFg" aria-hidden />}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{titre}</p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
          {enChargement ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" /> : valeur}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{enChargement ? " " : precision}</p>
      </div>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform motion-safe:group-hover:scale-110", CLASSES_TON[ton])}>
        <Icone className="h-[18px] w-[18px]" aria-hidden />
      </span>
    </Link>
  );
}
