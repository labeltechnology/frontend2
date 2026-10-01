import { useMemo, useState } from "react";
import { ClipboardList, ShieldAlert, Wrench } from "lucide-react";
import { useCarburant } from "@/features/carburant/api";
import { useEngins } from "@/features/engins/api";
import { useIncidents } from "@/features/incidents/api";
import { useMaintenances } from "@/features/maintenance/api";
import { useMissions } from "@/features/missions/api";
import {
  classementVehicules,
  consommationFlotte,
  consommationParVehicule,
  ecartPourcent,
  repartition,
  serie,
  total,
} from "@/features/analytics/agregats";
import { filtrerFaits, mesure, vehiculesRetenus, type CleMesure, type SourcesAnalyse } from "@/features/analytics/mesures";
import {
  dansIntervalle,
  granulariteParDefaut,
  granularitesPossibles,
  intervallePeriode,
  intervallePrecedent,
  lireDate,
  seauxTemporels,
  LIBELLES_GRANULARITE,
  LIBELLES_PERIODE,
  type Granularite,
  type PeriodeAnalyse,
} from "@/features/analytics/periode";
import { CarteKpi } from "@/features/analytics/sections/CarteKpi";
import { CarteRepartition } from "@/features/analytics/sections/CarteRepartition";
import { ClassementVehicules } from "@/features/analytics/sections/ClassementVehicules";
import { ConsommationVehicules } from "@/features/analytics/sections/ConsommationVehicules";
import { FiltresAnalytique } from "@/features/analytics/sections/FiltresAnalytique";
import { GrapheParametrable, type FormeGraphe } from "@/features/analytics/sections/GrapheParametrable";
import { formatNombre } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { TypeEngin } from "@/types/engin";

const MESURES_KPI: CleMesure[] = ["coutTotal", "carburant", "maintenance", "km", "incidents"];
const TITRES_KPI: Record<string, string> = {
  coutTotal: "Coût total",
  carburant: "Carburant",
  maintenance: "Maintenance",
  km: "Kilomètres parcourus",
  incidents: "Incidents",
};

/**
 * Analytique (refonte du 2026-09-25, « même chose pour l'analytique avec
 * graphe paramétrable »). Choix validés par l'utilisateur : nouvelle page ;
 * graphe réglable (mesure, regroupement, forme, comparaison) ; filtres
 * période / véhicule / type pour toute la page.
 *
 *  1. Filtres (une ligne, en haut).
 *  2. Indicateurs de gestion avec écart vs période précédente : coût total,
 *     carburant, maintenance, km parcourus, consommation moyenne, incidents.
 *  3. Graphe paramétrable.
 *  4. Véhicules les plus coûteux + consommation par véhicule.
 *  5. Répartitions : missions par statut, maintenances par type, incidents par type.
 *
 * Tout est calculé côté navigateur à partir des listes existantes (aucun
 * nouvel endpoint) ; les calculs sont dans periode.ts, mesures.ts et
 * agregats.ts (purs, testés).
 */
export function AnalyticsPage() {
  const engins = useEngins();
  const pleins = useCarburant();
  const maintenances = useMaintenances();
  const missions = useMissions();
  const incidents = useIncidents();

  const [periode, setPeriode] = useState<PeriodeAnalyse>("30j");
  const [idEngin, setIdEngin] = useState<number | null>(null);
  const [idTypeEngin, setIdTypeEngin] = useState<number | null>(null);
  const [cleMesure, setCleMesure] = useState<CleMesure>("coutTotal");
  const [granularite, setGranularite] = useState<Granularite>(granulariteParDefaut("30j"));
  const [forme, setForme] = useState<FormeGraphe>("barres");
  const [comparer, setComparer] = useState(false);

  const maintenant = useMemo(() => new Date(), []);
  const intervalle = useMemo(() => intervallePeriode(periode, maintenant), [periode, maintenant]);
  const precedent = useMemo(() => intervallePrecedent(intervalle), [intervalle]);
  const granularites = granularitesPossibles(periode);

  const changerPeriode = (p: PeriodeAnalyse) => {
    setPeriode(p);
    if (!granularitesPossibles(p).includes(granularite)) setGranularite(granulariteParDefaut(p));
  };
  const changerType = (id: number | null) => {
    setIdTypeEngin(id);
    // Le véhicule choisi doit rester cohérent avec le type.
    if (id !== null && idEngin !== null && engins.data?.find((e) => e.idEngin === idEngin)?.typeEngin?.idTypeEngin !== id) setIdEngin(null);
  };

  const listeEngins = useMemo(() => engins.data ?? [], [engins.data]);
  const types = useMemo(() => {
    const parId = new Map<number, TypeEngin>();
    for (const e of listeEngins) if (e.typeEngin) parId.set(e.typeEngin.idTypeEngin, e.typeEngin);
    return [...parId.values()].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  }, [listeEngins]);

  const retenus = useMemo(() => vehiculesRetenus(listeEngins, { idEngin, idTypeEngin }), [listeEngins, idEngin, idTypeEngin]);
  const sources: SourcesAnalyse = useMemo(
    () => ({
      pleins: pleins.data ?? [],
      maintenances: maintenances.data ?? [],
      missions: missions.data ?? [],
      incidents: incidents.data ?? [],
    }),
    [pleins.data, maintenances.data, missions.data, incidents.data],
  );

  // --- Indicateurs
  const kpis = useMemo(
    () =>
      MESURES_KPI.map((cle) => {
        const faits = filtrerFaits(mesure(cle).faits(sources), retenus);
        const actuel = total(faits, intervalle);
        return { cle, def: mesure(cle), actuel, ecart: ecartPourcent(actuel, total(faits, precedent)) };
      }),
    [sources, retenus, intervalle, precedent],
  );
  const consommations = useMemo(() => consommationParVehicule(sources.pleins, listeEngins, intervalle, retenus), [sources.pleins, listeEngins, intervalle, retenus]);
  const moyenneConso = consommationFlotte(consommations);
  const moyenneConsoPrecedente = useMemo(
    () => consommationFlotte(consommationParVehicule(sources.pleins, listeEngins, precedent, retenus)),
    [sources.pleins, listeEngins, precedent, retenus],
  );

  // --- Graphe
  const mesureGraphe = mesure(cleMesure);
  const points = useMemo(() => {
    const faits = filtrerFaits(mesure(cleMesure).faits(sources), retenus);
    const seaux = seauxTemporels(intervalle, granularite);
    const valeurs = serie(faits, seaux);
    const precedentes = serie(faits, seauxTemporels(precedent, granularite));
    return seaux.map((s, i) => ({ libelle: s.libelle, valeur: valeurs[i], precedent: precedentes[i] ?? 0 }));
  }, [cleMesure, sources, retenus, intervalle, precedent, granularite]);
  const totalGraphe = points.reduce((s, p) => s + p.valeur, 0);
  const ecartGraphe = ecartPourcent(totalGraphe, points.reduce((s, p) => s + (p.precedent ?? 0), 0));

  // --- Classements et répartitions (sur la période et les filtres)
  const plusCouteux = useMemo(
    () => classementVehicules(filtrerFaits(mesure("coutTotal").faits(sources), retenus), listeEngins, intervalle, 5),
    [sources, retenus, listeEngins, intervalle],
  );
  const retenu = (id: number) => retenus === null || retenus.has(id);
  const missionsPeriode = sources.missions.filter((m) => retenu(m.engin.idEngin) && dansIntervalle(lireDate(m.dateDebutReelle ?? m.dateDebutPrevue), intervalle));
  const maintenancesPeriode = sources.maintenances.filter((m) => m.engin && retenu(m.engin.idEngin) && dansIntervalle(lireDate(m.dateFin ?? m.dateDebut), intervalle));
  const incidentsPeriode = sources.incidents.filter((i) => retenu(i.engin.idEngin) && dansIntervalle(lireDate(i.dateSurvenue), intervalle));

  const chargement = [engins, pleins, maintenances, missions, incidents].some((q) => q.isPending && !q.isError);
  const indisponibles = [
    pleins.isError && "carburant",
    maintenances.isError && "maintenances",
    missions.isError && "missions",
    incidents.isError && "incidents",
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Analytique</h1>
          <p className="text-sm text-muted-foreground">Coûts, utilisation et incidents du parc, comparés à la période précédente.</p>
        </div>
        <FiltresAnalytique
          periode={periode}
          onPeriode={changerPeriode}
          idEngin={idEngin}
          onEngin={setIdEngin}
          idTypeEngin={idTypeEngin}
          onType={changerType}
          engins={listeEngins}
          types={types}
        />
      </div>

      {indisponibles.length > 0 && (
        <p className="rounded-md border border-badge-warningFg/40 bg-badge-warningBg px-3 py-2 text-sm text-badge-warningFg">
          Données non chargées (accès refusé ou erreur) : {indisponibles.join(", ")}. Les chiffres concernés sont à 0.
        </p>
      )}
      {chargement && <p className="text-sm text-muted-foreground">Chargement des données…</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <CarteKpi key={k.cle} titre={TITRES_KPI[k.cle]} valeur={k.def.formater(k.actuel)} ecart={k.ecart} hausseSouhaitable={k.def.hausseSouhaitable} />
        ))}
        <CarteKpi
          titre="Consommation moyenne"
          valeur={moyenneConso === null ? "—" : `${formatNombre(moyenneConso, 1)} L/100 km`}
          ecart={moyenneConso !== null && moyenneConsoPrecedente !== null ? ecartPourcent(moyenneConso, moyenneConsoPrecedente) : null}
          hausseSouhaitable={false}
          precision={moyenneConso === null ? "Nombre de pleins insuffisant sur la période" : undefined}
        />
      </div>

      <GrapheParametrable
        mesure={mesureGraphe}
        onMesure={setCleMesure}
        granularite={granularite}
        granularites={granularites}
        onGranularite={setGranularite}
        forme={forme}
        onForme={setForme}
        comparer={comparer}
        onComparer={setComparer}
        points={points}
        totalActuel={totalGraphe}
        ecart={ecartGraphe}
        contexte={[
          LIBELLES_PERIODE[periode],
          idTypeEngin !== null ? `type : ${types.find((t) => t.idTypeEngin === idTypeEngin)?.libelle ?? idTypeEngin}` : null,
          idEngin !== null ? `véhicule : ${libelleVehicule(listeEngins.find((e) => e.idEngin === idEngin))}` : null,
          `regroupement : ${LIBELLES_GRANULARITE[granularite].toLowerCase()}`,
          comparer ? "comparé à la période précédente" : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ClassementVehicules titre="Véhicules les plus coûteux" lignes={plusCouteux} formater={mesure("coutTotal").formater} />
        <ConsommationVehicules lignes={consommations} moyenne={moyenneConso} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CarteRepartition
          titre="Missions par statut"
          icone={ClipboardList}
          lien="/missions"
          parts={repartition(missionsPeriode, (m) => m.statut, { PLANIFIEE: "Planifiée", EN_COURS: "En cours", TERMINEE: "Terminée", ANNULEE: "Annulée" })}
        />
        <CarteRepartition
          titre="Maintenances par type"
          icone={Wrench}
          lien="/maintenance"
          avecMontant
          parts={repartition(maintenancesPeriode, (m) => m.type, { PREVENTIVE: "Préventive", CORRECTIVE: "Corrective" }, (m) => m.coutTotal ?? m.coutCalcule ?? 0)}
        />
        <CarteRepartition
          titre="Incidents par type"
          icone={ShieldAlert}
          lien="/incidents"
          parts={repartition(incidentsPeriode, (i) => i.type, { ACCIDENT: "Accident", PANNE: "Panne", VOL: "Vol", AUTRE: "Autre", DEGATS: "Dégâts" })}
        />
      </div>
    </div>
  );
}
