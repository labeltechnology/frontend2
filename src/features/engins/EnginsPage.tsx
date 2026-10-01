import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, Plus, Satellite, SatelliteDish, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn, type FiltreRapide } from "@/components/data-table/DataTable";
import { optionsStatut } from "@/components/data-table/options-statut";
import { PageHeader } from "@/components/data-table/PageHeader";
import { EnginPhotosDialog } from "@/features/engins/EnginPhotosDialog";
import { KilometrageDialog } from "@/features/engins/KilometrageDialog";
import { ZonesOperationDialog } from "@/features/engins/ZonesOperationDialog";
import { compteurVehicule } from "@/features/engins/compteur-vehicule";
import { appliquerFiltreUrl, filtreUrlActif, libelleFiltreUrl, lireFiltreUrl } from "@/features/engins/filtre-url";
import { filtrerVehicules } from "@/features/engins/recherche-vehicules";
import { StatutLocationVehicule } from "@/features/engins/StatutLocationVehicule";
import { ZoneRechercheVehicules } from "@/features/engins/ZoneRechercheVehicules";
import { useChangerStatutEngin, useEngins, useEquiperGps } from "@/features/engins/api";
import { useLocationsActives } from "@/features/engins/locations-actives-api";
import { useMissions } from "@/features/missions/api";
import { useAffectationsChantierTousChantiers, useChantiers } from "@/features/chantiers/api";
import { PlanningRessources, type RessourcePlanning } from "@/features/planning/PlanningRessources";
import { evenementsRattachementsChantier } from "@/features/planning/evenements-chantier";
import { evenementsMaintenances } from "@/features/planning/evenements-maintenance";
import { useMaintenances } from "@/features/maintenance/api";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { Engin, StatutEngin } from "@/types/engin";
import type { EvenementPlanningRessource } from "@/types/planning";
import { toast } from "sonner";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";

const STATUTS: StatutEngin[] = [
  "DISPONIBLE",
  "AFFECTE",
  "EN_MISSION",
  "EN_PANNE",
  "EN_MAINTENANCE",
  "REFORME",
  "VENDU",
];

/**
 * Depuis le 2026-09-23 (demande explicite de l'utilisateur : « et meme
 * chose pour les engins aussi », suite à la demande de calendrier pour un
 * conducteur) : un onglet « Planning » (même patron que « Liste / Carte »
 * sur ChantiersPage — retour explicite de l'utilisateur après une première
 * version en item de menu peu visible : « où est l'onglet planning »).
 * Affiche TOUS les engins simultanément sur une grille commune (voir
 * PlanningRessources) — demande explicite de l'utilisateur en référence à
 * l'exemple Bryntum Calendar « shifted » : « vue globale tous ensemble »,
 * remplaçant une première version avec sélecteur d'un seul engin à la
 * fois — même principe que ConducteursPage. Combine les missions de chaque
 * engin (module Mission) et ses rattachements de chantier
 * (AffectationChantier), ces derniers récupérés pour tous les chantiers en
 * parallèle (useAffectationsChantierTousChantiers, même patron que
 * useZonesTousChantiers) puis filtrés côté client — aucun endpoint
 * "rattachements par véhicule" n'existe côté backend.
 *
 * Depuis le 2026-09-24 (référence à l'exemple Syncfusion Scheduler, demande
 * explicite de l'utilisateur : « je veux la meme chose que l'exemple ») : le
 * planning est interactif pour les missions planifiées (créer, déplacer,
 * redimensionner, réaffecter — voir PlanningRessources, qui réutilise le
 * dialogue de l'écran Missions — MissionFormDialog, étendu d'un mode
 * édition). `missions` (la liste complète, pas seulement les événements déjà
 * résolus) est passée à PlanningRessources pour reconstruire les dates
 * exactes lors d'un glisser-déposer.
 */
/** Filtre rapide par statut (2026-09-30). */
const FILTRE_STATUT_ENGIN: FiltreRapide<Engin> = {
  libelle: "Filtrer par statut",
  valeur: (e) => e.statut,
  options: optionsStatut(["DISPONIBLE", "EN_MISSION", "AFFECTE", "EN_MAINTENANCE", "EN_PANNE", "REFORME", "VENDU"]),
};

export function EnginsPage() {
  const { data: engins, isLoading, isError } = useEngins();
  const changerStatut = useChangerStatutEngin();
  const equiperGps = useEquiperGps();
  // Statut de location des engins : loués À un client (Locations externes) ou CHEZ un
  // prestataire (Locations entrantes).
  // Depuis le 2026-09-30 (pages par métier), les contrats complets sont réservés aux
  // finances : la liste lit seulement « loué à / loué chez » (GET /api/engins/locations-actives).
  const { data: locationsActives } = useLocationsActives();
  const locationsExternesParEngin = useMemo(() => {
    const map = new Map<number, string>();
    locationsActives?.forEach((l) => l.loueA && map.set(l.idEngin, l.loueA));
    return map;
  }, [locationsActives]);
  const locationsEntrantesParEngin = useMemo(() => {
    const map = new Map<number, string>();
    locationsActives?.forEach((l) => l.loueChez && map.set(l.idEngin, l.loueChez));
    return map;
  }, [locationsActives]);
  // Création et correction passent par la page « Fiche véhicule » (FicheEnginPage,
  // 2026-09-24) — plus par un dialogue : trop de champs pour une fenêtre.
  const navigate = useNavigate();
  const [enginKm, setEnginKm] = useState<Engin | null>(null);
  // Recherche (2026-09-25) : filtre à la fois la liste et le planning.
  const [recherche, setRecherche] = useState("");
  // Filtre venu de l'adresse (2026-09-30) : /engins?type=3 ou ?categorie=ENGIN_CHANTIER (liens du tableau de bord).
  const [parametresUrl, setParametresUrl] = useSearchParams();
  const filtreUrl = useMemo(() => lireFiltreUrl(parametresUrl), [parametresUrl]);
  const enginsFiltres = useMemo(
    () => (engins ? filtrerVehicules(appliquerFiltreUrl(engins, filtreUrl), recherche) : engins),
    [engins, filtreUrl, recherche],
  );
  const [enginPhotos, setEnginPhotos] = useState<Engin | null>(null);
  const [enginZones, setEnginZones] = useState<Engin | null>(null);
  // Reprend la version la plus fraîche de l'engin dans la liste : la mutation
  // d'assignation/retrait de zone invalide la liste, mais l'objet capturé à
  // l'ouverture du dialogue ne se met pas à jour tout seul.
  const enginZonesActuel = enginZones ? engins?.find((e) => e.idEngin === enginZones.idEngin) ?? enginZones : null;

  const { data: missions, isLoading: missionsEnChargement } = useMissions();
  // Maintenances en rouge sur le planning (2026-09-25).
  const { data: maintenances } = useMaintenances();
  const { data: chantiers } = useChantiers();
  const resultatsAffectationsChantier = useAffectationsChantierTousChantiers(chantiers);
  const affectationsChantierEnChargement = resultatsAffectationsChantier.some((r) => r.isLoading);

  const ressourcesPlanning = useMemo<RessourcePlanning[]>(
    () => (enginsFiltres ?? []).map((e) => ({ id: e.idEngin, titre: libelleVehicule(e) })),
    [enginsFiltres],
  );

  const evenementsPlanning = useMemo<EvenementPlanningRessource[]>(() => {
    // Période prévue de CHAQUE véhicule sur son chantier (2026-09-24) — voir evenements-chantier.ts.
    const evenementsChantier = evenementsRattachementsChantier(resultatsAffectationsChantier.flatMap((r) => r.data ?? []));

    const evenementsMission: EvenementPlanningRessource[] = (missions ?? []).map((m) => ({
      id: `mission-${m.idMission}`,
      idRessource: m.engin.idEngin,
      type: "MISSION",
      libelle: m.motif,
      sousLibelle: m.conducteur.matricule,
      debut: m.dateDebutReelle ?? m.dateDebutPrevue,
      fin: m.dateFinReelle ?? m.dateFinPrevue,
      statut: m.statut,
      idMission: m.idMission,
    }));

    const evenementsMaintenance = evenementsMaintenances(maintenances ?? [], new Date());

    return [...evenementsChantier, ...evenementsMission, ...evenementsMaintenance];
  }, [resultatsAffectationsChantier, missions, maintenances]);

  const ouvrirCreation = () => navigate("/engins/nouveau");

  const ouvrirEdition = (engin: Engin) => navigate(`/engins/${engin.idEngin}/fiche`);
  const ouvrirRapport = (engin: Engin) => navigate(`/engins/${engin.idEngin}/rapport`);

  const onChangerStatut = async (engin: Engin, statut: StatutEngin) => {
    try {
      await changerStatut.mutateAsync({ id: engin.idEngin, statut });
      toast.success("Statut mis à jour");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Changement de statut impossible");
    }
  };

  const onToggleGps = async (engin: Engin) => {
    try {
      await equiperGps.mutateAsync({ id: engin.idEngin, equipe: !engin.equipeGps });
      toast.success(engin.equipeGps ? "GPS retiré" : "GPS installé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<Engin>[] = [
    // GPS en première colonne (2026-09-25, demande de l'utilisateur).
    {
      key: "gps",
      header: "GPS",
      mobile: "masque",
      sortValue: (e) => e.equipeGps,
      render: (e) =>
        e.equipeGps ? (
          <SatelliteDish className="h-4 w-4 text-success" aria-label="Équipé d'un GPS" />
        ) : (
          <Satellite className="h-4 w-4 text-muted-foreground" aria-label="Sans GPS" />
        ),
    },
    {
      // Immatriculation (véhicules/camions) ou numéro de série (engins de chantier sans
      // plaque routière) selon la catégorie du type — voir CategorieEngin, ajouté le 2026-09-22.
      key: "identifiant",
      header: "Immatriculation / N° de série",
      render: (e) => <span className="font-medium">{identifiantVehicule(e)}</span>,
      sortValue: (e) => identifiantVehicule(e),
      mobile: "titre",
    },
    { key: "marqueModele", header: "Marque / modèle", render: (e) => `${e.marque} ${e.modele}`, sortValue: (e) => `${e.marque} ${e.modele}` },
    { key: "type", header: "Type", render: (e) => e.typeEngin?.libelle ?? "—", sortValue: (e) => e.typeEngin?.libelle },
    // Compteur (2026-09-25) : heures pour un engin de chantier, km pour un véhicule routier.
    { key: "compteur", header: "Compteur", render: (e) => compteurVehicule(e), sortValue: (e) => (e.typeEngin?.categorie === "ENGIN_CHANTIER" ? e.compteurHeures : e.kilometrage) },
    // Statut et location fusionnés (2026-09-25).
    {
      key: "statut",
      header: "Statut / location",
      sortValue: (e) => e.statut,
      render: (e) => (
        <StatutLocationVehicule
          statut={e.statut}
          loueA={locationsExternesParEngin.get(e.idEngin)}
          loueChez={locationsEntrantesParEngin.get(e.idEngin)}
        />
      ),
    },
    { key: "dateAcquisition", header: "Acquis le", render: (e) => formatDate(e.dateAcquisition), sortValue: (e) => e.dateAcquisition },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Véhicules"
        description="Parc de véhicules et d'engins de chantier."
        actions={
          <>
            {/* Recherche à côté du bouton (2026-09-25) : filtre la liste et le planning. */}
            <ZoneRechercheVehicules
              valeur={recherche}
              onChange={setRecherche}
              nombreTrouves={enginsFiltres?.length ?? 0}
              nombreTotal={engins?.length ?? 0}
            />
            <Button onClick={ouvrirCreation}>
              <Plus className="h-4 w-4" />
              Nouveau véhicule
            </Button>
          </>
        }
      />

      {filtreUrlActif(filtreUrl) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 font-medium">{libelleFiltreUrl(filtreUrl, engins ?? [])}</span>
          <Button variant="ghost" size="sm" onClick={() => setParametresUrl({})}>
            <X className="h-4 w-4" />
            Retirer le filtre
          </Button>
        </div>
      )}

      <Tabs defaultValue="liste">
        <TabsList>
          <TabsTrigger value="liste">Liste</TabsTrigger>
          <TabsTrigger value="planning">Calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-6">
          <DataTable
            columns={columns}
            data={enginsFiltres}
            emptyMessage={recherche.trim() ? `Aucun véhicule ne correspond à « ${recherche.trim()} ».` : undefined}
            cleMemoire="engins"
            filtreRapide={FILTRE_STATUT_ENGIN}
            libelles={["véhicule", "véhicules"]}
            isLoading={isLoading}
            isError={isError}
            getRowKey={(e) => e.idEngin}
            rowActions={(engin) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => ouvrirRapport(engin)}>Voir le rapport</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => ouvrirEdition(engin)}>Voir / modifier la fiche</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Statut</DropdownMenuLabel>
                  {STATUTS.map((statut) => (
                    <DropdownMenuItem
                      key={statut}
                      disabled={statut === engin.statut}
                      onSelect={() => onChangerStatut(engin, statut)}
                    >
                      {statut}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setEnginKm(engin)}>Mettre à jour le kilométrage</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onToggleGps(engin)}>
                    {engin.equipeGps ? "Retirer le GPS" : "Installer le GPS"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setEnginPhotos(engin)}>Photos</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setEnginZones(engin)}>Zones d'opération</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <PlanningRessources
            ressources={ressourcesPlanning}
            evenements={evenementsPlanning}
            missions={missions}
            isLoading={isLoading || missionsEnChargement || affectationsChantierEnChargement}
            libelleRessource="engin"
          />
        </TabsContent>
      </Tabs>

      <KilometrageDialog engin={enginKm} onOpenChange={(open) => !open && setEnginKm(null)} />
      <EnginPhotosDialog engin={enginPhotos} onOpenChange={(open) => !open && setEnginPhotos(null)} />
      <ZonesOperationDialog engin={enginZonesActuel} onOpenChange={(open) => !open && setEnginZones(null)} />
    </div>
  );
}
