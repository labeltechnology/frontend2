import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { TonIndicateur } from "@/features/dashboard/sections/CarteIndicateur";
import { cn } from "@/lib/utils";

/** Une ligne cliquable : titre, détail et étiquette colorée à droite (libellé toujours écrit). */
export interface LigneLien {
  cle: string;
  titre: string;
  detail: string;
  etiquette: string;
  ton: TonIndicateur;
  lien: string;
}

const CLASSES_TON: Record<TonIndicateur, string> = {
  neutre: "bg-badge-neutralBg text-badge-neutralFg",
  succes: "bg-badge-successBg text-badge-successFg",
  info: "bg-badge-infoBg text-badge-infoFg",
  alerte: "bg-badge-warningBg text-badge-warningFg",
  danger: "bg-badge-dangerBg text-badge-dangerFg",
};

/**
 * Bloc liste des tableaux de bord par métier (2026-09-30) : même cadre que
 * les autres blocs, lignes cliquables vers la page où agir, états
 * chargement / erreur / vide, « + N autre(s) » au-delà de `nombreVisible`.
 */
export function ListeLiens({
  titre,
  icone,
  lien,
  libelleLien,
  lignes,
  enChargement,
  enErreur,
  vide,
  nombreVisible = 6,
  pied,
}: {
  titre: string;
  icone: LucideIcon;
  lien?: string;
  libelleLien?: string;
  lignes: LigneLien[];
  enChargement: boolean;
  enErreur?: boolean;
  /** Message quand la liste est vide. */
  vide: string;
  nombreVisible?: number;
  /** Ligne de total ou de précision sous la liste. */
  pied?: string;
}) {
  const visibles = lignes.slice(0, nombreVisible);
  return (
    <CadreSection
      titre={titre}
      icone={icone}
      lien={lien}
      libelleLien={libelleLien}
      actions={
        lignes.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{lignes.length}</span>
        )
      }
    >
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : enErreur ? (
        <EtatBloc erreur>Données indisponibles.</EtatBloc>
      ) : lignes.length === 0 ? (
        <EtatBloc>{vide}</EtatBloc>
      ) : (
        <ul className="-mx-2 divide-y divide-border">
          {visibles.map((l) => (
            <li key={l.cle}>
              <Link
                to={l.lien}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{l.titre}</span>
                  <span className="block truncate text-xs text-muted-foreground">{l.detail}</span>
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", CLASSES_TON[l.ton])}>{l.etiquette}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!enChargement && !enErreur && lignes.length > nombreVisible && (
        <p className="mt-3 text-xs text-muted-foreground">+ {lignes.length - nombreVisible} autre(s).</p>
      )}
      {pied && !enChargement && !enErreur && lignes.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{pied}</p>}
    </CadreSection>
  );
}
