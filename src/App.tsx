import type { ReactNode } from "react";
import { Accueil } from "@/routes/Accueil";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/features/auth/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { EnginsPage } from "@/features/engins/EnginsPage";
import { FicheEnginPage } from "@/features/engins/FicheEnginPage";
import { RapportEnginPage } from "@/features/rapport-engin/RapportEnginPage";
import { HistoriqueEnginPage } from "@/features/historique-engin/HistoriqueEnginPage";
import { TypesEnginPage } from "@/features/engins/TypesEnginPage";
import { ReferentielsFichePage } from "@/features/referentiels-fiche/ReferentielsFichePage";
import { ConducteursPage } from "@/features/conducteurs/ConducteursPage";
import { MissionsPage } from "@/features/missions/MissionsPage";
import { AffectationsPage } from "@/features/affectations/AffectationsPage";
import { ChantiersPage } from "@/features/chantiers/ChantiersPage";
import { PlanChantierPage } from "@/features/chantiers/PlanChantierPage";
import { FicheChantierPage } from "@/features/chantiers/fiche/FicheChantierPage";
import { AlertesPage } from "@/features/alertes/AlertesPage";
import { MessageriePage } from "@/features/messagerie/MessageriePage";
import { GpsPage } from "@/features/gps/GpsPage";
import { MaintenancePage } from "@/features/maintenance/MaintenancePage";
import { FournisseursPage } from "@/features/fournisseurs/FournisseursPage";
import { GaragesPage } from "@/features/garages/GaragesPage";
import { LocationExternePage } from "@/features/location-externe/LocationExternePage";
import { LocationEntrantePage } from "@/features/location-entrante/LocationEntrantePage";
import { PrestatairesLocationPage } from "@/features/prestataire-location/PrestatairesLocationPage";
import { ZonesPage } from "@/features/zones/ZonesPage";
import { CarburantPage } from "@/features/carburant/CarburantPage";
import { DocumentsPage } from "@/features/documents/DocumentsPage";
import { IncidentsPage } from "@/features/incidents/IncidentsPage";
import { RapportsPage } from "@/features/rapports/RapportsPage";
import { PerformancePage } from "@/features/performance/PerformancePage";
import { CoutsPage } from "@/features/couts/CoutsPage";
import { FiabilitePage } from "@/features/fiabilite/FiabilitePage";
import { RenouvellementPage } from "@/features/renouvellement/RenouvellementPage";
import { ExportComptablePage } from "@/features/comptabilite/ExportComptablePage";
import { ImportsPage } from "@/features/imports/ImportsPage";
import { RecommandationsPage } from "@/features/recommandations/RecommandationsPage";
import { SuiviLogicielPage } from "@/features/suivi-logiciel/SuiviLogicielPage";
import { ProformaPage } from "@/features/proforma/ProformaPage";
import { AuditPage } from "@/features/audit/AuditPage";
import { UtilisateursPage } from "@/features/utilisateurs/UtilisateursPage";
import { MiseEnServicePage } from "@/features/mise-en-service/MiseEnServicePage";
import { ParametresPage } from "@/features/parametres/ParametresPage";
import { AidePage } from "@/features/aide/AidePage";
import { AccessDeniedPage } from "@/routes/AccessDeniedPage";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { RouteGardee } from "@/routes/RouteGardee";

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
