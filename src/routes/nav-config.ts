import { ROLES_PAR_CAPACITE } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";
import {
  LayoutDashboard,
  TrendingUp,
  Gauge,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Car,
  Users,
  Route as RouteIcon,
  ClipboardList,
  BellRing,
  Satellite,
  Wrench,
  MapPinned,
  Fuel,
  FileText,
  TriangleAlert,
  BarChart3,
  History,
  UserCog,
  Truck,
  Building2,
  FileSpreadsheet,
  Activity,
  FileUp,
  Lightbulb,
  Handshake,
  ArrowDownToLine,
  Store,
  Receipt,
  Settings,
  HardHat,
  HelpCircle,
  Tags,
  ListChecks,
  MessagesSquare,
  Rocket,
  type LucideIcon,
} from "lucide-react";

/**
 * Groupes du menu, par métier (2026-09-30, ergonomie ; remplace les 4 groupes
 * du 2026-09-24). L'ordre de ce tableau est l'ordre d'affichage ; un groupe
 * sans entrée visible pour le rôle connecté n'est pas affiché.
 */
export const GROUPES_NAV = [
  { id: "pilotage", libelle: "Pilotage" },
  { id: "parc", libelle: "Parc" },
  { id: "exploitation", libelle: "Exploitation" },
  { id: "atelier", libelle: "Atelier" },
  { id: "finances", libelle: "Finances" },
  { id: "administration", libelle: "Administration" },
] as const;

export type IdGroupeNav = (typeof GROUPES_NAV)[number]["id"];
export type GroupeNav = (typeof GROUPES_NAV)[number];

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Groupe de la barre latérale — obligatoire : toute nouvelle entrée doit choisir sa place. */
  groupe: IdGroupeNav;
  /** Omis = accessible à tout utilisateur authentifié. Toujours tiré de ROLES_PAR_CAPACITE (lib/droits.ts). */
  rolesAutorises?: readonly RoleLibelle[];
}

/**
 * Niveaux d'autorisation (2026-09-28) : chaque restriction reprend une
 * capacité de lib/droits.ts, miroir des @PreAuthorize du serveur.
 */
const { GERER_PARC, CONSULTER_GESTION, ADMINISTRER } = ROLES_PAR_CAPACITE;

/**
 * Un seul point de vérité pour la navigation : chaque entrée pilote à la
 * fois le lien de la barre latérale et la garde de route associée (voir
 * App.tsx), pour éviter qu'un lien visible mène à une page qui refuse
 * l'accès (ou l'inverse). Les gardes de App.tsx lisent leurs rôles ici via
 * {@link rolesPourChemin} (RouteGardee) : plus aucun rôle recopié à la main.
 */
export const NAV_ITEMS: NavItem[] = [
  // Pilotage : analyser et décider.
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, groupe: "pilotage" },
  { to: "/analytique", label: "Analytique", icon: TrendingUp, groupe: "pilotage" },
  // Performance et utilisation (2026-09-28) : taux d'utilisation réel, coût par km / h, KPI du parc.
  { to: "/performance", label: "Performance", icon: Gauge, groupe: "pilotage", rolesAutorises: CONSULTER_GESTION },
  // Coûts et rentabilité (2026-09-29) : TCO, véhicules à problèmes, budget carburant, conduite.
  { to: "/couts", label: "Coûts", icon: Wallet, groupe: "pilotage", rolesAutorises: CONSULTER_GESTION },
  // Maintenance et fiabilité, conformité, sinistres ; renouvellement (2026-09-29)
  { to: "/fiabilite", label: "Fiabilité et conformité", icon: ShieldCheck, groupe: "pilotage", rolesAutorises: CONSULTER_GESTION },
  { to: "/renouvellement", label: "Renouvellement", icon: RefreshCw, groupe: "pilotage", rolesAutorises: CONSULTER_GESTION },
  // Recommandations par règles (2026-09-29) : actions chiffrées tirées des indicateurs.
  { to: "/recommandations", label: "Recommandations", icon: Lightbulb, groupe: "pilotage", rolesAutorises: CONSULTER_GESTION },
  { to: "/rapports", label: "Rapports", icon: BarChart3, groupe: "pilotage", rolesAutorises: CONSULTER_GESTION },
  // Messagerie interne (2026-09-28) : tous les rôles ; affichée à part dans la barre (pastille des non-lus).
  { to: "/messagerie", label: "Messagerie", icon: MessagesSquare, groupe: "pilotage" },
  // Parc : le matériel, ses papiers et les conducteurs.
  { to: "/engins", label: "Véhicules", icon: Car, groupe: "parc" },
  { to: "/types-engin", label: "Types de véhicule", icon: Tags, groupe: "parc", rolesAutorises: GERER_PARC },
  { to: "/listes-fiche", label: "Listes de la fiche", icon: ListChecks, groupe: "parc", rolesAutorises: GERER_PARC },
  { to: "/documents", label: "Documents", icon: FileText, groupe: "parc" },
  { to: "/conducteurs", label: "Conducteurs", icon: Users, groupe: "parc", rolesAutorises: CONSULTER_GESTION },
  { to: "/zones", label: "Zones géographiques", icon: MapPinned, groupe: "parc" },
  // Exploitation : le travail de tous les jours.
  { to: "/missions", label: "Missions", icon: RouteIcon, groupe: "exploitation" },
  { to: "/affectations", label: "Affectations", icon: ClipboardList, groupe: "exploitation" },
  { to: "/chantiers", label: "Chantiers", icon: HardHat, groupe: "exploitation" },
  { to: "/gps", label: "GPS & trajets", icon: Satellite, groupe: "exploitation" },
  { to: "/carburant", label: "Carburant", icon: Fuel, groupe: "exploitation" },
  { to: "/incidents", label: "Incidents", icon: TriangleAlert, groupe: "exploitation" },
  { to: "/alertes", label: "Alertes", icon: BellRing, groupe: "exploitation" },
  // Atelier
  { to: "/maintenance", label: "Maintenance", icon: Wrench, groupe: "atelier" },
  { to: "/garages-externes", label: "Garages externes", icon: Building2, groupe: "atelier" },
  { to: "/fournisseurs", label: "Fournisseurs", icon: Truck, groupe: "atelier" },
  // Finances
  { to: "/locations-externes", label: "Locations externes", icon: Handshake, groupe: "finances", rolesAutorises: CONSULTER_GESTION },
  { to: "/locations-entrantes", label: "Locations entrantes", icon: ArrowDownToLine, groupe: "finances", rolesAutorises: CONSULTER_GESTION },
  { to: "/prestataires-location", label: "Prestataires de location", icon: Store, groupe: "finances", rolesAutorises: CONSULTER_GESTION },
  { to: "/factures-proforma", label: "Factures proforma", icon: Receipt, groupe: "finances", rolesAutorises: CONSULTER_GESTION },
  // Export comptable (2026-09-29) : écritures CSV des factures, du carburant et de la maintenance.
  { to: "/export-comptable", label: "Export comptable", icon: FileSpreadsheet, groupe: "finances", rolesAutorises: CONSULTER_GESTION },
  // Administration (Paramètres est présenté à part par la barre de navigation)
  // Mise en service (2026-09-30) : les 5 étapes de réglage, avec leur avancement.
  { to: "/mise-en-service", label: "Mise en service", icon: Rocket, groupe: "administration", rolesAutorises: ADMINISTRER },
  { to: "/utilisateurs", label: "Utilisateurs", icon: UserCog, groupe: "administration", rolesAutorises: ADMINISTRER },
  { to: "/journal-audit", label: "Journal d'audit", icon: History, groupe: "administration", rolesAutorises: ADMINISTRER },
  // Suivi du logiciel (adoption, qualité des données, connexions) et import Excel / CSV (2026-09-29).
  { to: "/suivi-logiciel", label: "Suivi du logiciel", icon: Activity, groupe: "administration", rolesAutorises: ADMINISTRER },
  { to: "/imports", label: "Import Excel / CSV", icon: FileUp, groupe: "administration", rolesAutorises: GERER_PARC },
  { to: "/aide", label: "Aide", icon: HelpCircle, groupe: "administration" },
  { to: "/parametres", label: "Paramètres", icon: Settings, groupe: "administration", rolesAutorises: ADMINISTRER },
];

/**
 * Rôles autorisés de l'entrée de menu {@code chemin} (undefined = tout
 * utilisateur authentifié). Lève une erreur si le chemin n'est pas une entrée
 * de NAV_ITEMS : une faute de frappe dans App.tsx doit se voir tout de suite,
 * jamais ouvrir une page à tous les rôles par accident.
 */
export function rolesPourChemin(chemin: string): readonly RoleLibelle[] | undefined {
  const item = NAV_ITEMS.find((i) => i.to === chemin);
  if (!item) {
    throw new Error(`Chemin « ${chemin} » absent de NAV_ITEMS (routes/nav-config.ts)`);
  }
  return item.rolesAutorises;
}
