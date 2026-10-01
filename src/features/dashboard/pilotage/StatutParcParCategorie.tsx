import { Fragment } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { DIMENSIONS_SANTE, type SanteParc } from "@/features/dashboard/sante-parc";
import {
  segmentsStatut,
  statutParCategorie,
  type CompteursStatut,
  type LigneCategorie,
} from "@/features/dashboard/pilotage/statut-par-categorie";
import { cn } from "@/lib/utils";
import type { StatutEngin } from "@/types/engin";

const COULEUR_STATUT: Record<StatutEngin, string> = {
  DISPONIBLE: "bg-badge-successFg",
  EN_MISSION: "bg-badge-infoFg",
  AFFECTE: "bg-primary",
  EN_MAINTENANCE: "bg-badge-warningFg",
  EN_PANNE: "bg-badge-dangerFg",
  REFORME: "bg-muted-foreground/50",
  VENDU: "bg-muted-foreground/50",
};

/**
 * « Statut du parc » par catégorie (2026-09-30, tableau de bord de
 * direction) : véhicules routiers et engins de chantier, puis leurs types de
 * matériel, avec utilisables, immobilisés, en alerte et à surveiller. Plus de
 * tuile par véhicule : un clic ouvre la liste des véhicules filtrée.
 *
 * 2026-10-01 (demande de la direction) : chaque catégorie dans son propre
 * cadre ; familles puis types en plus petit (« Véhicule de service » → 4x4,
 * léger, bus), voir statut-par-categorie.ts.
 */
export function StatutParcParCategorie({ sante, enChargement }: { sante: SanteParc; enChargement: boolean }) {
  const categories = statutParCategorie(sante);

  return (
    <CadreSection titre="Statut du parc" icone={LayoutGrid} lien="/engins" libelleLien="Tous les véhicules">
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : sante.actifs === 0 ? (
        <EtatBloc>Aucun véhicule en service.</EtatBloc>
      ) : (
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Chiffre libelle="Utilisables" valeur={`${sante.utilisables}/${sante.actifs}`} ton="text-badge-successFg" />
            <Chiffre libelle="Immobilisés" valeur={sante.immobilises} ton={sante.immobilises > 0 ? "text-badge-warningFg" : "text-foreground"} />
            <Chiffre libelle="En alerte" valeur={sante.enAlerte} ton={sante.enAlerte > 0 ? "text-badge-dangerFg" : "text-foreground"} />
            <Chiffre libelle="À surveiller" valeur={sante.aSurveiller} ton={sante.aSurveiller > 0 ? "text-badge-warningFg" : "text-foreground"} />
          </dl>

          {categories.map((c) => (
            <CadreCategorie key={c.categorie} categorie={c} />
          ))}

          <Legende />
          {(sante.horsParc > 0 || sante.dimensionsIndisponibles.length > 0) && (
            <p className="text-[11px] text-muted-foreground">
              {sante.horsParc > 0 &&
                `${sante.horsParc} ${sante.horsParc > 1 ? "véhicules réformés ou vendus non comptés" : "véhicule réformé ou vendu non compté"}. `}
              {sante.dimensionsIndisponibles.length > 0 &&
                `Non disponible pour votre profil : ${sante.dimensionsIndisponibles
                  .map((d) => DIMENSIONS_SANTE.find((x) => x.cle === d)!.libelle.toLowerCase())
                  .join(", ")}.`}
            </p>
          )}
        </div>
      )}
    </CadreSection>
  );
}

/** Une catégorie encadrée : en-tête (nom, barre, chiffres), puis familles et types en plus petit. */
function CadreCategorie({ categorie: c }: { categorie: LigneCategorie }) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-3" aria-label={`${c.libelle} : ${c.compteurs.total} véhicules`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-[160px] flex-1">
          <Link to={c.lien} className="text-sm font-semibold text-foreground hover:underline focus-visible:underline">
            {c.libelle}
          </Link>
          <Barre compteurs={c.compteurs} haute />
        </div>
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <Compteur libelle="Total" valeur={c.compteurs.total} classe="font-semibold text-foreground" />
          <Compteur libelle="Utilisables" valeur={c.compteurs.utilisables} classe="text-badge-successFg" />
          <Compteur libelle="Immobilisés" valeur={c.compteurs.immobilises} classe={c.compteurs.immobilises > 0 ? "text-badge-warningFg" : "text-muted-foreground"} />
          <Compteur libelle="En alerte" valeur={c.compteurs.enAlerte} classe={c.compteurs.enAlerte > 0 ? "font-semibold text-badge-dangerFg" : "text-muted-foreground"} />
          <Compteur libelle="À surveiller" valeur={c.compteurs.aSurveiller} classe={c.compteurs.aSurveiller > 0 ? "text-badge-warningFg" : "text-muted-foreground"} />
        </dl>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[400px] text-xs">
          <caption className="sr-only">{`${c.libelle} : détail par ${c.avecFamilles ? "famille et " : ""}type de matériel`}</caption>
          <thead>
            <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="py-1 pr-2 font-medium">{c.avecFamilles ? "Famille / type" : "Type"}</th>
              <th className="px-1.5 py-1 text-right font-medium">Total</th>
              <th className="px-1.5 py-1 text-right font-medium" title="Disponibles, en mission ou affectés">Utilisables</th>
              <th className="px-1.5 py-1 text-right font-medium" title="En maintenance ou en panne">Immobilisés</th>
              <th className="px-1.5 py-1 text-right font-medium">En alerte</th>
              <th className="py-1 pl-1.5 text-right font-medium">À surveiller</th>
            </tr>
          </thead>
          <tbody>
            {c.avecFamilles
              ? c.familles.map((f) => (
                  <Fragment key={f.famille ?? "sans-famille"}>
                    <Ligne libelle={f.libelle} lien={null} compteurs={f.compteurs} niveau="famille" />
                    {f.types.map((t) => (
                      <Ligne key={t.idTypeEngin ?? "sans-type"} libelle={t.libelle} lien={t.lien} compteurs={t.compteurs} niveau="type" />
                    ))}
                  </Fragment>
                ))
              : c.types.map((t) => (
                  <Ligne key={t.idTypeEngin ?? "sans-type"} libelle={t.libelle} lien={t.lien} compteurs={t.compteurs} niveau="famille" />
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Compteur({ libelle, valeur, classe }: { libelle: string; valeur: number; classe: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="text-muted-foreground">{libelle}</dt>
      <dd className={cn("tabular-nums", classe)}>{valeur}</dd>
    </div>
  );
}

function Barre({ compteurs, haute }: { compteurs: CompteursStatut; haute?: boolean }) {
  const segments = segmentsStatut(compteurs);
  const texteBarre = segments.map((s) => `${s.libelle} ${s.nombre}`).join(", ");
  return (
    <div
      className={cn("mt-1 flex w-full min-w-[80px] overflow-hidden rounded-full bg-muted", haute ? "h-2" : "h-1")}
      role="img"
      aria-label={texteBarre}
      title={texteBarre}
    >
      {segments.map((s) => (
        <span key={s.statut} className={COULEUR_STATUT[s.statut]} style={{ width: `${s.largeur}%` }} />
      ))}
    </div>
  );
}

/** Ligne du tableau d'une catégorie : famille (texte normal) ou type (plus petit, en retrait). */
function Ligne({
  libelle,
  lien,
  compteurs: c,
  niveau,
}: {
  libelle: string;
  lien: string | null;
  compteurs: CompteursStatut;
  niveau: "famille" | "type";
}) {
  const type = niveau === "type";
  return (
    <tr className={cn(!type && "border-t border-border/60")}>
      <td className={cn("py-1 pr-2", type ? "pl-4 text-[11px]" : "font-medium")}>
        {lien ? (
          <Link to={lien} className={cn("hover:underline focus-visible:underline", type ? "text-muted-foreground hover:text-foreground" : "text-foreground")}>
            {libelle}
          </Link>
        ) : (
          <span className={type ? "text-muted-foreground" : "text-foreground"}>{libelle}</span>
        )}
        {!type && <Barre compteurs={c} />}
      </td>
      <td className={cn("px-1.5 py-1 text-right tabular-nums", type ? "text-[11px]" : "font-medium")}>{c.total}</td>
      <td className={cn("px-1.5 py-1 text-right tabular-nums text-badge-successFg", type && "text-[11px]")}>{c.utilisables}</td>
      <td className={cn("px-1.5 py-1 text-right tabular-nums", type && "text-[11px]", c.immobilises > 0 ? "text-badge-warningFg" : "text-muted-foreground")}>
        {c.immobilises || "—"}
      </td>
      <td className={cn("px-1.5 py-1 text-right tabular-nums", type && "text-[11px]", c.enAlerte > 0 ? "font-semibold text-badge-dangerFg" : "text-muted-foreground")}>
        {c.enAlerte || "—"}
      </td>
      <td className={cn("py-1 pl-1.5 text-right tabular-nums", type && "text-[11px]", c.aSurveiller > 0 ? "text-badge-warningFg" : "text-muted-foreground")}>
        {c.aSurveiller || "—"}
      </td>
    </tr>
  );
}

function Chiffre({ libelle, valeur, ton }: { libelle: string; valeur: number | string; ton: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
      <dt className="text-[11px] text-muted-foreground">{libelle}</dt>
      <dd className={cn("text-lg font-semibold tabular-nums leading-tight", ton)}>{valeur}</dd>
    </div>
  );
}

/** Légende des couleurs de la barre (statuts). */
function Legende() {
  const statuts: { statut: StatutEngin; libelle: string }[] = [
    { statut: "DISPONIBLE", libelle: "Disponible" },
    { statut: "EN_MISSION", libelle: "En mission" },
    { statut: "AFFECTE", libelle: "Affecté" },
    { statut: "EN_MAINTENANCE", libelle: "En maintenance" },
    { statut: "EN_PANNE", libelle: "En panne" },
  ];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-[11px] text-muted-foreground">
      {statuts.map((s) => (
        <li key={s.statut} className="inline-flex items-center gap-1">
          <span className={cn("h-2 w-2 rounded-sm", COULEUR_STATUT[s.statut])} aria-hidden />
          {s.libelle}
        </li>
      ))}
    </ul>
  );
}
