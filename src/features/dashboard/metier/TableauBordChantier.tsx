import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, ClipboardList, HardHat, MapPin, Navigation, PackageSearch, Timer, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlertes } from "@/features/alertes/api";
import { useAuth } from "@/features/auth/useAuth";
import { useSyntheseChantiers } from "@/features/chantiers/suivi-api";
import { useDemandes } from "@/features/chantiers/demandes/demandes-api";
import { aTraiterChantier, chantiersSuivis, FIN_PROCHE_JOURS, indicateursChantier } from "@/features/dashboard/metier/chantier";
import { lignesChantiers, lignesDemandesEnAttente, lignesPresence } from "@/features/dashboard/metier/lignes";
import { ListeLiens } from "@/features/dashboard/metier/sections/ListeLiens";
import { CarteIndicateur } from "@/features/dashboard/sections/CarteIndicateur";
import { EnTeteTableauBord } from "@/features/dashboard/sections/EnTeteTableauBord";
import { PanneauATraiter } from "@/features/dashboard/sections/PanneauATraiter";
import { useChantiersCarte } from "@/features/gps/chantiers/api";
import { libelleRole } from "@/lib/droits";
import { pluriel } from "@/lib/pluriel";

/**
 * Tableau de bord du chef de chantier (pages par métier, 2026-09-30). Le
 * serveur ne renvoie que SES chantiers (ceux dont il est responsable), leurs
 * véhicules, leurs demandes et leurs alertes.
 *
 *  1. Six indicateurs : chantiers en cours, en retard, fin proche,
 *     véhicules sur place, demandes en attente, alertes.
 *  2. « À traiter » (véhicules hors chantier, retards, fins proches,
 *     demandes refusées, alertes) + mes chantiers.
 *  3. Présence des véhicules attendus aujourd'hui + demandes en attente.
 *
 * Calculs dans chantier.ts (purs, testés). La carte est relue chaque minute.
 */
export function TableauBordChantier() {
  const { session } = useAuth();
  const synthese = useSyntheseChantiers();
  const carte = useChantiersCarte();
  const demandes = useDemandes();
  const alertes = useAlertes(true);

  const maintenant = useMemo(() => new Date(), []);
  const charge = (q: { isPending: boolean; isError: boolean }) => q.isPending && !q.isError;

  const sources = useMemo(
    () => ({
      synthese: synthese.data ?? [],
      carte: carte.data ?? [],
      demandes: demandes.data ?? [],
      alertes: alertes.data ?? [],
    }),
    [synthese.data, carte.data, demandes.data, alertes.data],
  );
  const indicateurs = useMemo(() => indicateursChantier(sources), [sources]);
  const aTraiter = useMemo(() => aTraiterChantier({ ...sources, maintenant }), [sources, maintenant]);
  const mesChantiers = useMemo(() => lignesChantiers(chantiersSuivis(sources.synthese)), [sources]);
  const presence = useMemo(() => lignesPresence(sources.carte), [sources]);
  const enAttente = useMemo(() => lignesDemandesEnAttente(sources.demandes), [sources]);
  const { attendus, surPlace, horsChantier, sansPosition } = indicateurs.presence;
  const sourcesIndisponibles = [
    synthese.isError && "chantiers",
    carte.isError && "positions des véhicules",
    demandes.isError && "demandes de matériel",
    alertes.isError && "alertes",
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <EnTeteTableauBord
        date={format(maintenant, "EEEE d MMMM yyyy", { locale: fr })}
        salutation={`Bonjour${session ? ` — ${libelleRole(session.role)}` : ""}`}
        sousTitre={<p className="text-sm text-muted-foreground">Vos chantiers aujourd'hui : avancement, véhicules sur place, demandes.</p>}
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/gps">
                <Navigation className="h-4 w-4" />
                Carte GPS
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/chantiers">
                <HardHat className="h-4 w-4" />
                Mes chantiers
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <CarteIndicateur
          titre="Chantiers en cours"
          valeur={indicateurs.enCours}
          precision={indicateurs.aVenir > 0 ? `+ ${indicateurs.aVenir} à venir` : "aucun à venir"}
          icone={HardHat}
          ton="info"
          lien="/chantiers"
          enChargement={charge(synthese)}
        />
        <CarteIndicateur
          titre="En retard"
          valeur={indicateurs.enRetard}
          precision={indicateurs.enRetard > 0 ? "avancement en retard" : "tout est dans les temps"}
          icone={Timer}
          ton={indicateurs.enRetard > 0 ? "danger" : "succes"}
          lien="/chantiers"
          enChargement={charge(synthese)}
        />
        <CarteIndicateur
          titre="Fin proche"
          valeur={indicateurs.finProche}
          precision={`fin prévue sous ${FIN_PROCHE_JOURS} jours`}
          icone={CalendarClock}
          ton={indicateurs.finProche > 0 ? "alerte" : "neutre"}
          lien="/chantiers"
          enChargement={charge(synthese)}
        />
        <CarteIndicateur
          titre="Véhicules sur place"
          valeur={attendus > 0 ? `${surPlace} / ${attendus}` : "—"}
          precision={
            attendus === 0
              ? "aucun véhicule attendu aujourd'hui"
              : horsChantier > 0
                ? `${horsChantier} hors chantier${sansPosition > 0 ? `, ${sansPosition} sans position` : ""}`
                : sansPosition > 0
                  ? `${sansPosition} sans position`
                  : "tous sur place"
          }
          icone={MapPin}
          ton={horsChantier > 0 ? "danger" : attendus > 0 && surPlace === attendus ? "succes" : "neutre"}
          lien="/gps"
          enChargement={charge(carte)}
        />
        <CarteIndicateur
          titre="Demandes en attente"
          valeur={indicateurs.demandesEnAttente}
          precision="matériel demandé au parc"
          icone={PackageSearch}
          ton={indicateurs.demandesEnAttente > 0 ? "alerte" : "neutre"}
          lien="/chantiers"
          enChargement={charge(demandes)}
        />
        <CarteIndicateur
          titre="Alertes"
          valeur={indicateurs.alertes}
          precision={indicateurs.alertesCritiques > 0 ? pluriel(indicateurs.alertesCritiques, "critique") : "aucune alerte critique"}
          icone={TriangleAlert}
          ton={indicateurs.alertesCritiques > 0 ? "danger" : "neutre"}
          lien="/alertes"
          enChargement={charge(alertes)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PanneauATraiter
          elements={aTraiter}
          enChargement={charge(synthese) || charge(carte) || charge(demandes) || charge(alertes)}
          sourcesIndisponibles={sourcesIndisponibles}
        />
        <ListeLiens
          titre="Mes chantiers"
          icone={HardHat}
          lien="/chantiers"
          lignes={mesChantiers}
          enChargement={charge(synthese)}
          enErreur={synthese.isError}
          vide="Aucun chantier en cours ou à venir sous votre responsabilité."
          nombreVisible={7}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListeLiens
          titre="Véhicules attendus aujourd'hui"
          icone={MapPin}
          lien="/gps"
          libelleLien="Carte"
          lignes={presence}
          enChargement={charge(carte)}
          enErreur={carte.isError}
          vide="Aucun véhicule attendu aujourd'hui sur vos chantiers en cours."
          nombreVisible={8}
        />
        <ListeLiens
          titre="Demandes de matériel en attente"
          icone={ClipboardList}
          lignes={enAttente}
          enChargement={charge(demandes)}
          enErreur={demandes.isError}
          vide="Aucune demande en attente de réponse."
        />
      </div>
    </div>
  );
}
