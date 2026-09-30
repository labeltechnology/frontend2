import {
  BellRing,
  Car,
  FileBarChart,
  Fuel,
  Handshake,
  HelpCircle,
  LifeBuoy,
  ListChecks,
  MapPin,
  Megaphone,
  MessageCircleQuestion,
  Rocket,
  Route,
  Shield,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Icônes des rubriques et sections (les fichiers de contenu restent sans JSX). */
const ICONES: Record<string, LucideIcon> = {
  BellRing,
  Car,
  FileBarChart,
  Fuel,
  Handshake,
  LifeBuoy,
  ListChecks,
  MapPin,
  Megaphone,
  MessageCircleQuestion,
  Rocket,
  Route,
  Shield,
  TriangleAlert,
  Wrench,
};

export function iconeAide(nom: string | undefined): LucideIcon {
  return (nom && ICONES[nom]) || HelpCircle;
}
