import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CalendarClock, CalendarDays, Car, Package, Plus, TriangleAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlertes } from "@/features/alertes/api";
import { useAuth } from "@/features/auth/useAuth";
import { aTraiterAtelier, indicateursAtelier, piecesAReapprovisionner, planningAtelier } from "@/features/dashboard/metier/atelier";
import { lignesPieces, lignesPlanning } from "@/features/dashboard/metier/lignes";
import { ListeLiens } from "@/features/dashboard/metier/sections/ListeLiens";
import { CarteIndicateur } from "@/features/dashboard/sections/CarteIndicateur";
import { EnTeteTableauBord } from "@/features/dashboard/sections/EnTeteTableauBord";
import { PanneauATraiter } from "@/features/dashboard/sections/PanneauATraiter";
import { useEngins } from "@/features/engins/api";
import { useMaintenances, usePieces } from "@/features/maintenance/api";
import { MaintenanceFormDialog } from "@/features/maintenance/MaintenanceFormDialog";
import { libelleRole, peut } from "@/lib/droits";

/**
 * Tableau de bord de l'atelier (pages par métier, 2026-09-30) — chef et
 * assistant maintenance : « ce qui se passe sur les maintenances ».
 *
 *  1. Six indicateurs : en cours, prévues sous 7 jours, en retard,
 *     véhicules immobilisés, pièces sous le seuil, alertes de l'atelier.
 *  2. « À traiter » (retards, pannes sans intervention, ruptures, alertes)
 *     + planning de l'atelier (en retard, en cours, 7 prochains jours).
 *  3. Pièces à réapprovisionner.
 *
 * Calculs dans atelier.ts (purs, testés). Les alertes reçues sont déjà
 * limitées à l'atelier par le serveur.
 */
export function TableauBordAtelier() {
  const { session } = useAuth();
  const maintenances = useMaintenances();
  const engins = useEngins();
  const pieces = usePieces();
  const alertes = useAlertes(true);
  const [nouvelleOuverte, setNouvelleOuverte] = useState(false);

  const maintenant = useMemo(() => new Date(), []);
  const charge = (q: { isPending: boolean; isError: boolean }) => q.isPending && !q.isError;

  const sources = useMemo(
    () => ({
      maintenances: maintenances.data ?? [],
      engins: engins.data ?? [],
      pieces: pieces.data ?? [],
      alertes: alertes.data ?? [],
      maintenant,
    }),
    [maintenances.data, engins.data, pieces.data, alertes.data, maintenant],
  );
  const indicateurs = useMemo(() => indicateursAtelier(sources), [sources]);
  const aTraiter = useMemo(() => aTraiterAtelier(sources), [sources]);
  const planning = useMemo(() => lignesPlanning(planningAtelier(sources.maintenances, maintenant)), [sources, maintenant]);
  const aReapprovisionner = useMemo(() => lignesPieces(piecesAReapprovisionner(sources.pieces)), [sources]);
  const sourcesIndisponibles = [
    maintenances.isError && "maintenances",
    engins.isError && "véhicules",
    pieces.isError && "pièces",
    alertes.isError && "alertes",
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <EnTeteTableauBord
        date={format(maintenant, "EEEE d MMMM yyyy", { locale: fr })}
        salutation={`Bonjour${session ? ` — ${libelleRole(session.role)}` : ""}`}
        sousTitre={<p className="text-sm text-muted-foreground">L'atelier aujourd'hui : interventions, planning et stock.</p>}
        actions={
          peut(session?.role, "GERER_MAINTENANCE") && (
            <Button size="sm" onClick={() => setNouvelleOuverte(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle maintenance
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <CarteIndicateur
          titre="En cours"
          valeur={indicateurs.enCours}
          precision="intervention(s) à l'atelier"
          icone={Wrench}
          ton="alerte"
          lien="/maintenance"
          enChargement={charge(maintenances)}
        />
        <CarteIndicateur
          titre="Prévues sous 7 jours"
          valeur={indicateurs.aVenir}
          precision={indicateurs.sansDate > 0 ? `+ ${indicateurs.sansDate} sans date` : "toutes datées"}
          icone={CalendarDays}
          ton="info"
          lien="/maintenance"
          enChargement={charge(maintenances)}
        />
        <CarteIndicateur
          titre="En retard"
          valeur={indicateurs.enRetard}
          precision={indicateurs.enRetard > 0 ? "date prévue dépassée" : "aucun retard"}
          icone={CalendarClock}
          ton={indicateurs.enRetard > 0 ? "danger" : "succes"}
          lien="/maintenance"
          enChargement={charge(maintenances)}
        />
        <CarteIndicateur
          titre="Véhicules immobilisés"
          valeur={indicateurs.immobilises}
          precision={indicateurs.enPanne > 0 ? `dont ${indicateurs.enPanne} en panne` : "aucun en panne"}
          icone={Car}
          ton={indicateurs.enPanne > 0 ? "danger" : "neutre"}
          lien="/engins"
          enChargement={charge(engins)}
        />
        <CarteIndicateur
          titre="Pièces sous le seuil"
          valeur={indicateurs.piecesStockBas}
          precision={indicateurs.piecesEnRupture > 0 ? `dont ${indicateurs.piecesEnRupture} en rupture` : "aucune rupture"}
          icone={Package}
          ton={indicateurs.piecesEnRupture > 0 ? "danger" : indicateurs.piecesStockBas > 0 ? "alerte" : "succes"}
          lien="/maintenance?onglet=pieces"
          enChargement={charge(pieces)}
        />
        <CarteIndicateur
          titre="Alertes de l'atelier"
          valeur={indicateurs.alertes}
          precision={indicateurs.alertesCritiques > 0 ? `${indicateurs.alertesCritiques} critique(s)` : "aucune critique"}
          icone={TriangleAlert}
          ton={indicateurs.alertesCritiques > 0 ? "danger" : "neutre"}
          lien="/alertes"
          enChargement={charge(alertes)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PanneauATraiter
          elements={aTraiter}
          enChargement={charge(maintenances) || charge(engins) || charge(pieces) || charge(alertes)}
          sourcesIndisponibles={sourcesIndisponibles}
        />
        <ListeLiens
          titre="Planning de l'atelier"
          icone={CalendarDays}
          lien="/maintenance"
          lignes={planning}
          enChargement={charge(maintenances)}
          enErreur={maintenances.isError}
          vide="Aucune intervention en cours ni prévue cette semaine."
          nombreVisible={8}
        />
      </div>

      <ListeLiens
        titre="Pièces à réapprovisionner"
        icone={AlertTriangle}
        lien="/maintenance?onglet=pieces"
        lignes={aReapprovisionner}
        enChargement={charge(pieces)}
        enErreur={pieces.isError}
        vide="Stock suffisant : aucune pièce sous son seuil."
      />

      <MaintenanceFormDialog open={nouvelleOuverte} onOpenChange={setNouvelleOuverte} />
    </div>
  );
}
