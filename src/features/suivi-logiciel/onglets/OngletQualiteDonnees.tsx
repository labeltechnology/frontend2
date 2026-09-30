import { useState } from "react";
import { Link } from "react-router-dom";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { useQualiteDonnees } from "@/features/suivi-logiciel/api";
import { classeTaux, texteTaux } from "@/features/suivi-logiciel/suivi-logiciel";
import { cn } from "@/lib/utils";
import type { ElementIncomplet } from "@/types/suivi-logiciel";

const PREMIERS = 30;

/**
 * Onglet « Qualité des données » (2026-09-29) : ce qui manque pour que les
 * indicateurs soient justes — relevés de kilométrage, consommation de
 * référence, réservoir, documents, coûts fixes, qualifications.
 */
export function OngletQualiteDonnees({ actif }: { actif: boolean }) {
  const requete = useQualiteDonnees(actif);
  const q = requete.data;
  if (!q) return <EtatChargement enCours={requete.isPending} erreur={requete.error} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <CarteChiffre titre="Complétude des données" valeur={texteTaux(q.tauxGlobal)} classeValeur={classeTaux(q.tauxGlobal, 90, 70)} precision="Critères remplis sur critères contrôlés" />
        <CarteChiffre titre="Véhicules complets" valeur={`${q.vehiculesComplets} / ${q.nombreVehicules}`} precision="Véhicules en service" />
        <CarteChiffre titre="Conducteurs complets" valeur={`${q.conducteursComplets} / ${q.nombreConducteurs}`} precision="Conducteurs en service" />
      </div>

      <section className="space-y-2 rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-criteres">
        <h2 id="titre-criteres" className="font-display text-lg font-semibold">Par critère</h2>
        <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {q.criteres.map((c) => (
            <li key={c.critere} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>
                  {c.libelle}
                  <span className="text-xs text-muted-foreground"> · {c.vehicule ? "véhicules" : "conducteurs"}</span>
                </span>
                <span className={cn("tabular-nums", classeTaux(c.taux, 90, 70))}>
                  {c.remplis}/{c.controles} ({texteTaux(c.taux)})
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${c.taux ?? 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ListeIncomplets titre="Véhicules à compléter" elements={q.vehicules} lien={(e) => `/engins/${e.id}/fiche`} vide="Toutes les fiches véhicule sont complètes." />
      <ListeIncomplets titre="Conducteurs à compléter" elements={q.conducteurs} lien={() => "/conducteurs"} vide="Toutes les fiches conducteur sont complètes." />
    </div>
  );
}

function ListeIncomplets({ titre, elements, lien, vide }: { titre: string; elements: ElementIncomplet[]; lien: (e: ElementIncomplet) => string; vide: string }) {
  const [tous, setTous] = useState(false);
  const visibles = tous ? elements : elements.slice(0, PREMIERS);
  return (
    <section className="space-y-2" aria-label={titre}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">
          {titre} ({elements.length})
        </h2>
        {elements.length > PREMIERS && (
          <button type="button" className="text-sm text-primary hover:underline" onClick={() => setTous((v) => !v)}>
            {tous ? "Voir les premiers" : `Voir les ${elements.length}`}
          </button>
        )}
      </div>
      {elements.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm text-badge-successFg">{vide}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border bg-card shadow-sm">
          {visibles.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2 text-sm">
              <span>
                <Link to={lien(e)} className="font-medium hover:underline">
                  {e.libelle}
                </Link>
                {e.precision && <span className="block text-xs text-muted-foreground">{e.precision}</span>}
              </span>
              <span className="flex flex-wrap justify-end gap-1">
                {e.manques.map((m) => (
                  <Pastille key={m} libelle={m} classes="bg-badge-warningBg text-badge-warningFg" />
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
