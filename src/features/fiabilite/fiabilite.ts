import { nombreFr } from "@/features/performance/performance";
import { normaliserNombre } from "@/lib/utils";
import type { TypeDocument } from "@/types/document";
import type {
  EnregistrerSinistreRequest,
  EtatDocument,
  NatureDepassement,
  ResponsabiliteSinistre,
  RetardEcheance,
  Sinistre,
  StatutDossierSinistre,
} from "@/types/fiabilite";

/**
 * Règles d'affichage de la page « Fiabilité et conformité » (2026-09-29) :
 * libellés, couleurs, textes, et formulaire du volet sinistre. Sans React,
 * testées avec tsx.
 */

/** « 90,5 % » ou « — ». */
export function textePourcent(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : `${nombreFr(v, 1)} %`;
}

/** Durée en heures lisible : « 6 h », « 2 j 4 h » au-delà de 48 h. */
export function texteHeures(h: number | null | undefined): string {
  if (h === null || h === undefined) return "—";
  if (h < 48) return `${nombreFr(h, 1)} h`;
  const jours = Math.floor(h / 24);
  const reste = Math.round(h - jours * 24);
  return reste === 0 ? `${jours} j` : `${jours} j ${reste} h`;
}

/** Minutes lisibles : « 4 h 30 », « 9 h », « 45 min » (même règle que le serveur). */
export function texteMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** MTBF : « une panne tous les 33 j » ou « aucune panne ». */
export function texteMtbf(jours: number | null, pannes: number): string {
  if (pannes === 0 || jours === null) return "Aucune panne";
  return `Une panne tous les ${nombreFr(jours, 1)} j`;
}

/** Couleur d'un taux (disponibilité, conformité, entretiens à temps) : vert ≥ objectif, orange ≥ objectif − 10, rouge sinon. */
export function classeTauxObjectif(taux: number | null | undefined, objectif: number): string {
  if (taux === null || taux === undefined) return "text-muted-foreground";
  if (taux >= objectif) return "text-badge-successFg";
  if (taux >= objectif - 10) return "text-badge-warningFg";
  return "text-badge-dangerFg";
}

/** Retard lisible : « 30 j de retard », « +1 200 km », « 12 j et +800 km ». */
export function texteRetard(r: Pick<RetardEcheance, "joursRetard" | "depassementCompteur" | "unite">): string {
  const parties: string[] = [];
  if (r.joursRetard) parties.push(`${r.joursRetard} j`);
  if (r.depassementCompteur) parties.push(`+${nombreFr(r.depassementCompteur)} ${r.unite}`);
  return parties.length === 0 ? "En retard" : parties.join(" et ");
}

export const ETATS_DOCUMENT: Record<EtatDocument, { libelle: string; classes: string }> = {
  VALIDE: { libelle: "Valide", classes: "bg-badge-successBg text-badge-successFg" },
  BIENTOT_EXPIRE: { libelle: "À renouveler", classes: "bg-badge-warningBg text-badge-warningFg" },
  EXPIRE: { libelle: "Expiré", classes: "bg-badge-dangerBg text-badge-dangerFg" },
  MANQUANT: { libelle: "Manquant", classes: "bg-badge-dangerBg text-badge-dangerFg" },
};

export const NATURES_DEPASSEMENT: Record<NatureDepassement, string> = {
  CONDUITE_CONTINUE: "Conduite continue",
  CONDUITE_JOURNALIERE: "Conduite dans la journée",
};

/** Documents qu'on peut exiger pour un véhicule (le permis concerne le conducteur). */
export const DOCUMENTS_VEHICULE: TypeDocument[] = [
  "ASSURANCE",
  "VISITE_TECHNIQUE",
  "CARTE_GRISE",
  "CONFORMITE_FISCALE",
  "LICENCE_TRANSPORT",
  "CARTE_CARBURANT",
  "AUTRE",
];

export const DOCUMENTS_PAR_DEFAUT: TypeDocument[] = ["ASSURANCE", "VISITE_TECHNIQUE"];

// ---------------------------------------------------------------- Sinistres

export const RESPONSABILITES: Record<ResponsabiliteSinistre, { libelle: string; classes: string }> = {
  A_DETERMINER: { libelle: "À déterminer", classes: "bg-badge-neutralBg text-badge-neutralFg" },
  NON_RESPONSABLE: { libelle: "Non responsable", classes: "bg-badge-successBg text-badge-successFg" },
  PARTAGEE: { libelle: "Responsabilité partagée", classes: "bg-badge-warningBg text-badge-warningFg" },
  RESPONSABLE: { libelle: "Responsable", classes: "bg-badge-dangerBg text-badge-dangerFg" },
};

export const STATUTS_DOSSIER: Record<StatutDossierSinistre, { libelle: string; classes: string }> = {
  OUVERT: { libelle: "Dossier ouvert", classes: "bg-badge-infoBg text-badge-infoFg" },
  CLOS: { libelle: "Dossier clos", classes: "bg-badge-neutralBg text-badge-neutralFg" },
};

/** Valeurs du formulaire du volet sinistre (texte saisi). */
export interface ValeursSinistre {
  assureur: string;
  numeroDossier: string;
  dateDeclaration: string;
  responsabilite: ResponsabiliteSinistre;
  montantDommages: string;
  franchise: string;
  indemnisationRecue: string;
  dateIndemnisation: string;
  statutDossier: StatutDossierSinistre;
  commentaire: string;
}

export function valeursSinistre(s: Sinistre | null | undefined): ValeursSinistre {
  const t = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
  return {
    assureur: s?.assureur ?? "",
    numeroDossier: s?.numeroDossier ?? "",
    dateDeclaration: s?.dateDeclaration ?? "",
    responsabilite: s?.responsabilite ?? "A_DETERMINER",
    montantDommages: t(s?.montantDommagesSaisi),
    franchise: t(s?.franchise),
    indemnisationRecue: t(s?.indemnisationRecue),
    dateIndemnisation: s?.dateIndemnisation ?? "",
    statutDossier: s?.statutDossier ?? "OUVERT",
    commentaire: s?.commentaire ?? "",
  };
}

/**
 * Montant saisi (« 1 250 000 » ou « 1250000,5 ») ; null si vide ; undefined si
 * invalide. Normalisation déléguée à {@link normaliserNombre} (lib/utils),
 * quatrième point du code à en avoir besoin : la classe de caractères écrite
 * ici à la main répétait deux espaces ordinaires déjà couverts par `\s`, sans
 * rien ajouter.
 */
export function lireMontant(texte: string): number | null | undefined {
  const t = normaliserNombre(texte);
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Requête d'enregistrement, ou message d'erreur. */
export function requeteSinistre(v: ValeursSinistre): EnregistrerSinistreRequest | string {
  const montants = {
    montantDommages: lireMontant(v.montantDommages),
    franchise: lireMontant(v.franchise),
    indemnisationRecue: lireMontant(v.indemnisationRecue),
  };
  for (const [cle, valeur] of Object.entries(montants)) {
    if (valeur === undefined) {
      const noms: Record<string, string> = { montantDommages: "dommages", franchise: "franchise", indemnisationRecue: "indemnisation" };
      return `Montant de ${noms[cle]} invalide.`;
    }
  }
  if (v.dateIndemnisation && montants.indemnisationRecue === null) return "Indiquez le montant de l'indemnisation reçue.";
  const texte = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    assureur: texte(v.assureur),
    numeroDossier: texte(v.numeroDossier),
    dateDeclaration: v.dateDeclaration || null,
    responsabilite: v.responsabilite,
    montantDommages: montants.montantDommages ?? null,
    franchise: montants.franchise ?? null,
    indemnisationRecue: montants.indemnisationRecue ?? null,
    dateIndemnisation: v.dateIndemnisation || null,
    statutDossier: v.statutDossier,
    commentaire: texte(v.commentaire),
  };
}

/** Reste à charge prévu pendant la saisie : dommages (ou coût estimé de l'incident) − indemnisation. */
export function resteAChargePrevu(v: ValeursSinistre, coutEstimeIncident: number | null): number | null {
  const dommages = lireMontant(v.montantDommages);
  const indemnisation = lireMontant(v.indemnisationRecue);
  if (dommages === undefined || indemnisation === undefined) return null;
  const base = dommages ?? coutEstimeIncident ?? 0;
  return Math.max(0, base - (indemnisation ?? 0));
}
