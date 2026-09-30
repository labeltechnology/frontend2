import { NOMS_MOIS } from "@/features/couts/couts";
import { nombreFr } from "@/features/performance/performance";
import type { ActiviteUtilisateur } from "@/types/suivi-logiciel";

/**
 * Page « Suivi du logiciel » (2026-09-29, questions sur le logiciel) :
 * adoption, complétude des données, journal des connexions. Règles
 * d'affichage pures ; couleurs toujours doublées d'un texte.
 */
export const ONGLETS_SUIVI = ["adoption", "donnees", "connexions"] as const;
export type OngletSuivi = (typeof ONGLETS_SUIVI)[number];

export const ACTIVITES: Record<ActiviteUtilisateur, { libelle: string; classes: string }> = {
  ACTIF: { libelle: "Actif", classes: "bg-badge-successBg text-badge-successFg" },
  INACTIF: { libelle: "Inactif depuis 30 jours", classes: "bg-badge-warningBg text-badge-warningFg" },
  JAMAIS: { libelle: "Jamais connecté", classes: "bg-badge-dangerBg text-badge-dangerFg" },
};

/** « 66,7 % » ou « — ». */
export function texteTaux(taux: number | null | undefined): string {
  return taux === null || taux === undefined ? "—" : `${nombreFr(taux, 1)} %`;
}

/** Vert à partir de 80 %, orange à partir de 50 %, rouge en dessous. */
export function classeTaux(taux: number | null | undefined, bon = 80, moyen = 50): string | undefined {
  if (taux === null || taux === undefined) return undefined;
  if (taux >= bon) return "text-badge-successFg";
  if (taux >= moyen) return "text-badge-warningFg";
  return "text-badge-dangerFg";
}

/** « 2026-09 » → « sept. 2026 ». */
export function libelleMoisAdoption(mois: string): string {
  const [a, m] = mois.split("-");
  return `${NOMS_MOIS[Number(m) - 1]} ${a}`;
}

/** Navigateur ou appli lisible depuis l'en-tête User-Agent : « Chrome · Windows », « Appli Android ». */
export function resumerNavigateur(ua: string | null | undefined): string {
  if (!ua) return "—";
  const s = ua.toLowerCase();
  if (s.includes("okhttp") || s.includes("dart") || s.includes("expo") || s.includes("reactnative")) {
    return s.includes("iphone") || s.includes("ios") ? "Appli iOS" : "Appli Android";
  }
  const navigateur = s.includes("edg/")
    ? "Edge"
    : s.includes("opr/") || s.includes("opera")
      ? "Opera"
      : s.includes("firefox/")
        ? "Firefox"
        : s.includes("chrome/")
          ? "Chrome"
          : s.includes("safari/")
            ? "Safari"
            : s.includes("curl") || s.includes("postman")
              ? "Outil technique"
              : "Autre";
  const systeme = s.includes("android")
    ? "Android"
    : s.includes("iphone") || s.includes("ipad")
      ? "iOS"
      : s.includes("windows")
        ? "Windows"
        : s.includes("mac os")
          ? "macOS"
          : s.includes("linux")
            ? "Linux"
            : null;
  return systeme ? `${navigateur} · ${systeme}` : navigateur;
}

/** Nombre d'échecs par adresse IP : repère une tentative d'intrusion (3 échecs ou plus). */
export function adressesSuspectes(lignes: { succes: boolean; adresseIp: string | null }[], seuil = 3): { adresse: string; echecs: number }[] {
  const compte = new Map<string, number>();
  for (const l of lignes) if (!l.succes && l.adresseIp) compte.set(l.adresseIp, (compte.get(l.adresseIp) ?? 0) + 1);
  return [...compte.entries()]
    .filter(([, n]) => n >= seuil)
    .map(([adresse, echecs]) => ({ adresse, echecs }))
    .sort((a, b) => b.echecs - a.echecs);
}
