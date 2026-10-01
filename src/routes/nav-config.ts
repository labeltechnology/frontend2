import { ACCES_PAGES } from "@/routes/acces-pages";
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
  /** Omis = accessible à tout utilisateur authentifié. Toujours tiré de ACCES_PAGES (routes/acces-pages.ts). */
  rolesAutorises?: readonly RoleLibelle[];
}

/** Pages par métier (2026-09-30) : les rôles de chaque page viennent de routes/acces-pages.ts. */
const acces = (to: string) => ({ to, rolesAutorises: ACCES_PAGES[to] });

/**
 * Un seul point de vérité pour la navigation : chaque entrée pilote à la
 * fois le lien de la barre latérale et la garde de route associée (voir
 * App.tsx), pour éviter qu'un lien visible mène à une page qui refuse
 * l'accès (ou l'inverse). Les gardes de App.tsx lisent leurs rôles ici via
 * {@link rolesPourChemin} (RouteGardee) : plus aucun rôle recopié à la main.
 */
export const NAV_ITEMS: NavItem[] = [
  // Pilotage : analyser et décider.
  { ...acces("/"), label: "Tableau de bord", icon: LayoutDashboard, groupe: "pilotage" },
  { ...acces("/analytique"), label: "Analytique", icon: TrendingUp, groupe: "pilotage" },
  // Performance et utilisation (2026-09-28) : taux d'utilisation réel, coût par km / h, KPI du parc.
  { ...acces("/performance"), label: "Performance", icon: Gauge, groupe: "pilotage" },
  // Coûts et rentabilité (2026-09-29) : TCO, véhicules à problèmes, budget carburant, conduite.
  { ...acces("/couts"), label: "Coûts", icon: Wallet, groupe: "pilotage" },
  // Maintenance et fiabilité, conformité, sinistres ; renouvellement (2026-09-29)
  { ...acces("/fiabilite"), label: "Fiabilité et conformité", icon: ShieldCheck, groupe: "pilotage" },
  { ...acces("/renouvellement"), label: "Renouvellement", icon: RefreshCw, groupe: "pilotage" },
  // Recommandations par règles (2026-09-29) : actions chiffrées tirées des indicateurs.
  { ...acces("/recommandations"), label: "Recommandations", icon: Lightbulb, groupe: "pilotage" },
  { ...acces("/rapports"), label: "Rapports", icon: BarChart3, groupe: "pilotage" },
  // Messagerie interne (2026-09-28) : tous les rôles ; affichée à part dans la barre (pastille des non-lus).
  { ...acces("/messagerie"), label: "Messagerie", icon: MessagesSquare, groupe: "pilotage" },
  // Parc : le matériel, ses papiers et les conducteurs.
  { ...acces("/engins"), label: "Véhicules", icon: Car, groupe: "parc" },
  { ...acces("/types-engin"), label: "Types de véhicule", icon: Tags, groupe: "parc" },
  { ...acces("/listes-fiche"), label: "Listes de la fiche", icon: ListChecks, groupe: "parc" },
  { ...acces("/documents"), label: "Documents", icon: FileText, groupe: "parc" },
  { ...acces("/conducteurs"), label: "Conducteurs", icon: Users, groupe: "parc" },
  { ...acces("/zones"), label: "Zones géographiques", icon: MapPinned, groupe: "parc" },
  // Exploitation : le travail de tous les jours.
  { ...acces("/missions"), label: "Missions", icon: RouteIcon, groupe: "exploitation" },
  { ...acces("/affectations"), label: "Affectations", icon: ClipboardList, groupe: "exploitation" },
  { ...acces("/chantiers"), label: "Chantiers", icon: HardHat, groupe: "exploitation" },
  { ...acces("/gps"), label: "GPS et trajets", icon: Satellite, groupe: "exploitation" },
  { ...acces("/carburant"), label: "Carburant", icon: Fuel, groupe: "exploitation" },
  { ...acces("/incidents"), label: "Incidents", icon: TriangleAlert, groupe: "exploitation" },
  { ...acces("/alertes"), label: "Alertes", icon: BellRing, groupe: "exploitation" },
  // Atelier
  { ...acces("/maintenance"), label: "Maintenance", icon: Wrench, groupe: "atelier" },
  { ...acces("/garages-externes"), label: "Garages externes", icon: Building2, groupe: "atelier" },
  { ...acces("/fournisseurs"), label: "Fournisseurs", icon: Truck, groupe: "atelier" },
  // Finances
  { ...acces("/locations-externes"), label: "Locations externes", icon: Handshake, groupe: "finances" },
  { ...acces("/locations-entrantes"), label: "Locations entrantes", icon: ArrowDownToLine, groupe: "finances" },
  { ...acces("/prestataires-location"), label: "Prestataires de location", icon: Store, groupe: "finances" },
  { ...acces("/factures-proforma"), label: "Factures pro forma", icon: Receipt, groupe: "finances" },
  // Export comptable (2026-09-29) : écritures CSV des factures, du carburant et de la maintenance.
  { ...acces("/export-comptable"), label: "Export comptable", icon: FileSpreadsheet, groupe: "finances" },
  // Administration (Paramètres est présenté à part par la barre de navigation)
  // Mise en service (2026-09-30) : les 5 étapes de réglage, avec leur avancement.
  { ...acces("/mise-en-service"), label: "Mise en service", icon: Rocket, groupe: "administration" },
  { ...acces("/utilisateurs"), label: "Utilisateurs", icon: UserCog, groupe: "administration" },
  { ...acces("/journal-audit"), label: "Journal d'audit", icon: History, groupe: "administration" },
  // Suivi du logiciel (adoption, qualité des données, connexions) et import Excel / CSV (2026-09-29).
  { ...acces("/suivi-logiciel"), label: "Suivi du logiciel", icon: Activity, groupe: "administration" },
  { ...acces("/imports"), label: "Import Excel ou CSV", icon: FileUp, groupe: "administration" },
  { ...acces("/aide"), label: "Aide", icon: HelpCircle, groupe: "administration" },
  { ...acces("/parametres"), label: "Paramètres", icon: Settings, groupe: "administration" },
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
