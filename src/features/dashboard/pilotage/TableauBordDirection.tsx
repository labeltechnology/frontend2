import { useMemo, type ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertesUrgentes } from "@/features/dashboard/pilotage/AlertesUrgentes";
import { CoutsDuMoisBudget } from "@/features/dashboard/pilotage/CoutsDuMoisBudget";
import { FlotteParType } from "@/features/dashboard/pilotage/FlotteParType";
import { KpiCritiques } from "@/features/dashboard/pilotage/KpiCritiques";
import { StatutParcParCategorie } from "@/features/dashboard/pilotage/StatutParcParCategorie";
import { alertesUrgentes } from "@/features/dashboard/pilotage/pilotage";
import { useAlertesPilotage, useFlottePilotage, useKpiPilotage } from "@/features/dashboard/pilotage/pilotage-api";
import { VehiculesImmobilises } from "@/features/dashboard/pilotage/VehiculesImmobilises";
import type { ElementATraiter, MissionSuivie } from "@/features/dashboard/indicateurs";
import type { SanteParc } from "@/features/dashboard/sante-parc";
import { ActiviteRecente } from "@/features/dashboard/sections/ActiviteRecente";
import { EnTeteTableauBord } from "@/features/dashboard/sections/EnTeteTableauBord";
import { MissionsEnCours } from "@/features/dashboard/sections/MissionsEnCours";
import { TemoinEnDirect } from "@/features/temps-reel/TemoinEnDirect";
import type { JournalAudit } from "@/types/audit";

/**
 * Tableau de bord de direction (2026-09-30, DG et responsable du parc ;
 * choix validés : KPI avec cible, seuil et tendance ; alertes chiffrées ;
 * flotte par type de matériel ; coûts du mois face au budget).
 *
 *  1. En-tête : date, heure de la dernière actualisation, témoin « En direct ».
 *  2. KPI critiques (6).
 *  3. Notifications (critiques puis avertissements ; « Alertes urgentes » avant le 2026-10-01) + statut du parc par
 *     catégorie puis type de matériel (2026-09-30, remplace le mur du parc ici).
 *  4. État de la flotte par type de matériel.
 *  5. Véhicules immobilisés, chiffrés.
 *  6. Coûts du mois face au budget + missions en cours.
 *  7. Activité récente.
 *
 * Tout se met à jour seul : les changements poussés en temps réel relisent
 * ces blocs (clés « pilotage », voir lib/temps-reel/canaux.ts).
 */
export function TableauBordDirection({
  date,
  salutation,
  actions,
  aTraiter,
  aTraiterEnChargement,
  sante,
  santeEnChargement,
  missions,
  missionsEnChargement,
  missionsEnErreur,
  activite,
  peutVoirActivite,
  peutRegler,
  dialogues,
}: {
  date: string;
  salutation: string;
  actions: ReactNode;
  aTraiter: ElementATraiter[];
  aTraiterEnChargement: boolean;
  sante: SanteParc;
  santeEnChargement: boolean;
  missions: MissionSuivie[];
  missionsEnChargement: boolean;
  missionsEnErreur: boolean;
  activite: JournalAudit[] | undefined;
  peutVoirActivite: boolean;
  peutRegler: boolean;
  dialogues: ReactNode;
}) {
  const kpis = useKpiPilotage(true);
  const alertes = useAlertesPilotage(true);
  const flotte = useFlottePilotage(true);

  const urgentes = useMemo(() => alertesUrgentes(alertes.data ?? [], aTraiter), [alertes.data, aTraiter]);
  const actualise = Math.max(kpis.dataUpdatedAt, alertes.dataUpdatedAt, flotte.dataUpdatedAt);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <EnTeteTableauBord
        date={date}
        salutation={salutation}
        actions={actions}
        sousTitre={
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <TemoinEnDirect />
            {actualise > 0 ? `Actualisé à ${format(actualise, "HH:mm", { locale: fr })}` : "Actualisation…"}
          </span>
        }
      />

      <KpiCritiques kpis={kpis.data} enChargement={kpis.isPending && !kpis.isError} enErreur={kpis.isError} peutRegler={peutRegler} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AlertesUrgentes
          alertes={urgentes}
          enChargement={(alertes.isPending && !alertes.isError) || aTraiterEnChargement}
          enErreur={alertes.isError}
        />
        <StatutParcParCategorie sante={sante} enChargement={santeEnChargement} />
      </div>

      <FlotteParType flotte={flotte.data} enChargement={flotte.isPending && !flotte.isError} enErreur={flotte.isError} />

      <VehiculesImmobilises
        immobilisations={flotte.data?.immobilisations}
        enChargement={flotte.isPending && !flotte.isError}
        enErreur={flotte.isError}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CoutsDuMoisBudget actif />
        <MissionsEnCours missions={missions} enChargement={missionsEnChargement} enErreur={missionsEnErreur} />
      </div>

      {peutVoirActivite && <ActiviteRecente entrees={activite} />}
      {dialogues}
    </div>
  );
}
