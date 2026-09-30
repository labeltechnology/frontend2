import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { DIMENSIONS_SANTE, type SanteParc } from "@/features/dashboard/sante-parc";
import {
  segmentsStatut,
  statutParCategorie,
  type CompteursStatut,
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <caption className="sr-only">Statut du parc par catégorie et par type de matériel</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Catégorie / type</th>
                  <th className="px-1.5 py-2 text-right font-medium">Total</th>
                  <th className="px-1.5 py-2 text-right font-medium" title="Disponibles, en mission ou affectés">Utilisables</th>
                  <th className="px-1.5 py-2 text-right font-medium" title="En maintenance ou en panne">Immobilisés</th>
                  <th className="px-1.5 py-2 text-right font-medium">En alerte</th>
                  <th className="py-2 pl-1.5 text-right font-medium">À surveiller</th>
                </tr>
              </thead>
              {categories.map((c) => (
                <tbody key={c.categorie} className="border-b last:border-b-0">
                  <Ligne libelle={c.libelle} lien={c.lien} compteurs={c.compteurs} categorie />
                  {c.types.map((t) => (
                    <Ligne key={t.idTypeEngin ?? "sans-type"} libelle={t.libelle} lien={t.lien} compteurs={t.compteurs} />
                  ))}
                </tbody>
              ))}
            </table>
          </div>

          <Legende />
          {(sante.horsParc > 0 || sante.dimensionsIndisponibles.length > 0) && (
            <p className="text-[11px] text-muted-foreground">
              {sante.horsParc > 0 && `${sante.horsParc} véhicule(s) réformé(s) ou vendu(s) non compté(s). `}
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

function Ligne({
  libelle,
  lien,
  compteurs: c,
  categorie,
}: {
  libelle: string;
  lien: string | null;
  compteurs: CompteursStatut;
  categorie?: boolean;
}) {
  const segments = segmentsStatut(c);
  const texteBarre = segments.map((s) => `${s.libelle} ${s.nombre}`).join(", ");
  return (
    <tr className={cn(categorie && "bg-muted/40")}>
      <td className={cn("py-1.5 pr-2", categorie ? "pl-2 font-semibold" : "pl-5")}>
        {lien ? (
          <Link to={lien} className="text-foreground hover:underline focus-visible:underline">
            {libelle}
          </Link>
        ) : (
          <span className="text-muted-foreground">{libelle}</span>
        )}
        <div className="mt-1 flex h-1.5 w-full min-w-[80px] overflow-hidden rounded-full bg-muted" role="img" aria-label={texteBarre} title={texteBarre}>
          {segments.map((s) => (
            <span key={s.statut} className={COULEUR_STATUT[s.statut]} style={{ width: `${s.largeur}%` }} />
          ))}
        </div>
      </td>
      <td className={cn("px-1.5 py-1.5 text-right tabular-nums", categorie && "font-semibold")}>{c.total}</td>
      <td className="px-1.5 py-1.5 text-right tabular-nums text-badge-successFg">{c.utilisables}</td>
      <td className={cn("px-1.5 py-1.5 text-right tabular-nums", c.immobilises > 0 ? "text-badge-warningFg" : "text-muted-foreground")}>
        {c.immobilises || "—"}
      </td>
      <td className={cn("px-1.5 py-1.5 text-right tabular-nums", c.enAlerte > 0 ? "font-semibold text-badge-dangerFg" : "text-muted-foreground")}>
        {c.enAlerte || "—"}
      </td>
      <td className={cn("py-1.5 pl-1.5 text-right tabular-nums", c.aSurveiller > 0 ? "text-badge-warningFg" : "text-muted-foreground")}>
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
