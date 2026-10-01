import { lazy, type ReactNode } from "react";
import { Accueil } from "@/routes/Accueil";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/features/auth/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { AccessDeniedPage } from "@/routes/AccessDeniedPage";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { RouteGardee } from "@/routes/RouteGardee";


/*
 * Pages chargées à la demande (2026-10-01). Avant ce découpage, les 45 écrans
 * et leurs bibliothèques partaient dans un seul fichier de 2,4 Mo : ouvrir la
 * page de connexion téléchargeait aussi les graphiques (recharts) et les
 * cartes (Leaflet), que la plupart des visites n'ouvrent jamais. Rollup crée
 * désormais un fichier par page, chargé au premier affichage.
 *
 * Restent chargées immédiatement : la connexion (premier écran), le tableau
 * de bord (page d'accueil), et les pages d'erreur — les différer n'aurait fait
 * qu'ajouter une attente visible.
 *
 * Le `.then` est nécessaire parce que les pages sont des exports NOMMÉS, alors
 * que `lazy` attend un export par défaut.
 */
const AnalyticsPage = lazy(() => import("@/features/analytics/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
const EnginsPage = lazy(() => import("@/features/engins/EnginsPage").then((m) => ({ default: m.EnginsPage })));
const FicheEnginPage = lazy(() => import("@/features/engins/FicheEnginPage").then((m) => ({ default: m.FicheEnginPage })));
const RapportEnginPage = lazy(() => import("@/features/rapport-engin/RapportEnginPage").then((m) => ({ default: m.RapportEnginPage })));
const HistoriqueEnginPage = lazy(() => import("@/features/historique-engin/HistoriqueEnginPage").then((m) => ({ default: m.HistoriqueEnginPage })));
const TypesEnginPage = lazy(() => import("@/features/engins/TypesEnginPage").then((m) => ({ default: m.TypesEnginPage })));
const ReferentielsFichePage = lazy(() => import("@/features/referentiels-fiche/ReferentielsFichePage").then((m) => ({ default: m.ReferentielsFichePage })));
const ConducteursPage = lazy(() => import("@/features/conducteurs/ConducteursPage").then((m) => ({ default: m.ConducteursPage })));
const MissionsPage = lazy(() => import("@/features/missions/MissionsPage").then((m) => ({ default: m.MissionsPage })));
const AffectationsPage = lazy(() => import("@/features/affectations/AffectationsPage").then((m) => ({ default: m.AffectationsPage })));
const ChantiersPage = lazy(() => import("@/features/chantiers/ChantiersPage").then((m) => ({ default: m.ChantiersPage })));
const PlanChantierPage = lazy(() => import("@/features/chantiers/PlanChantierPage").then((m) => ({ default: m.PlanChantierPage })));
const FicheChantierPage = lazy(() => import("@/features/chantiers/fiche/FicheChantierPage").then((m) => ({ default: m.FicheChantierPage })));
const AlertesPage = lazy(() => import("@/features/alertes/AlertesPage").then((m) => ({ default: m.AlertesPage })));
const MessageriePage = lazy(() => import("@/features/messagerie/MessageriePage").then((m) => ({ default: m.MessageriePage })));
const GpsPage = lazy(() => import("@/features/gps/GpsPage").then((m) => ({ default: m.GpsPage })));
const MaintenancePage = lazy(() => import("@/features/maintenance/MaintenancePage").then((m) => ({ default: m.MaintenancePage })));
const FournisseursPage = lazy(() => import("@/features/fournisseurs/FournisseursPage").then((m) => ({ default: m.FournisseursPage })));
const GaragesPage = lazy(() => import("@/features/garages/GaragesPage").then((m) => ({ default: m.GaragesPage })));
const LocationExternePage = lazy(() => import("@/features/location-externe/LocationExternePage").then((m) => ({ default: m.LocationExternePage })));
const LocationEntrantePage = lazy(() => import("@/features/location-entrante/LocationEntrantePage").then((m) => ({ default: m.LocationEntrantePage })));
const PrestatairesLocationPage = lazy(() => import("@/features/prestataire-location/PrestatairesLocationPage").then((m) => ({ default: m.PrestatairesLocationPage })));
const ZonesPage = lazy(() => import("@/features/zones/ZonesPage").then((m) => ({ default: m.ZonesPage })));
const CarburantPage = lazy(() => import("@/features/carburant/CarburantPage").then((m) => ({ default: m.CarburantPage })));
const DocumentsPage = lazy(() => import("@/features/documents/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const IncidentsPage = lazy(() => import("@/features/incidents/IncidentsPage").then((m) => ({ default: m.IncidentsPage })));
const RapportsPage = lazy(() => import("@/features/rapports/RapportsPage").then((m) => ({ default: m.RapportsPage })));
const PerformancePage = lazy(() => import("@/features/performance/PerformancePage").then((m) => ({ default: m.PerformancePage })));
const CoutsPage = lazy(() => import("@/features/couts/CoutsPage").then((m) => ({ default: m.CoutsPage })));
const FiabilitePage = lazy(() => import("@/features/fiabilite/FiabilitePage").then((m) => ({ default: m.FiabilitePage })));
const RenouvellementPage = lazy(() => import("@/features/renouvellement/RenouvellementPage").then((m) => ({ default: m.RenouvellementPage })));
const ExportComptablePage = lazy(() => import("@/features/comptabilite/ExportComptablePage").then((m) => ({ default: m.ExportComptablePage })));
const ImportsPage = lazy(() => import("@/features/imports/ImportsPage").then((m) => ({ default: m.ImportsPage })));
const RecommandationsPage = lazy(() => import("@/features/recommandations/RecommandationsPage").then((m) => ({ default: m.RecommandationsPage })));
const SuiviLogicielPage = lazy(() => import("@/features/suivi-logiciel/SuiviLogicielPage").then((m) => ({ default: m.SuiviLogicielPage })));
const ProformaPage = lazy(() => import("@/features/proforma/ProformaPage").then((m) => ({ default: m.ProformaPage })));
const AuditPage = lazy(() => import("@/features/audit/AuditPage").then((m) => ({ default: m.AuditPage })));
const UtilisateursPage = lazy(() => import("@/features/utilisateurs/UtilisateursPage").then((m) => ({ default: m.UtilisateursPage })));
const MiseEnServicePage = lazy(() => import("@/features/mise-en-service/MiseEnServicePage").then((m) => ({ default: m.MiseEnServicePage })));
const ParametresPage = lazy(() => import("@/features/parametres/ParametresPage").then((m) => ({ default: m.ParametresPage })));
const AidePage = lazy(() => import("@/features/aide/AidePage").then((m) => ({ default: m.AidePage })));

/**
 * Page gardée par les rôles de l'entrée de menu {@code chemin} de
 * nav-config.ts (voir RouteGardee). Les sous-pages (« /engins/nouveau »,
 * « /chantiers/:id/fiche »…) reprennent les rôles de leur entrée de menu.
 */
function garder(chemin: string, page: ReactNode) {
  return <RouteGardee chemin={chemin}>{page}</RouteGardee>;
}

/**
 * Table de routage. Plus aucun rôle n'est écrit ici (2026-09-24) : chaque
 * page lit les `rolesAutorises` de son entrée dans nav-config.ts via
 * {@link garder}, source unique de vérité pour la navigation ET les gardes.
 */
export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          {/* Pages par métier (2026-09-30) : le conducteur arrive sur la messagerie. */}
          <Route index element={<Accueil tableauDeBord={<DashboardPage />} />} />
          <Route path="analytique" element={garder("/analytique", <AnalyticsPage />)} />
          <Route path="engins" element={garder("/engins", <EnginsPage />)} />
          {/* Page « Fiche véhicule » (2026-09-24) : création et correction, même page. */}
          <Route path="engins/nouveau" element={garder("/engins", <FicheEnginPage />)} />
          <Route path="engins/:idEngin/fiche" element={garder("/engins", <FicheEnginPage />)} />
          {/* Rapport du véhicule (2026-09-24) : lecture seule, couleurs vert / jaune / rouge. */}
          <Route path="engins/:idEngin/rapport" element={garder("/engins", <RapportEnginPage />)} />
          {/* Historique du véhicule (2026-09-25) : bouton « Voir détail » de chaque carte du rapport, un onglet par carte. */}
          <Route path="engins/:idEngin/historique" element={garder("/engins", <HistoriqueEnginPage />)} />
          <Route path="types-engin" element={garder("/types-engin", <TypesEnginPage />)} />
          <Route path="listes-fiche" element={garder("/listes-fiche", <ReferentielsFichePage />)} />
          <Route path="conducteurs" element={garder("/conducteurs", <ConducteursPage />)} />
          <Route path="missions" element={garder("/missions", <MissionsPage />)} />
          <Route path="affectations" element={garder("/affectations", <AffectationsPage />)} />
          <Route path="chantiers" element={garder("/chantiers", <ChantiersPage />)} />
          <Route path="chantiers/:idChantier/plan" element={garder("/chantiers", <PlanChantierPage />)} />
          {/* Fiche chantier (2026-09-24) : carte, besoins, engins en glisser-déposer ; lecture seule sans GERER_PARC (lib/droits.ts). */}
          <Route path="chantiers/nouveau" element={garder("/chantiers", <FicheChantierPage />)} />
          <Route path="chantiers/:idChantier/fiche" element={garder("/chantiers", <FicheChantierPage />)} />
          <Route path="alertes" element={garder("/alertes", <AlertesPage />)} />
          <Route path="messagerie" element={garder("/messagerie", <MessageriePage />)} />
          <Route path="gps" element={garder("/gps", <GpsPage />)} />
          <Route path="maintenance" element={garder("/maintenance", <MaintenancePage />)} />
          <Route path="fournisseurs" element={garder("/fournisseurs", <FournisseursPage />)} />
          <Route path="garages-externes" element={garder("/garages-externes", <GaragesPage />)} />
          <Route path="locations-externes" element={garder("/locations-externes", <LocationExternePage />)} />
          <Route path="locations-entrantes" element={garder("/locations-entrantes", <LocationEntrantePage />)} />
          <Route path="prestataires-location" element={garder("/prestataires-location", <PrestatairesLocationPage />)} />
          <Route path="zones" element={garder("/zones", <ZonesPage />)} />
          <Route path="carburant" element={garder("/carburant", <CarburantPage />)} />
          <Route path="documents" element={garder("/documents", <DocumentsPage />)} />
          <Route path="incidents" element={garder("/incidents", <IncidentsPage />)} />
          <Route path="rapports" element={garder("/rapports", <RapportsPage />)} />
          <Route path="performance" element={garder("/performance", <PerformancePage />)} />
          <Route path="couts" element={garder("/couts", <CoutsPage />)} />
          <Route path="fiabilite" element={garder("/fiabilite", <FiabilitePage />)} />
          <Route path="renouvellement" element={garder("/renouvellement", <RenouvellementPage />)} />
          <Route path="export-comptable" element={garder("/export-comptable", <ExportComptablePage />)} />
          <Route path="recommandations" element={garder("/recommandations", <RecommandationsPage />)} />
          <Route path="suivi-logiciel" element={garder("/suivi-logiciel", <SuiviLogicielPage />)} />
          <Route path="imports" element={garder("/imports", <ImportsPage />)} />
          <Route path="factures-proforma" element={garder("/factures-proforma", <ProformaPage />)} />
          <Route path="journal-audit" element={garder("/journal-audit", <AuditPage />)} />
          <Route path="utilisateurs" element={garder("/utilisateurs", <UtilisateursPage />)} />
          <Route path="parametres" element={garder("/parametres", <ParametresPage />)} />
          <Route path="mise-en-service" element={garder("/mise-en-service", <MiseEnServicePage />)} />
          <Route path="aide" element={garder("/aide", <AidePage />)} />
          <Route path="acces-refuse" element={<AccessDeniedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
