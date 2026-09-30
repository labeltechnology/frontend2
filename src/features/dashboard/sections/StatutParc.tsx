import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { ICONES_DIMENSION, TuileVehicule } from "@/features/dashboard/sections/TuileVehicule";
import { DIMENSIONS_SANTE, estAProbleme, type SanteParc } from "@/features/dashboard/sante-parc";
import type { StatutEngin } from "@/types/engin";
import { cn } from "@/lib/utils";

const COULEUR_STATUT: Partial<Record<StatutEngin, string>> = {
  DISPONIBLE: "bg-badge-successFg",
  EN_MISSION: "bg-badge-infoFg",
  AFFECTE: "bg-primary",
  EN_MAINTENANCE: "bg-badge-warningFg",
  EN_PANNE: "bg-badge-dangerFg",
};

type Filtre = "tous" | "problemes";

/**
 * Statut du parc — « mur du parc » (2026-09-25, remplace la barre de
 * répartition). En haut, 4 chiffres pour interpréter d'un coup d'œil
 * (utilisables, immobilisés, en alerte, à surveiller) ; dessous, une tuile
 * par véhicule, rangée sous son statut et triée du plus grave au moins grave.
 * Filtre « À problème » pour ne garder que les véhicules jaunes ou rouges.
 * Règles de santé : voir sante-parc.ts.
 */
export function StatutParc({ sante, enChargement }: { sante: SanteParc; enChargement: boolean }) {
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const nombreProblemes = sante.enAlerte + sante.aSurveiller;

  const groupes = sante.groupes
    .map((g) => ({ ...g, vehicules: filtre === "tous" ? g.vehicules : g.vehicules.filter(estAProbleme) }))
    .filter((g) => g.vehicules.length > 0);

  const boutonFiltre = (valeur: Filtre, libelle: string) => (
    <button
      type="button"
      aria-pressed={filtre === valeur}
      onClick={() => setFiltre(valeur)}
      className={cn(
        "rounded px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        filtre === valeur ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {libelle}
    </button>
  );

  return (
    <CadreSection
      titre="Statut du parc"
      icone={LayoutGrid}
      lien="/engins"
      actions={
        sante.actifs > 0 && (
          <div className="flex rounded-md bg-muted p-0.5" role="group" aria-label="Filtrer les véhicules">
            {boutonFiltre("tous", `Tous (${sante.actifs})`)}
            {boutonFiltre("problemes", `À problème (${nombreProblemes})`)}
          </div>
        )
      }
    >
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

          {groupes.length === 0 ? (
            <EtatBloc>Aucun véhicule à problème : tout le parc est en règle.</EtatBloc>
          ) : (
            <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              {groupes.map((groupe) => (
                <section key={groupe.statut} aria-label={`${groupe.libelle} : ${groupe.vehicules.length} véhicule(s)`}>
                  <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", COULEUR_STATUT[groupe.statut])} aria-hidden />
                    {groupe.libelle}
                    <span className="tabular-nums text-foreground">{groupe.vehicules.length}</span>
                  </h3>
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                    {groupe.vehicules.map((s) => (
                      <li key={s.engin.idEngin} className="min-w-0">
                        <TuileVehicule sante={s} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <Legende />
          {(sante.horsParc > 0 || sante.dimensionsIndisponibles.length > 0) && (
            <p className="text-[11px] text-muted-foreground">
              {sante.horsParc > 0 && `${sante.horsParc} véhicule(s) réformé(s) ou vendu(s) non affiché(s). `}
              {sante.dimensionsIndisponibles.length > 0 &&
                `Non disponible pour votre profil : ${sante.dimensionsIndisponibles
                  .map((d) => DIMENSIONS_SANTE.find((x) => x.cle === d)!.libelle.toLowerCase())
                  .join(", ")} (pastille grise).`}
            </p>
          )}
        </div>
      )}
    </CadreSection>
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

/** Légende : pictogramme de chaque pastille et sens des couleurs. */
function Legende() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[11px] text-muted-foreground">
      {DIMENSIONS_SANTE.map(({ cle, libelle }) => {
        const Icone = ICONES_DIMENSION[cle];
        return (
          <span key={cle} className="inline-flex items-center gap-1">
            <Icone className="h-3 w-3" aria-hidden />
            {libelle}
          </span>
        );
      })}
      <span className="ml-auto inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-badge-successFg" aria-hidden />OK</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-badge-warningFg" aria-hidden />À surveiller</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-badge-dangerFg" aria-hidden />Alerte</span>
      </span>
    </div>
  );
}
