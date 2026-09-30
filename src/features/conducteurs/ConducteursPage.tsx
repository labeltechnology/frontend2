import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn, type FiltreRapide } from "@/components/data-table/DataTable";
import { optionsStatut } from "@/components/data-table/options-statut";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { ConducteurFormDialog } from "@/features/conducteurs/ConducteurFormDialog";
import { CompteConnexionDialog } from "@/features/conducteurs/CompteConnexionDialog";
import { useAuth } from "@/features/auth/useAuth";
import { peut } from "@/lib/droits";
import { useConducteurs, useReactiverConducteur, useSuspendreConducteur } from "@/features/conducteurs/api";
import { useMissions } from "@/features/missions/api";
import { useAffectationsConducteurChantierTousChantiers, useChantiers } from "@/features/chantiers/api";
import { PlanningRessources, type RessourcePlanning } from "@/features/planning/PlanningRessources";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import { PhotoConducteurDialog } from "@/features/photo-profil/DialoguesPhoto";
import { formatDate, initiales } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { AffectationConducteurChantier } from "@/types/chantier";
import type { Conducteur } from "@/types/conducteur";
import type { EvenementPlanningRessource } from "@/types/planning";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

/**
 * Depuis le 2026-09-22 (demande explicite de l'utilisateur) : distinction
 * conducteur véhicule (permis de conduire) / conducteur d'engin de chantier
 * (certificat CACES) — voir CategorieConducteur, ConducteurFormDialog. La
 * colonne « Permis / CACES » et la colonne « Expiration » affichent l'une ou
 * l'autre qualification selon la catégorie du conducteur, plutôt que deux
 * colonnes fixes qui seraient à moitié vides. Modification ajoutée dans le
 * même mouvement (endpoint PUT déjà fonctionnel côté backend, mais jusque-là
 * inaccessible depuis cet écran).
 *
 * Depuis le 2026-09-23 (demande explicite de l'utilisateur : « ajoute une
 * calendrier de mission pour le conducteur en fonction des chantiers ») : un
 * onglet « Planning » (même patron que « Liste / Carte » sur ChantiersPage —
 * retour explicite de l'utilisateur après une première version en item de
 * menu peu visible : « où est l'onglet planning »). Affiche TOUS les
 * conducteurs simultanément sur une grille commune (voir PlanningRessources)
 * — demande explicite de l'utilisateur en référence à l'exemple Bryntum
 * Calendar « shifted » : « vue globale tous ensemble », remplaçant une
 * première version avec sélecteur d'un seul conducteur à la fois. Combine
 * les missions (module Mission, sans lien direct avec Chantier) et les
 * rattachements de chantier (AffectationConducteurChantier) de chaque
 * conducteur. Comme il n'existe pas d'endpoint "rattachements par
 * conducteur" côté backend (uniquement "par chantier"), les rattachements
 * de tous les chantiers sont récupérés en parallèle (voir
 * useAffectationsConducteurChantierTousChantiers, même patron que
 * useZonesTousChantiers) puis filtrés côté client.
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
/**
 * Période affichée d'un rattachement de chantier. Depuis le 2026-09-29 (V63)
 * chaque conducteur a sa période prévue (dates, journées entières) ; un
 * rattachement terminé ou annulé s'arrête à sa date de fin réelle. Repli sur
 * l'ancienne règle (création → fin prévue du chantier) pour un serveur plus ancien.
 */
function periodeRattachement(a: AffectationConducteurChantier): { debut: string; fin: string } {
  const debut = a.dateDebutPrevue ? `${a.dateDebutPrevue}T00:00:00` : a.dateDebut;
  const finPrevue = `${a.dateFinPrevue ?? a.chantier.dateFinPrevue}T23:59:59`;
  const fin = a.statut === "ACTIVE" ? finPrevue : (a.dateFin ?? finPrevue);
  return { debut, fin: fin < debut ? debut : fin };
}

/** Filtre rapide par statut (2026-09-30). */
const FILTRE_STATUT_CONDUCTEUR: FiltreRapide<Conducteur> = {
  libelle: "Filtrer par statut",
  valeur: (c) => c.statut,
  options: optionsStatut(["EN_SERVICE", "CONGE", "SUSPENDU", "INACTIF"]),
};

export function ConducteursPage() {
  const { data: conducteurs, isLoading, isError } = useConducteurs();
  const suspendre = useSuspendreConducteur();
  const reactiver = useReactiverConducteur();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [conducteurEdite, setConducteurEdite] = useState<Conducteur | null>(null);
  // Compte de connexion de l'appli mobile (2026-09-28) : réservé à la gestion du parc.
  const { session } = useAuth();
  const peutGererComptes = peut(session?.role, "GERER_PARC");
  const [conducteurCompte, setConducteurCompte] = useState<Conducteur | null>(null);
  // Photo de la fiche (2026-09-29) : même droit que le compte de connexion (gestion du parc).
  const [conducteurPhoto, setConducteurPhoto] = useState<Conducteur | null>(null);

  const { data: missions, isLoading: missionsEnChargement } = useMissions();
  const { data: chantiers } = useChantiers();
  const resultatsAffectationsChantier = useAffectationsConducteurChantierTousChantiers(chantiers);
  const affectationsChantierEnChargement = resultatsAffectationsChantier.some((r) => r.isLoading);

  const ressourcesPlanning = useMemo<RessourcePlanning[]>(
    () => (conducteurs ?? []).map((c) => ({ id: c.idConducteur, titre: `${c.matricule} — ${c.nom} ${c.prenom}` })),
    [conducteurs],
  );

  const evenementsPlanning = useMemo<EvenementPlanningRessource[]>(() => {
    const evenementsChantier: EvenementPlanningRessource[] = resultatsAffectationsChantier
      .flatMap((r) => r.data ?? [])
      .map((a) => ({
        id: `chantier-${a.idAffectationConducteurChantier}`,
        idRessource: a.conducteur.idConducteur,
        type: "CHANTIER",
        libelle: a.chantier.nom,
        ...periodeRattachement(a),
        statut: a.statut,
      }));

    const evenementsMission: EvenementPlanningRessource[] = (missions ?? []).map((m) => ({
      id: `mission-${m.idMission}`,
      idRessource: m.conducteur.idConducteur,
      type: "MISSION",
      libelle: m.motif,
      sousLibelle: libelleVehicule(m.engin),
      debut: m.dateDebutReelle ?? m.dateDebutPrevue,
      fin: m.dateFinReelle ?? m.dateFinPrevue,
      statut: m.statut,
      idMission: m.idMission,
    }));

    return [...evenementsChantier, ...evenementsMission];
  }, [resultatsAffectationsChantier, missions]);

  const ouvrirCreation = () => {
    setConducteurEdite(null);
    setDialogOuvert(true);
  };

  const ouvrirEdition = (conducteur: Conducteur) => {
    setConducteurEdite(conducteur);
    setDialogOuvert(true);
  };

  const onToggleStatut = async (conducteur: Conducteur) => {
    try {
      if (conducteur.statut === "SUSPENDU") {
        await reactiver.mutateAsync(conducteur.idConducteur);
        toast.success("Conducteur réactivé");
      } else {
        await suspendre.mutateAsync(conducteur.idConducteur);
        toast.success("Conducteur suspendu");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<Conducteur>[] = [
    { key: "matricule", header: "Matricule", render: (c) => <span className="font-medium">{c.matricule}</span>, sortValue: (c) => c.matricule },
    {
      key: "nom",
      header: "Nom",
      mobile: "titre",
      sortValue: (c) => `${c.nom} ${c.prenom}`,
      render: (c) => (
        <span className="flex items-center gap-2.5">
          <AvatarPersonne urlPhoto={c.urlPhoto} initiales={initiales(c.nom, c.prenom)} nom={`${c.prenom} ${c.nom}`} />
          {c.nom} {c.prenom}
        </span>
      ),
    },
    { key: "telephone", header: "Téléphone", render: (c) => c.telephone ?? "—" },
    {
      key: "categorie",
      header: "Catégorie",
      render: (c) =>
        c.categorie === "ENGIN_CHANTIER" ? (
          <Badge variant="warning">Conducteur de véhicule</Badge>
        ) : (
          <Badge variant="default">Conducteur véhicule</Badge>
        ),
    },
    {
      // Permis (véhicules) ou certificat CACES (engins de chantier) selon la
      // catégorie du conducteur — voir CategorieConducteur, ajouté le 2026-09-22.
      key: "qualification",
      header: "Permis / CACES",
      render: (c) =>
        c.categorie === "ENGIN_CHANTIER"
          ? c.numeroCaces
            ? `${c.numeroCaces} (${c.categorieCaces ?? "—"})`
            : "—"
          : c.numeroPermis
            ? `${c.numeroPermis} (${c.categoriePermis ?? "—"})`
            : "—",
    },
    {
      key: "expiration",
      header: "Expiration",
      sortValue: (c) => (c.categorie === "ENGIN_CHANTIER" ? c.dateExpirationCaces : c.dateExpirationPermis),
      render: (c) => formatDate(c.categorie === "ENGIN_CHANTIER" ? c.dateExpirationCaces : c.dateExpirationPermis),
    },
    { key: "statut", header: "Statut", render: (c) => <StatutBadge statut={c.statut} />, sortValue: (c) => c.statut },
    {
      key: "compte",
      header: "Appli mobile",
      render: (c) =>
        c.emailCompte ? (
          <span className="text-sm" title="Compte de connexion de l'appli mobile">
            {c.emailCompte}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Non relié</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conducteurs"
        description="Personnel habilité à conduire les véhicules et véhicules du parc."
        actions={
          <Button onClick={ouvrirCreation}>
            <Plus className="h-4 w-4" />
            Nouveau conducteur
          </Button>
        }
      />

      <Tabs defaultValue="liste">
        <TabsList>
          <TabsTrigger value="liste">Liste</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-6">
          <DataTable
            columns={columns}
            data={conducteurs}
            cleMemoire="conducteurs"
            filtreRapide={FILTRE_STATUT_CONDUCTEUR}
            recherche={{ texte: (c) => `${c.matricule} ${c.nom} ${c.prenom} ${c.telephone ?? ""} ${c.emailCompte ?? ""}`, placeholder: "Nom, matricule, téléphone…" }}
            libelles={["conducteur", "conducteurs"]}
            isLoading={isLoading}
            isError={isError}
            getRowKey={(c) => c.idConducteur}
            rowActions={(conducteur) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => ouvrirEdition(conducteur)}>Modifier</DropdownMenuItem>
                  {peutGererComptes && (
                    <DropdownMenuItem onSelect={() => setConducteurCompte(conducteur)}>
                      Compte de connexion…
                    </DropdownMenuItem>
                  )}
                  {peutGererComptes && (
                    <DropdownMenuItem onSelect={() => setConducteurPhoto(conducteur)}>Photo…</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={conducteur.statut === "INACTIF" || conducteur.statut === "CONGE"}
                    onSelect={() => onToggleStatut(conducteur)}
                  >
                    {conducteur.statut === "SUSPENDU" ? "Réactiver" : "Suspendre"}
                  </DropdownMenuItem>
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
            libelleRessource="conducteur"
          />
        </TabsContent>
      </Tabs>

      <ConducteurFormDialog conducteur={conducteurEdite} open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <CompteConnexionDialog
        conducteur={conducteurCompte}
        onOpenChange={(ouvert) => {
          if (!ouvert) setConducteurCompte(null);
        }}
      />
      <PhotoConducteurDialog conducteur={conducteurPhoto} onOpenChange={(ouvert) => !ouvert && setConducteurPhoto(null)} />
    </div>
  );
}
