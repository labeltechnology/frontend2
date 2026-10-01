import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Siren } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { AlerteUrgente } from "@/features/dashboard/pilotage/pilotage";
import { cn, formatMontant } from "@/lib/utils";

const NOMBRE_VISIBLE = 6;

/**
 * « Notifications » (2026-09-30, renommé le 2026-10-01 à la demande de la
 * direction ; anciennement « Alertes urgentes ») : critiques d'abord (action immédiate),
 * puis avertissements. Chaque alerte donne son contexte, l'impact par jour,
 * le montant en jeu et l'action prévue ou conseillée, et mène à la page où
 * agir. Le niveau est donné par la couleur ET un libellé.
 */
export function AlertesUrgentes({
  alertes,
  enChargement,
  enErreur,
}: {
  alertes: AlerteUrgente[];
  enChargement: boolean;
  enErreur: boolean;
}) {
  const [tout, setTout] = useState(false);
  const critiques = alertes.filter((a) => a.niveau === "CRITIQUE");
  const avertissements = alertes.filter((a) => a.niveau !== "CRITIQUE");
  const visibles = tout ? alertes : alertes.slice(0, NOMBRE_VISIBLE);

  return (
    <CadreSection
      titre="Notifications"
      icone={Siren}
      lien="/alertes"
      libelleLien="Toutes les alertes"
      actions={
        alertes.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            <span className="text-badge-dangerFg">{critiques.length} critique{critiques.length > 1 ? "s" : ""}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-badge-warningFg">
              {avertissements.length} avertissement{avertissements.length > 1 ? "s" : ""}
            </span>
          </span>
        )
      }
    >
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : alertes.length === 0 ? (
        <EtatBloc>{enErreur ? "Notifications indisponibles." : "Aucune notification urgente : la situation est sous contrôle."}</EtatBloc>
      ) : (
        <ul className="space-y-2">
          {visibles.map((a) => (
            <LigneAlerte key={a.cle} alerte={a} />
          ))}
        </ul>
      )}
      {alertes.length > NOMBRE_VISIBLE && (
        <button
          type="button"
          onClick={() => setTout((v) => !v)}
          className="mt-2 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {tout ? "Réduire" : `Afficher les ${alertes.length - NOMBRE_VISIBLE} autres`}
        </button>
      )}
      {enErreur && alertes.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Alertes chiffrées (budgets, chantiers, immobilisations) indisponibles.</p>
      )}
    </CadreSection>
  );
}

function LigneAlerte({ alerte: a }: { alerte: AlerteUrgente }) {
  const critique = a.niveau === "CRITIQUE";
  return (
    <li>
      <Link
        to={a.lien}
        className={cn(
          "group flex gap-3 rounded-lg border-l-4 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-accent/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          critique ? "border-l-badge-dangerFg" : "border-l-badge-warningFg",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                critique ? "bg-badge-dangerBg text-badge-dangerFg" : "bg-badge-warningBg text-badge-warningFg",
              )}
            >
              {critique ? "Critique" : "Avertissement"}
            </span>
            <span className="text-[11px] text-muted-foreground">{a.categorie}</span>
          </span>
          <span className="mt-0.5 block text-sm font-medium text-foreground">{a.titre}</span>
          {a.details.slice(0, 4).map((d) => (
            <span key={d} className="block text-xs text-muted-foreground">
              {d}
            </span>
          ))}
          {(a.impactJour !== null || a.montant !== null || a.action) && (
            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
              {a.impactJour !== null && <span className="font-medium text-badge-dangerFg">Impact : {formatMontant(a.impactJour)} / jour</span>}
              {a.montant !== null && (
                <span className="font-medium text-foreground">
                  {a.libelleMontant ?? "Montant"} : {formatMontant(a.montant)}
                </span>
              )}
              {a.action && <span className="text-primary">→ {a.action}</span>}
            </span>
          )}
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}
