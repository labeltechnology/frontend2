import { Layers } from "lucide-react";
import { BadgeEcart } from "@/features/performance/sections/BadgeEcart";
import { classeTaux, nombreFr, texteCoutUnitaire, texteEnTrop } from "@/features/performance/performance";
import { cn } from "@/lib/utils";
import type { SyntheseTypePerformance } from "@/types/performance";

/**
 * Synthèse par type : utilisation, usage par mois, coût par km (ou par h)
 * comparé à la référence, sous-utilisés, pic d'utilisation simultanée et
 * véhicules en trop.
 */
export function TableauTypes({ types }: { types: SyntheseTypePerformance[] }) {
  const avecTrop = types.filter((t) => t.vehiculesEnTrop > 0);
  return (
    <section className="space-y-3" aria-labelledby="titre-types">
      <div>
        <h2 id="titre-types" className="font-display text-lg font-semibold">Par type de véhicule</h2>
        <p className="text-sm text-muted-foreground">
          Coût unitaire comparé à la référence du type : vert si égal ou moins cher, orange jusqu'à +10 %, rouge au-delà.
        </p>
      </div>

      {avecTrop.length > 0 && (
        <div className="rounded-xl border border-badge-warningFg/40 bg-badge-warningBg p-3 text-sm text-badge-warningFg">
          <p className="flex items-center gap-2 font-semibold">
            <Layers className="h-4 w-4" aria-hidden="true" />
            Véhicules en trop
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-6">
            {avecTrop.map((t) => (
              <li key={t.idTypeEngin ?? t.libelle}>{texteEnTrop(t)}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs opacity-90">À vérifier avant toute vente, restitution ou transfert : besoins de réserve et pics saisonniers hors période.</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">Véhicules</th>
              <th className="px-3 py-2">Utilisation</th>
              <th className="px-3 py-2 text-right">Utilisation mensuelle</th>
              <th className="px-3 py-2 text-right">Coût total</th>
              <th className="px-3 py-2 text-right">Coût unitaire</th>
              <th className="px-3 py-2">Référence</th>
              <th className="px-3 py-2 text-right">Sous-utilisés</th>
              <th className="px-3 py-2 text-right">Pic simultané</th>
              <th className="px-3 py-2 text-right">En trop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {types.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">Aucun véhicule sur ce filtre.</td>
              </tr>
            )}
            {types.map((t) => (
              <tr key={t.idTypeEngin ?? t.libelle}>
                <td className="px-3 py-2">
                  <span className="font-medium">{t.libelle}</span>
                  <span className="block text-xs text-muted-foreground">{t.uniteUsage === "h" ? "Engin de chantier" : "Véhicule routier"}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{t.nombreVehicules}</td>
                <td className="px-3 py-2">
                  <Jauge valeur={t.tauxUtilisation} seuil={t.seuilTauxJours} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {t.usageMensuelMoyen === null ? "—" : `${nombreFr(t.usageMensuelMoyen, t.uniteUsage === "h" ? 1 : 0)} ${t.uniteUsage}`}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{nombreFr(t.couts.total)} Ar</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{texteCoutUnitaire(t.coutParUnite, t.uniteUsage)}</td>
                <td className="px-3 py-2">
                  <span className="block text-xs text-muted-foreground">{texteCoutUnitaire(t.coutReference, t.uniteUsage)}</span>
                  <BadgeEcart niveau={t.niveauEcart} pourcent={t.ecartReferencePourcent} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{t.nombreSousUtilises}</td>
                <td className="px-3 py-2 text-right tabular-nums">{t.picSimultane}</td>
                <td className={cn("px-3 py-2 text-right tabular-nums", t.vehiculesEnTrop > 0 && "font-semibold text-badge-warningFg")}>
                  {t.vehiculesEnTrop}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Jauge d'utilisation, avec le seuil du type marqué d'un trait. */
export function Jauge({ valeur, seuil }: { valeur: number | null; seuil: number | null | undefined }) {
  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {valeur !== null && <div className={cn("h-full rounded-full", classeTaux(valeur, seuil))} style={{ width: `${Math.min(100, valeur)}%` }} />}
        {seuil != null && <div className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: `${Math.min(100, seuil)}%` }} />}
      </div>
      <span className="w-14 text-right text-xs tabular-nums">{valeur === null ? "—" : `${nombreFr(valeur, 1)} %`}</span>
    </div>
  );
}
