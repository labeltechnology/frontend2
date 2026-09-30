import { useMemo, useState } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { useTypesEngin } from "@/features/engins/api";
import { usePerformance } from "@/features/performance/api";
import { CoutsParPoste } from "@/features/performance/sections/CoutsParPoste";
import { FicheKpi } from "@/features/performance/sections/FicheKpi";
import { FiltresPerformance } from "@/features/performance/sections/FiltresPerformance";
import { TableauTypes } from "@/features/performance/sections/TableauTypes";
import { TableauVehicules } from "@/features/performance/sections/TableauVehicules";
import { useGenererRapport } from "@/features/rapports/api";
import { RapportApercuDialog } from "@/features/rapports/RapportApercuDialog";
import { bornesPeriode } from "@/features/rapports/periodes";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import { formatDate } from "@/lib/utils";
import type { Rapport } from "@/types/rapport";

/**
 * Performance et utilisation du parc (2026-09-28, questions du DG). Choix
 * validés : nouvelle page + rapport ; compteur horaire saisi pour les engins ;
 * sous-utilisé si le taux de jours OU l'usage par mois est sous le seuil du
 * type ; coûts = carburant, maintenance, location entrante, incidents.
 *
 *  1. Filtres : période (raccourcis ou dates), type ; rapport PDF de la période.
 *  2. KPI du parc : valeur, objectif réglable, fiche (définition, formule, fréquence).
 *  3. Coûts de la période par poste.
 *  4. Par type : utilisation, coût unitaire vs référence, véhicules en trop.
 *  5. Par véhicule : filtres (sous-utilisés, en trop, trop chers), recherche, tri.
 *
 * Calcul serveur : GET /api/performance (performance/PerformanceService).
 */
export function PerformancePage() {
  const { session } = useAuth();
  const moisEnCours = useMemo(() => bornesPeriode("CE_MOIS", new Date()), []);
  const [debut, setDebut] = useState(moisEnCours.debut);
  const [fin, setFin] = useState(moisEnCours.fin);
  const [idTypeEngin, setIdTypeEngin] = useState<number | null>(null);
  const [rapportOuvert, setRapportOuvert] = useState<Rapport | null>(null);

  const types = useTypesEngin();
  const performance = usePerformance(debut, fin, idTypeEngin);
  const genererRapport = useGenererRapport();
  const listeTypes = useMemo(
    () => [...(types.data ?? [])].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
    [types.data],
  );

  const genererPdf = async () => {
    try {
      const rapport = await genererRapport.mutateAsync({ type: "PERFORMANCE_UTILISATION", dateDebutPeriode: debut, dateFinPeriode: fin });
      setRapportOuvert(rapport);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Génération du rapport impossible");
    }
  };

  const donnees = performance.data;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <Gauge className="h-6 w-6 text-primary" aria-hidden="true" />
          Performance et utilisation
        </h1>
        <p className="text-sm text-muted-foreground">
          Taux d'utilisation réel, véhicules sous-utilisés ou en trop, coût par km et par heure comparé à la référence de chaque type.
        </p>
      </div>

      <FiltresPerformance
        debut={debut}
        fin={fin}
        onPeriode={(d, f) => {
          setDebut(d);
          setFin(f);
        }}
        idTypeEngin={idTypeEngin}
        onType={setIdTypeEngin}
        types={listeTypes}
        onRapport={genererPdf}
        rapportEnCours={genererRapport.isPending}
      />

      {performance.isPending && performance.fetchStatus !== "idle" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calcul en cours…
        </p>
      )}
      {performance.isError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {performance.error instanceof ApiError ? performance.error.message : "Calcul impossible pour le moment."}
        </p>
      )}

      {donnees && (
        <>
          <p className="text-xs text-muted-foreground">
            Du {formatDate(donnees.debut)} au {formatDate(donnees.fin)} · {donnees.joursPeriode} jours · {donnees.vehicules.length} véhicule
            {donnees.vehicules.length > 1 ? "s" : ""} analysé{donnees.vehicules.length > 1 ? "s" : ""} (hors réformés et vendus). Les jours à
            venir ne sont pas comptés.
          </p>
          <FicheKpi indicateurs={donnees.indicateurs} peutModifier={peut(session?.role, "GERER_PARC")} />
          <CoutsParPoste couts={donnees.couts} />
          <TableauTypes types={donnees.types} />
          <TableauVehicules vehicules={donnees.vehicules} types={donnees.types} />
        </>
      )}

      <RapportApercuDialog
        rapport={rapportOuvert}
        onOpenChange={(open) => !open && setRapportOuvert(null)}
        onRegenere={setRapportOuvert}
      />
    </div>
  );
}
