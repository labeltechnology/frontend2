import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Car, Fuel, Loader2, Pencil, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTitreFilAriane } from "@/components/layout/fil-ariane/ContexteFilAriane";
import { useAffectations } from "@/features/affectations/api";
import { useAlertes } from "@/features/alertes/api";
import { useCarburant, useConsommationMoyenne } from "@/features/carburant/api";
import { CarburantFormDialog } from "@/features/carburant/CarburantFormDialog";
import { peutSaisirCarburant } from "@/features/carburant/droits";
import { useAffectationsChantierTousChantiers, useChantiers } from "@/features/chantiers/api";
import { useDocuments } from "@/features/documents/api";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { useEngins } from "@/features/engins/api";
import { useEnginPhotos } from "@/features/engins/photos-api";
import { useEcheancesEntretien } from "@/features/entretien/api";
import { useEquipementsBord } from "@/features/equipements-bord/api";
import { useIncidents } from "@/features/incidents/api";
import { peutDeclarerIncident } from "@/features/incidents/droits";
import { IncidentFormDialog } from "@/features/incidents/IncidentFormDialog";
import { useAuth } from "@/features/auth/useAuth";
import { BoutonDiscussion } from "@/features/messagerie/BoutonDiscussion";
import { PlanifierEmplacementDialog } from "@/features/emplacement-engin/PlanifierEmplacementDialog";
import { peutPlanifierEmplacement } from "@/features/emplacement-engin/occupations";
import { useMaintenances } from "@/features/maintenance/api";
import { useMissions } from "@/features/missions/api";
import { FaireMaintenanceDialog } from "@/features/maintenance/FaireMaintenanceDialog";
import { peutFaireMaintenance } from "@/features/maintenance/faire-maintenance";
import { construireRapport } from "@/features/rapport-engin/assembler-rapport";
import { CarteLocalisationGps } from "@/features/rapport-engin/CarteLocalisationGps";
import { niveauLePlusGrave, syntheseRapport, type NiveauRapport } from "@/features/rapport-engin/niveaux";
import { CLASSES_NIVEAU, ICONES_NIVEAU, LIBELLES_NIVEAU } from "@/features/rapport-engin/presentation";
import { SchemaVehicule } from "@/features/rapport-engin/SchemaVehicule";
import { cheminHistorique } from "@/features/historique-engin/onglets";
import { cn, formatNombre, libelleEnum } from "@/lib/utils";
import type { Engin } from "@/types/engin";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";

const ORDRE_SYNTHESE: NiveauRapport[] = ["alerte", "avertissement", "ok", "inconnu"];

const MESSAGE_GLOBAL: Record<NiveauRapport, string> = {
  alerte: "Des points demandent une action immédiate.",
  avertissement: "Des points sont à surveiller prochainement.",
  ok: "Tous les points contrôlés sont en ordre.",
  inconnu: "Des informations restent à renseigner sur la fiche.",
};

/**
 * Rapport du véhicule (2026-09-24, action « Voir le rapport » de la liste
 * des engins) : état du véhicule en un coup d'œil, disposé comme une
 * infographie autour de sa photo — vert OK, jaune avertissement, rouge
 * alerte, gris non renseigné. Lecture seule ; la correction se fait sur la
 * fiche. Aucune donnée propre : tout vient des écrans existants (règles dans
 * construire-rapport.ts, bloc-emplacement.ts, bloc-conducteur.ts ; ordre des
 * blocs dans assembler-rapport.ts). Une source refusée par le backend
 * (profil sans droit) donne un bloc gris « indisponible » au lieu de
 * bloquer la page.
 *
 * Emplacement du jour (2026-09-24) : aucun endpoint « rattachements par véhicule »
 * n'existe côté backend ; on réutilise useAffectationsChantierTousChantiers
 * (une requête par chantier, en cache, même patron que EnginsPage) puis on
 * filtre sur le véhicule.
 */
export function RapportEnginPage() {
  const navigate = useNavigate();
  const { idEngin } = useParams<{ idEngin: string }>();
  const { data: engins, isLoading: enginsEnChargement, isError: enginsEnErreur } = useEngins();
  const engin = useMemo(() => engins?.find((e) => String(e.idEngin) === idEngin), [engins, idEngin]);
  // Fil d'Ariane (2026-09-30) : « Parc › Véhicules › 1234 TBA — Toyota Hilux › Rapport ».
  useTitreFilAriane(engin?.libelleVehicule);

  // Tous les hooks avant les retours anticipés (règle des hooks).
  const photos = useEnginPhotos(engin?.idEngin);
  const documents = useDocuments();
  const alertes = useAlertes(true);
  const maintenances = useMaintenances();
  const echeances = useEcheancesEntretien(engin?.idEngin);
  const equipements = useEquipementsBord(engin?.idEngin);
  const affectations = useAffectations();
  const chantiers = useChantiers();
  const rattachements = useAffectationsChantierTousChantiers(chantiers.data);
  const missions = useMissions();
  // Cartes « Carburant » et « Incidents » (2026-09-25).
  const pleins = useCarburant();
  const consommation = useConsommationMoyenne(engin?.idEngin ?? null);
  const incidents = useIncidents();
  const aujourdhui = useMemo(() => new Date(), []);
  const { session } = useAuth();
  // Bouton « Faire la maintenance » (2026-09-25) : carte « Alertes et maintenance », rôles autorisés côté backend.
  const [maintenanceOuverte, setMaintenanceOuverte] = useState(false);
  // Bouton « Mission ou chantier » (2026-09-25) : carte « Localisation » (ex « Emplacement du jour »).
  const [emplacementOuvert, setEmplacementOuvert] = useState(false);
  // Boutons « Ajouter un plein » et « Déclarer un incident » (2026-09-25).
  const [pleinOuvert, setPleinOuvert] = useState(false);
  const [incidentOuvert, setIncidentOuvert] = useState(false);

  const sources = [documents, alertes, maintenances, echeances, equipements, affectations, missions, pleins, consommation, incidents, chantiers, ...rattachements];
  const enCours = sources.some((q) => q.isPending && !q.isError);
  // Chantiers : indisponible si la liste ou un seul des chantiers n'a pas pu être chargé (carte incomplète sinon).
  const rattachementsEnErreur = chantiers.isError || rattachements.some((q) => q.isError);
  const rattachementsChantier = rattachementsEnErreur ? null : rattachements.flatMap((q) => q.data ?? []);

  const blocs = useMemo(() => {
    if (!engin || enCours) return [];
    return construireRapport({
      engin,
      documents: documents.isError ? null : (documents.data ?? []),
      alertes: alertes.isError ? null : (alertes.data ?? []),
      maintenances: maintenances.isError ? null : (maintenances.data ?? []),
      echeances: echeances.isError ? null : (echeances.data ?? []),
      equipements: equipements.isError ? null : (equipements.data ?? []),
      affectations: affectations.isError ? null : (affectations.data ?? []),
      rattachementsChantier,
      missions: missions.isError ? null : (missions.data ?? []),
      pleins: pleins.isError ? null : (pleins.data ?? []),
      consommation: consommation.isError ? null : (consommation.data ?? null),
      incidents: incidents.isError ? null : (incidents.data ?? []),
      aujourdhui,
    });
  }, [
    engin,
    enCours,
    documents.isError,
    documents.data,
    alertes.isError,
    alertes.data,
    maintenances.isError,
    maintenances.data,
    echeances.isError,
    echeances.data,
    equipements.isError,
    equipements.data,
    affectations.isError,
    affectations.data,
    rattachementsChantier,
    missions.isError,
    missions.data,
    pleins.isError,
    pleins.data,
    consommation.isError,
    consommation.data,
    incidents.isError,
    incidents.data,
    aujourdhui,
  ]);

  const retourListe = () => navigate("/engins");

  if (enginsEnChargement) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }
  if (enginsEnErreur || !engin) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {enginsEnErreur ? "Impossible de charger les véhicules." : "Véhicule introuvable."}
        </p>
        <Button variant="outline" onClick={retourListe}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux engins
        </Button>
      </div>
    );
  }

  const synthese = syntheseRapport(blocs);
  const niveauGlobal = niveauLePlusGrave(blocs.map((b) => b.niveau));
  const photoPrincipale = photos.data?.find((p) => p.estPrincipale) ?? photos.data?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Rapport du véhicule {identifiantVehicule(engin)}</h2>
          <p className="text-sm text-muted-foreground">
            Établi le {aujourdhui.toLocaleDateString("fr-FR")} à partir de la fiche, des documents, de
            l'échéancier d'entretien et des alertes.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={retourListe}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <BoutonDiscussion type="ENGIN" idObjet={engin.idEngin} />
          <Button variant="secondary" onClick={() => navigate(`/engins/${engin.idEngin}/fiche`)}>
            <Pencil className="h-4 w-4" />
            Modifier la fiche
          </Button>
        </div>
      </div>

      {enCours ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Préparation du rapport…
        </p>
      ) : (
        <>
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("flex items-center gap-2 font-medium", CLASSES_NIVEAU[niveauGlobal].texte)}>
              <IconeNiveau niveau={niveauGlobal} className="h-5 w-5" />
              {MESSAGE_GLOBAL[niveauGlobal]}
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Synthèse des points contrôlés">
              {ORDRE_SYNTHESE.map((niveau) => (
                <li
                  key={niveau}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                    CLASSES_NIVEAU[niveau].pastille,
                  )}
                >
                  <IconeNiveau niveau={niveau} className="h-4 w-4" />
                  <span className="font-semibold">{synthese[niveau]}</span> {LIBELLES_NIVEAU[niveau]}
                </li>
              ))}
            </ul>
          </Card>

          <SchemaVehicule
            blocs={blocs}
            lienDetail={(bloc) => cheminHistorique(engin.idEngin, bloc.cle)}
            actionCarte={(bloc) => {
              if (bloc.cle === "alertes" && peutFaireMaintenance(session?.role)) {
                return (
                  <Button size="sm" onClick={() => setMaintenanceOuverte(true)}>
                    <Wrench className="h-4 w-4" />
                    Faire la maintenance
                  </Button>
                );
              }
              if (bloc.cle === "emplacement" && peutPlanifierEmplacement(session?.role)) {
                return (
                  <Button size="sm" onClick={() => setEmplacementOuvert(true)}>
                    <CalendarPlus className="h-4 w-4" />
                    Mission / chantier
                  </Button>
                );
              }
              if (bloc.cle === "carburant" && peutSaisirCarburant(session?.role)) {
                return (
                  <Button size="sm" onClick={() => setPleinOuvert(true)}>
                    <Fuel className="h-4 w-4" />
                    Ajouter un plein
                  </Button>
                );
              }
              if (bloc.cle === "incidents" && peutDeclarerIncident(session?.role)) {
                return (
                  <Button size="sm" onClick={() => setIncidentOuvert(true)}>
                    <ShieldAlert className="h-4 w-4" />
                    Déclarer un incident
                  </Button>
                );
              }
              return undefined;
            }}
            contenuCarte={(bloc) => (bloc.cle === "emplacement" ? <CarteLocalisationGps idEngin={engin.idEngin} /> : undefined)}
            centre={
              <IdentiteVehicule
                engin={engin}
                niveau={niveauGlobal}
                photo={
                  photoPrincipale ? (
                    <AuthenticatedImage
                      url={photoPrincipale.url}
                      alt={`Photo de ${libelleVehicule(engin)}`}
                      className="h-full w-full"
                    />
                  ) : undefined
                }
              />
            }
          />
        </>
      )}
      <FaireMaintenanceDialog engin={engin} open={maintenanceOuverte} onOpenChange={setMaintenanceOuverte} />
      <PlanifierEmplacementDialog
        engin={engin}
        missions={missions.data ?? []}
        rattachements={rattachementsChantier ?? []}
        open={emplacementOuvert}
        onOpenChange={setEmplacementOuvert}
      />
      <CarburantFormDialog open={pleinOuvert} onOpenChange={setPleinOuvert} idEnginInitial={engin.idEngin} />
      <IncidentFormDialog open={incidentOuvert} onOpenChange={setIncidentOuvert} idEnginInitial={engin.idEngin} />
    </div>
  );
}

function IconeNiveau({ niveau, className }: { niveau: NiveauRapport; className?: string }) {
  const Icone = ICONES_NIVEAU[niveau];
  return <Icone className={className} aria-hidden="true" />;
}

function IdentiteVehicule({ engin, niveau, photo }: { engin: Engin; niveau: NiveauRapport; photo?: ReactNode }) {
  const chantier = engin.typeEngin.categorie === "ENGIN_CHANTIER";
  const compteur = chantier
    ? engin.compteurHeures != null
      ? `${formatNombre(engin.compteurHeures)} h`
      : null
    : engin.kilometrage != null
      ? `${formatNombre(engin.kilometrage)} km`
      : null;
  const identifiant = chantier ? engin.numeroSerie : engin.immatriculation;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
      <div
        className={cn(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-4 bg-muted shadow-lg",
          CLASSES_NIVEAU[niveau].bordure,
        )}
      >
        {photo ?? <Car className="h-20 w-20 text-muted-foreground" aria-label="Pas de photo" />}
      </div>
      <div>
        <p className="font-display text-xl font-semibold">
          {engin.marque} {engin.modele}
        </p>
        <p className="text-sm text-muted-foreground">
          {[identifiant, engin.typeEngin.libelle].filter(Boolean).join(" • ")}
        </p>
        <p className="mt-1 text-sm">
          {libelleEnum(engin.statut)}
          {compteur && <> • {compteur}</>}
        </p>
      </div>
    </div>
  );
}
