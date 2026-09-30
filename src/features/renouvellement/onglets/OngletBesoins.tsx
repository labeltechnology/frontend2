import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { textePourcent } from "@/features/fiabilite/fiabilite";
import { nombreFr } from "@/features/performance/performance";
import { useBesoinsFuturs } from "@/features/renouvellement/api";
import { CONCLUSIONS, texteEcartBesoin, texteHausse } from "@/features/renouvellement/renouvellement";
import { cn, formatDate } from "@/lib/utils";

/**
 * Onglet « Besoins futurs » (2026-09-29, choix validé : projection simple) :
 * tendance d'usage sur 6 mois, pic d'utilisation simultanée, besoins des
 * chantiers prévus, disponibilité du type → véhicules nécessaires dans
 * 12 mois.
 */
export function OngletBesoins({ actif }: { actif: boolean }) {
  const requete = useBesoinsFuturs(actif);
  const d = requete.data;
  if (!d) return <EtatChargement enCours={requete.isPending} erreur={requete.error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <CarteChiffre titre="Véhicules à acquérir" valeur={d.nombreAAcquerir} classeValeur={d.nombreAAcquerir > 0 ? "text-badge-warningFg" : undefined} precision="Sur 12 mois, tous types" />
        <CarteChiffre titre="Véhicules en surplus" valeur={d.nombreEnSurplus} precision="À réaffecter ou à céder" />
        <CarteChiffre
          titre="Tendance mesurée"
          valeur={<span className="text-base">6 mois contre 6 mois</span>}
          precision={`Du ${formatDate(d.debutAncien)} au ${formatDate(d.fin)}`}
        />
      </div>

      <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Besoin projeté</strong> = pic d'utilisation simultanée des 12 derniers mois × (1 + tendance d'usage), au moins
        le besoin des chantiers prévus (mois le plus chargé). <strong className="text-foreground">Véhicules nécessaires</strong> = besoin ÷ disponibilité
        du type, car une partie du parc est en maintenance. C'est une estimation à confirmer.
      </p>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">En service</th>
              <th className="px-3 py-2 text-right">Usage 6 derniers mois</th>
              <th className="px-3 py-2 text-right">Tendance</th>
              <th className="px-3 py-2 text-right">Pic simultané</th>
              <th className="px-3 py-2 text-right">Chantiers</th>
              <th className="px-3 py-2 text-right">Disponibilité</th>
              <th className="px-3 py-2 text-right">Nécessaires</th>
              <th className="px-3 py-2 text-right">Écart</th>
              <th className="px-3 py-2">Conclusion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {d.types.map((t) => (
              <tr key={t.idTypeEngin ?? t.libelle ?? "?"}>
                <td className="px-3 py-2 font-medium">{t.libelle ?? "Sans type"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{t.nombreEnService}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {nombreFr(t.usageRecent)} {t.uniteUsage}
                  <span className="block text-xs text-muted-foreground">avant : {nombreFr(t.usageAncien)} {t.uniteUsage}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{texteHausse(t.tendancePourcent)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{t.picSimultane}</td>
                <td className="px-3 py-2 text-right tabular-nums">{t.besoinChantier || "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{textePourcent(t.tauxDisponibilite)}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{t.vehiculesNecessaires}</td>
                <td className={cn("px-3 py-2 text-right font-medium tabular-nums", t.ecart > 0 && "text-badge-warningFg")}>
                  {t.conclusion === "SANS_ACTIVITE" ? "—" : texteEcartBesoin(t.ecart)}
                </td>
                <td className="px-3 py-2">
                  <Pastille libelle={CONCLUSIONS[t.conclusion].libelle} classes={CONCLUSIONS[t.conclusion].classes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
