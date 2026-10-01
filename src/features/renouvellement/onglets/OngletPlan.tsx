import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { MODES_ACQUISITION, texteMontant } from "@/features/couts/couts";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { textePourcent } from "@/features/fiabilite/fiabilite";
import { nombreFr, texteCoutUnitaire } from "@/features/performance/performance";
import { usePlanRenouvellement } from "@/features/renouvellement/api";
import {
  FILTRES_PLAN,
  LIBELLES_ENERGIE,
  PRIORITES,
  classeHausse,
  texteAge,
  texteHausse,
  vehiculesPlan,
  type FiltrePlan,
} from "@/features/renouvellement/renouvellement";
import { cn } from "@/lib/utils";

/**
 * Onglet « Plan de renouvellement » (2026-09-29) : année prévue de chaque
 * véhicule d'après l'âge, le compteur, le classement « à remplacer / à
 * surveiller » (coût de maintenance, pannes) et la hausse du coût par km ;
 * budget de remplacement par année ; âge moyen, mode d'acquisition et énergie
 * par type.
 */
export function OngletPlan({ actif }: { actif: boolean }) {
  const requete = usePlanRenouvellement(actif);
  const [filtre, setFiltre] = useState<FiltrePlan>("TOUS");
  const [recherche, setRecherche] = useState("");
  const d = requete.data;
  if (!d) return <EtatChargement enCours={requete.isPending} erreur={requete.error} />;

  const affiches = vehiculesPlan(d.vehicules, filtre, recherche);
  const maxBudget = Math.max(1, ...d.annees.map((a) => a.montantBudget));
  const cetteAnnee = d.annees[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <CarteChiffre titre="Âge moyen du parc" valeur={texteAge(d.ageMoyen)} precision={`Seuil de remplacement : ${d.ageRemplacementAns} ans`} />
        <CarteChiffre
          titre="À renouveler cette année"
          valeur={d.nombreUrgents}
          classeValeur={d.nombreUrgents > 0 ? "text-badge-dangerFg" : undefined}
          precision={cetteAnnee ? `Budget connu : ${texteMontant(cetteAnnee.montantBudget)}` : undefined}
        />
        <CarteChiffre titre="À prévoir l'an prochain" valeur={d.nombreAPrevoir} classeValeur={d.nombreAPrevoir > 0 ? "text-badge-warningFg" : undefined} />
        <CarteChiffre
          titre="Électriques ou hybrides"
          valeur={textePourcent(d.energie.partElectrifiee)}
          precision={`${(d.energie.parEnergie.ELECTRIQUE ?? 0) + (d.energie.parEnergie.HYBRIDE ?? 0)} sur ${d.energie.nombreVehicules}`}
        />
        <CarteChiffre
          titre="Coût par km : électrifié/thermique"
          valeur={<span className="text-base">{texteCoutUnitaire(d.energie.coutKmElectrifie, "km")} / {texteCoutUnitaire(d.energie.coutKmThermique, "km")}</span>}
          precision="12 derniers mois, véhicules routiers"
        />
      </div>

      <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Cette année</strong> : véhicule classé « à remplacer » (page Coûts).{" "}
        <strong className="text-foreground">L'an prochain</strong> : « à surveiller » avec un coût par km (ou par heure) en hausse de{" "}
        {d.hausseCoutPourcent} % ou plus sur un an, ou seuil d'âge ou de compteur atteint d'ici un an. Sinon, année où l'âge ({d.ageRemplacementAns} ans) ou
        le compteur ({nombreFr(d.kilometrageRemplacement)} km, {nombreFr(d.heuresRemplacement)} h) sera atteint au rythme actuel. Seuils :{" "}
        <Link to="/parametres" className="text-primary hover:underline">Paramètres</Link>.
      </p>

      <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-budget-annees">
        <h2 id="titre-budget-annees" className="font-display text-lg font-semibold">Budget de remplacement par année</h2>
        <p className="text-xs text-muted-foreground">Prix d'achat du véhicule, sinon prix moyen de son type (rubrique Coûts de la fiche).</p>
        <ul className="mt-3 space-y-2">
          {d.annees.map((a) => (
            <li key={a.annee} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="font-medium tabular-nums">{a.annee}</span>
              <span className="h-2.5 rounded-full bg-muted" aria-hidden="true">
                {a.montantBudget > 0 && <span className="block h-full rounded-full bg-primary" style={{ width: `${(a.montantBudget / maxBudget) * 100}%` }} />}
              </span>
              <span className="w-72 text-right tabular-nums">
                {a.nombre} véhicule{a.nombre > 1 ? "s" : ""} · {texteMontant(a.montantBudget)}
                {a.nombreSansPrix > 0 && <span className="text-muted-foreground"> ({a.nombreSansPrix} sans prix)</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2" aria-labelledby="titre-plan-vehicules">
        <h2 id="titre-plan-vehicules" className="font-display text-lg font-semibold">Par véhicule</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par échéance">
            {FILTRES_PLAN.map((f) => (
              <button
                key={f.cle}
                type="button"
                aria-pressed={filtre === f.cle}
                onClick={() => setFiltre(f.cle)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  filtre === f.cle ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {f.libelle}
              </button>
            ))}
          </div>
          <Input className="ml-auto h-9 w-64" placeholder="Rechercher un véhicule" value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Rechercher un véhicule" />
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Véhicule</th>
                <th className="px-3 py-2">Échéance</th>
                <th className="px-3 py-2 text-right">Âge</th>
                <th className="px-3 py-2 text-right">Compteur</th>
                <th className="px-3 py-2 text-right">Coût unitaire</th>
                <th className="px-3 py-2 text-right">Pannes (12 mois)</th>
                <th className="px-3 py-2 text-right">Valeur nette</th>
                <th className="px-3 py-2">Motifs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {affiches.map((v) => (
                <tr key={v.idEngin}>
                  <td className="px-3 py-2">
                    <Link to={`/engins/${v.idEngin}/fiche`} className="font-medium hover:underline">
                      {v.libelleVehicule}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {v.libelleType}
                      {v.modeAcquisition && ` · ${MODES_ACQUISITION[v.modeAcquisition]}`}
                      {v.energie && ` · ${LIBELLES_ENERGIE[v.energie]}`}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Pastille libelle={PRIORITES[v.priorite].libelle} classes={PRIORITES[v.priorite].classes} />
                    {v.anneeRenouvellement !== null && <span className="ml-1.5 tabular-nums">{v.anneeRenouvellement}</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{texteAge(v.ageAns)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{nombreFr(v.compteur)} {v.uniteUsage}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {texteCoutUnitaire(v.coutParUnite, v.uniteUsage)}
                    <span className={cn("block text-xs", classeHausse(v.hausseCoutPourcent, d.hausseCoutPourcent))}>{texteHausse(v.hausseCoutPourcent)}</span>
                  </td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", v.pannes12Mois > 0 && "text-badge-warningFg")}>{v.pannes12Mois}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.valeurNette)}</td>
                  <td className="px-3 py-2 text-xs">{v.motifs.join(" ; ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {affiches.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Aucun véhicule pour ce filtre.</p>}
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="titre-parc-types">
        <h2 id="titre-parc-types" className="font-display text-lg font-semibold">Âge, acquisition et énergie par type</h2>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Véhicules</th>
                <th className="px-3 py-2 text-right">Âge moyen</th>
                <th className="px-3 py-2 text-right">Achat</th>
                <th className="px-3 py-2 text-right">Location longue durée</th>
                <th className="px-3 py-2 text-right">Crédit-bail</th>
                <th className="px-3 py-2 text-right">Mode non saisi</th>
                <th className="px-3 py-2 text-right">Électriques ou hybrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.types.map((t) => (
                <tr key={t.idTypeEngin ?? t.libelle ?? "?"}>
                  <td className="px-3 py-2 font-medium">{t.libelle ?? "Sans type"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.nombre}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {texteAge(t.ageMoyen)}
                    {t.nombreAgeInconnu > 0 && <span className="block text-xs text-muted-foreground">{t.nombreAgeInconnu} sans date</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.nombreAchat}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.nombreLocationLongueDuree}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.nombreCreditBail}</td>
                  <td className={cn("px-3 py-2 text-right tabular-nums", t.nombreModeInconnu > 0 && "text-muted-foreground")}>{t.nombreModeInconnu}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {t.nombreElectriques} / {t.nombreHybrides}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Le mode d'acquisition se saisit dans la rubrique Coûts de la fiche ; l'énergie dans la fiche technique du véhicule.
        </p>
      </section>
    </div>
  );
}
