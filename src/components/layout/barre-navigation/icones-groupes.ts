import { Car, Gauge, Route, Shield, Wallet, Wrench, type LucideIcon } from "lucide-react";
import type { IdGroupeNav } from "@/routes/nav-config";

/** Pictogramme de chaque groupe du menu : seul affiché sur petit écran (libellé masqué). Groupes par métier (2026-09-30). */
export const ICONES_GROUPES: Record<IdGroupeNav, LucideIcon> = {
  pilotage: Gauge,
  parc: Car,
  exploitation: Route,
  atelier: Wrench,
  finances: Wallet,
  administration: Shield,
};
