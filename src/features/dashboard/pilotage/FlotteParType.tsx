import { Fragment } from "react";
import { Truck } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { flotteParFamille } from "@/features/dashboard/pilotage/flotte-par-famille";
import { part, texteUsageJour } from "@/features/dashboard/pilotage/pilotage";
import { cn } from "@/lib/utils";
import type { FlottePilotage, RepartitionFlotte } from "@/types/pilotage";

const SEGMENTS: { cle: keyof Omit<RepartitionFlotte, "total" | "surChantier">; libelle: string; classe: string }[] = [
  { cle: "enService", libelle: "En service", classe: "bg-badge-successFg" },
  { cle: "atelier", libelle: "Atelier", classe: "bg-badge-warningFg" },
  { cle: "panne", libelle: "En panne", classe: "bg-badge-dangerFg" },
  { cle: "horsService", libelle: "Hors service", classe: "bg-muted-foreground/50" },
];

/**
 * « État de la flotte » (2026-09-30) : synthèse par statut (en service dont
 * sur chantier, atelier, panne, hors service), puis par type de matériel avec
 * l'utilisation des 30 derniers jours. Les réformés sont « hors service » ;
 * les vendus ne comptent plus.
 *
 * 2026-10-01 (demande de la direction) : détail catégorie → famille → type
 * avec sous-totaux (flotte-par-famille.ts) ; les types en plus petit.
 */
export function FlotteParType({
  flotte,
  enChargement,
  enErreur,
}: {
  flotte: FlottePilotage | undefined;
  enChargement: boolean;
  enErreur: boolean;
}) {
  return (
    <CadreSection titre="État de la flotte" icone={Truck} lien="/engins" libelleLien="Tous les véhicules">
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : enErreur || !flotte ? (
        <EtatBloc erreur>État de la flotte indisponible.</EtatBloc>
      ) : (
        <div className="space-y-4">
          <Synthese r={flotte.total} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Répartition par catégorie, famille et type de matériel</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Catégorie / famille / type</th>
                  <th className="px-2 py-2 text-right font-medium">Total</th>
                  <th className="px-2 py-2 text-right font-medium">En service</th>
                  <th className="px-2 py-2 text-right font-medium">Atelier</th>
                  <th className="px-2 py-2 text-right font-medium">Panne</th>
                  <th className="px-2 py-2 text-right font-medium">Hors service</th>
                  <th className="px-2 py-2 font-medium">Répartition</th>
                  <th className="px-2 py-2 text-right font-medium" title={flotte.periodeUtilisation}>
                    Utilisation
                  </th>
                  <th className="py-2 pl-2 text-right font-medium" title={`Par véhicule, ${flotte.periodeUtilisation}`}>
                    Usage / jour
                  </th>
                </tr>
              </thead>
              {flotteParFamille(flotte.types).map((c) => (
                <tbody key={c.categorie} className="border-b last:border-b-0">
                  <LigneFlotte
                    niveau="categorie"
                    libelle={c.libelle}
                    r={c.repartition}
                    taux={c.tauxUtilisation}
                    usage={c.usageParJour}
                    unite={c.uniteUsage}
                  />
                  {c.avecFamilles
                    ? c.familles.map((f) => (
                        <Fragment key={f.famille ?? "sans-famille"}>
                          <LigneFlotte
                            niveau="famille"
                            libelle={f.libelle}
                            r={f.repartition}
                            taux={f.tauxUtilisation}
                            usage={f.usageParJour}
                            unite={f.uniteUsage}
                          />
                          {f.types.map((t) => (
                            <LigneFlotte
                              key={t.idTypeEngin ?? "sans-type"}
                              niveau="type"
                              libelle={t.libelle}
                              r={t.repartition}
                              taux={t.tauxUtilisation}
                              usage={t.usageParJour}
                              unite={t.uniteUsage}
                            />
                          ))}
                        </Fragment>
                      ))
                    : c.familles
                        .flatMap((f) => f.types)
                        .map((t) => (
                          <LigneFlotte
                            key={t.idTypeEngin ?? "sans-type"}
                            niveau="famille"
                            libelle={t.libelle}
                            r={t.repartition}
                            taux={t.tauxUtilisation}
                            usage={t.usageParJour}
                            unite={t.uniteUsage}
                          />
                        ))}
                </tbody>
              ))}
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Utilisation et usage par jour : {flotte.periodeUtilisation} (calcul de la page Performance).
          </p>
        </div>
      )}
    </CadreSection>
  );
}

/** Ligne du tableau : catégorie (fond, gras), famille (normal) ou type (plus petit, en retrait). */
function LigneFlotte({
  niveau,
  libelle,
  r,
  taux,
  usage,
  unite,
}: {
  niveau: "categorie" | "famille" | "type";
  libelle: string;
  r: RepartitionFlotte;
  taux: number | null;
  usage: number | null;
  unite: string | null;
}) {
  const type = niveau === "type";
  const cellule = cn("px-2 text-right tabular-nums", type ? "py-1 text-xs text-muted-foreground" : "py-2");
  return (
    <tr className={cn(niveau === "categorie" && "bg-muted/40 font-semibold", niveau === "famille" && "border-t border-border/60")}>
      <td
        className={cn(
          "pr-3",
          niveau === "categorie" && "py-2 pl-2 text-foreground",
          niveau === "famille" && "py-2 pl-4 font-medium text-foreground",
          type && "py-1 pl-8 text-xs text-muted-foreground",
        )}
      >
        {libelle}
      </td>
      <td className={cellule}>{r.total}</td>
      <td className={cellule}>
        {r.enService} <span className="text-xs font-normal text-muted-foreground">({part(r.enService, r.total)} %)</span>
      </td>
      <td className={cellule}>{r.atelier || "—"}</td>
      <td className={cn(cellule, r.panne > 0 && "font-semibold text-badge-dangerFg")}>{r.panne || "—"}</td>
      <td className={cellule}>{r.horsService || "—"}</td>
      <td className={cn("px-2", type ? "py-1" : "py-2")}>
        <Barre r={r} />
      </td>
      <td className={cellule}>{taux === null ? "—" : `${Math.round(taux)} %`}</td>
      <td className={cn("pl-2 text-right tabular-nums", type ? "py-1 text-xs text-muted-foreground" : "py-2")}>
        {texteUsageJour(usage, unite)}
      </td>
    </tr>
  );
}

function Synthese({ r }: { r: RepartitionFlotte }) {
  const chiffres = [
    { libelle: "Flotte", valeur: r.total, detail: "véhicules", classe: "text-foreground" },
    { libelle: "En service", valeur: r.enService, detail: `${part(r.enService, r.total)} %`, classe: "text-badge-successFg" },
    { libelle: "Sur chantier", valeur: r.surChantier, detail: `${part(r.surChantier, r.total)} %`, classe: "text-foreground" },
    { libelle: "À l'atelier", valeur: r.atelier, detail: `${part(r.atelier, r.total)} %`, classe: "text-badge-warningFg" },
    { libelle: "En panne", valeur: r.panne, detail: `${part(r.panne, r.total)} %`, classe: "text-badge-dangerFg" },
    { libelle: "Hors service", valeur: r.horsService, detail: `${part(r.horsService, r.total)} %`, classe: "text-muted-foreground" },
  ];
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {chiffres.map((c) => (
          <div key={c.libelle} className="rounded-lg bg-muted/40 px-3 py-2">
            <dt className="text-xs text-muted-foreground">{c.libelle}</dt>
            <dd className={cn("font-display text-xl font-bold tabular-nums", c.classe)}>{c.valeur}</dd>
            <dd className="text-xs text-muted-foreground">{c.detail}</dd>
          </div>
        ))}
      </dl>
      <Barre r={r} haute />
      <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {SEGMENTS.map((s) => (
          <li key={s.cle} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-sm", s.classe)} aria-hidden />
            {s.libelle}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Barre({ r, haute }: { r: RepartitionFlotte; haute?: boolean }) {
  const texte = SEGMENTS.map((s) => `${s.libelle} ${r[s.cle]}`).join(", ");
  return (
    <div className={cn("flex w-full min-w-[90px] overflow-hidden rounded-full bg-muted", haute ? "h-2.5" : "h-1.5")} role="img" aria-label={texte} title={texte}>
      {SEGMENTS.map((s) =>
        r[s.cle] > 0 ? <span key={s.cle} className={s.classe} style={{ width: `${(r[s.cle] / Math.max(r.total, 1)) * 100}%` }} /> : null,
      )}
    </div>
  );
}
