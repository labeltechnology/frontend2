import { Truck } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
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
              <caption className="sr-only">Répartition par type de matériel</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Type de matériel</th>
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
              <tbody className="divide-y">
                {flotte.types.map((t) => {
                  const r = t.repartition;
                  return (
                    <tr key={t.idTypeEngin ?? "sans-type"}>
                      <td className="py-2 pr-3 font-medium text-foreground">{t.libelle}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{r.total}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {r.enService} <span className="text-xs text-muted-foreground">({part(r.enService, r.total)} %)</span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{r.atelier || "—"}</td>
                      <td className={cn("px-2 py-2 text-right tabular-nums", r.panne > 0 && "font-semibold text-badge-dangerFg")}>
                        {r.panne || "—"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{r.horsService || "—"}</td>
                      <td className="px-2 py-2">
                        <Barre r={r} />
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {t.tauxUtilisation === null ? "—" : `${Math.round(t.tauxUtilisation)} %`}
                      </td>
                      <td className="py-2 pl-2 text-right tabular-nums">{texteUsageJour(t.usageParJour, t.uniteUsage)}</td>
                    </tr>
                  );
                })}
              </tbody>
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
