import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import { detailGroupe, grouperAlertesDuVehicule, libelleGroupe } from "@/features/rapport-engin/alertes-groupees";
import { LIBELLES_STATUT_ECHEANCE, decrireEcheance } from "@/features/entretien/echeance";
import { objetMaintenance } from "@/features/maintenance/objet-maintenance";
import { formatDate, formatNombre, libelleEnum } from "@/lib/utils";
import type { Alerte, PrioriteAlerte } from "@/types/alerte";
import type { Document, TypeDocument } from "@/types/document";
import type { Engin } from "@/types/engin";
import type { EcheanceEntretien, StatutEcheance } from "@/types/entretien";
import type { CategorieElementBord, EquipementBord } from "@/types/equipement-bord";
import type { Maintenance } from "@/types/maintenance";
import {
  niveauLePlusGrave,
  type BlocRapport,
  type FamilleBloc,
  type LigneRapport,
  type NiveauRapport,
} from "@/features/rapport-engin/niveaux";

/**
 * Construction du rapport d'un véhicule (2026-09-24) à partir des données
 * déjà exposées par le backend — aucun endpoint dédié. Fonctions pures :
 * `aujourdhui` est un paramètre pour que le résultat soit reproductible.
 *
 * Règles de couleur :
 *  - Documents : expiré ou obligatoire absent = alerte ; expire dans
 *    SEUIL_DOCUMENT_JOURS jours = avertissement ; valide ou sans date = OK.
 *  - Entretien : statut calculé par le backend (EcheanceEntretien) —
 *    EN_RETARD = alerte, BIENTOT = avertissement, A_JOUR = OK,
 *    A_RENSEIGNER = non renseigné.
 *  - Sécurité / outils : absent = alerte ; présent mais contrôle de plus de
 *    ANCIENNETE_CONTROLE_JOURS jours = avertissement ; présent = OK ; jamais
 *    contrôlé = non renseigné.
 *  - Alertes : alertes non traitées de l'engin, UNE ligne par type (alertes
 *    répétées synthétisées : nombre, depuis quand — alertes-groupees.ts), à la
 *    priorité la plus haute du type (ELEVEE/CRITIQUE = alerte, FAIBLE/MOYENNE
 *    = avertissement), engin en panne = alerte, maintenance en cours = avertissement.
 *
 * Localisation (ex « Emplacement du jour ») et conducteur : voir bloc-emplacement.ts et bloc-conducteur.ts ;
 * ordre d'affichage des blocs : assembler-rapport.ts.
 */
export const SEUIL_DOCUMENT_JOURS = 30;
export const ANCIENNETE_CONTROLE_JOURS = 180;

/** Documents dont l'absence est une alerte ; les autres sont facultatifs. */
const DOCUMENTS_OBLIGATOIRES_VEHICULE: TypeDocument[] = ["ASSURANCE", "VISITE_TECHNIQUE", "CARTE_GRISE"];
const DOCUMENTS_OBLIGATOIRES_CHANTIER: TypeDocument[] = ["ASSURANCE"];
/** Documents facultatifs signalés en note quand ils manquent. */
const DOCUMENTS_FACULTATIFS_VEHICULE: TypeDocument[] = ["CONFORMITE_FISCALE", "LICENCE_TRANSPORT", "CARTE_CARBURANT"];
const DOCUMENTS_FACULTATIFS_CHANTIER: TypeDocument[] = ["CONFORMITE_FISCALE", "CARTE_CARBURANT"];

const NIVEAU_ECHEANCE: Record<StatutEcheance, NiveauRapport> = {
  A_JOUR: "ok",
  A_RENSEIGNER: "inconnu",
  BIENTOT: "avertissement",
  EN_RETARD: "alerte",
};

export const NIVEAU_PRIORITE: Record<PrioriteAlerte, NiveauRapport> = {
  FAIBLE: "avertissement",
  MOYENNE: "avertissement",
  ELEVEE: "alerte",
  CRITIQUE: "alerte",
};

/** Données sources ; `null` = source indisponible (droits insuffisants, erreur réseau). */
export interface SourcesRapport {
  engin: Engin;
  documents: Document[] | null;
  alertes: Alerte[] | null;
  maintenances: Maintenance[] | null;
  echeances: EcheanceEntretien[] | null;
  equipements: EquipementBord[] | null;
  aujourdhui: Date;
}

// --- Outils -----------------------------------------------------------------

/** Nombre de jours calendaires de `aujourdhui` à `dateIso` (négatif si passé). Lit « yyyy-MM-dd » ou un date-heure ISO. */
export function joursJusqua(dateIso: string, aujourdhui: Date): number {
  const [annee, mois, jour] = dateIso.slice(0, 10).split("-").map(Number);
  const cible = Date.UTC(annee, mois - 1, jour);
  const reference = Date.UTC(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  return Math.round((cible - reference) / 86_400_000);
}

export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${n} ${n > 1 ? plurielForme : singulier}`;
}

/** « 4 OK · 1 à surveiller · 1 en alerte · 2 non renseignés ». */
export function resumeParNiveau(lignes: LigneRapport[]): string {
  const compte = (n: NiveauRapport) => lignes.filter((l) => l.niveau === n).length;
  const morceaux: string[] = [];
  if (compte("ok")) morceaux.push(`${compte("ok")} OK`);
  if (compte("avertissement")) morceaux.push(`${compte("avertissement")} à surveiller`);
  if (compte("alerte")) morceaux.push(`${compte("alerte")} en alerte`);
  if (compte("inconnu")) morceaux.push(pluriel(compte("inconnu"), "non renseigné"));
  return morceaux.join(" · ");
}

export function blocIndisponible(cle: string, famille: FamilleBloc, titre: string): BlocRapport {
  return {
    cle,
    famille,
    titre,
    niveau: "inconnu",
    resume: "Données indisponibles (accès refusé ou erreur de chargement).",
    lignes: [],
    indisponible: true,
  };
}

// --- Documents --------------------------------------------------------------

/**
 * Niveau d'une date d'expiration (document du véhicule, permis du
 * conducteur) : expirée = alerte, dans SEUIL_DOCUMENT_JOURS jours ou moins =
 * avertissement, sinon OK.
 */
export function niveauExpiration(dateExpiration: string, aujourdhui: Date): { niveau: NiveauRapport; detail: string } {
  const jours = joursJusqua(dateExpiration, aujourdhui);
  const date = formatDate(dateExpiration.slice(0, 10));
  if (jours < 0) return { niveau: "alerte", detail: `Expiré le ${date}` };
  if (jours <= SEUIL_DOCUMENT_JOURS) {
    const delai = jours === 0 ? "aujourd'hui" : `dans ${pluriel(jours, "jour")}`;
    return { niveau: "avertissement", detail: `Expire le ${date} (${delai})` };
  }
  return { niveau: "ok", detail: `Valide jusqu'au ${date}` };
}

export function niveauDocument(document: Document, aujourdhui: Date): { niveau: NiveauRapport; detail: string } {
  if (!document.dateExpiration) return { niveau: "ok", detail: "Sans date d'expiration" };
  return niveauExpiration(document.dateExpiration, aujourdhui);
}

export function blocDocuments(sources: SourcesRapport): BlocRapport {
  const titre = "Documents";
  if (sources.documents === null) return blocIndisponible("documents", "documents", titre);

  const { engin, aujourdhui } = sources;
  const chantier = engin.typeEngin.categorie === "ENGIN_CHANTIER";
  const obligatoires = chantier ? DOCUMENTS_OBLIGATOIRES_CHANTIER : DOCUMENTS_OBLIGATOIRES_VEHICULE;
  const facultatifs = chantier ? DOCUMENTS_FACULTATIFS_CHANTIER : DOCUMENTS_FACULTATIFS_VEHICULE;

  const documentsEngin = sources.documents.filter(
    (d) => d.actif && d.engin?.idEngin === engin.idEngin && d.type !== "PERMIS_CONDUIRE",
  );
  // Une seule ligne par type (la version la plus récente), sauf AUTRE où chaque document compte.
  const parType = new Map<string, Document>();
  for (const d of documentsEngin) {
    const cle = d.type === "AUTRE" ? `AUTRE-${d.idDocument}` : d.type;
    const existant = parType.get(cle);
    if (!existant || d.version > existant.version) parType.set(cle, d);
  }

  const lignes: LigneRapport[] = [];
  for (const type of obligatoires) {
    if (!parType.has(type)) {
      lignes.push({ cle: `absent-${type}`, libelle: LIBELLES_TYPE_DOCUMENT[type], niveau: "alerte", detail: "Absent" });
    }
  }
  for (const [cle, document] of parType) {
    const { niveau, detail } = niveauDocument(document, aujourdhui);
    const reference = document.numeroReference ? ` — n° ${document.numeroReference}` : "";
    lignes.push({ cle, libelle: LIBELLES_TYPE_DOCUMENT[document.type], niveau, detail: `${detail}${reference}` });
  }

  const facultatifsManquants = facultatifs.filter((t) => !parType.has(t)).map((t) => LIBELLES_TYPE_DOCUMENT[t]);
  return {
    cle: "documents",
    famille: "documents",
    titre,
    niveau: niveauLePlusGrave(lignes.map((l) => l.niveau)),
    resume: lignes.length > 0 ? resumeParNiveau(lignes) : "Aucun document enregistré.",
    lignes,
    note: facultatifsManquants.length > 0 ? `Non enregistrés (facultatifs) : ${facultatifsManquants.join(", ")}.` : undefined,
  };
}

// --- Éléments de bord -------------------------------------------------------

export function niveauEquipement(
  equipement: EquipementBord,
  aujourdhui: Date,
): { niveau: NiveauRapport; detail: string } {
  const observation = equipement.observation ? ` — ${equipement.observation}` : "";
  if (equipement.present === null) return { niveau: "inconnu", detail: "Jamais contrôlé" };
  if (!equipement.present) return { niveau: "alerte", detail: `Absent${observation}` };
  if (equipement.dateControle && joursJusqua(equipement.dateControle, aujourdhui) < -ANCIENNETE_CONTROLE_JOURS) {
    return {
      niveau: "avertissement",
      detail: `Présent — contrôle du ${formatDate(equipement.dateControle.slice(0, 10))}, à refaire${observation}`,
    };
  }
  return { niveau: "ok", detail: `Présent${observation}` };
}

/** Une ligne de synthèse par catégorie, dans l'ordre d'affichage. */
const SYNTHESES_EQUIPEMENTS: { categorie: CategorieElementBord; libelle: string }[] = [
  { categorie: "SECURITE", libelle: "Pharmacie et sécurité" },
  { categorie: "OUTIL", libelle: "Boîte à outils" },
];

/**
 * Éléments de sécurité et boîte à outils réunis dans une seule carte
 * (2026-09-24), réduite le 2026-09-25 à DEUX lignes de synthèse (« on
 * affiche juste la pharmacie et la boîte à outils, et c'est le niveau
 * d'alerte en couleur qui s'affiche ») : chaque ligne prend le niveau de son
 * élément le plus grave et résume les autres ; le détail élément par
 * élément est dans la page historique (onglet « Sécurité et outils »).
 */
export function blocEquipementsBord(sources: SourcesRapport): BlocRapport {
  const titre = "Sécurité et boîte à outils";
  const { equipements } = sources;
  if (equipements === null) return blocIndisponible("equipements", "equipements", titre);

  const lignes: LigneRapport[] = [];
  for (const { categorie, libelle } of SYNTHESES_EQUIPEMENTS) {
    const elements = equipements
      .filter((e) => e.categorie === categorie)
      .map<LigneRapport>((e) => ({
        cle: String(e.idElementBord),
        libelle: e.libelle,
        ...niveauEquipement(e, sources.aujourdhui),
      }));
    if (elements.length === 0) continue;
    lignes.push({
      cle: categorie,
      libelle,
      niveau: niveauLePlusGrave(elements.map((l) => l.niveau)),
      detail: `${pluriel(elements.length, "élément")} — ${resumeParNiveau(elements)}`,
    });
  }
  const dernierControle =
    equipements
      .map((e) => e.dateControle)
      .filter((d): d is string => d != null)
      .sort()
      .pop() ?? null;

  let resume: string;
  if (lignes.length === 0) resume = "Aucun élément ne s'applique à ce véhicule.";
  else if (!dernierControle) resume = "Jamais contrôlé.";
  else resume = `Dernier contrôle le ${formatDate(dernierControle.slice(0, 10))}`;

  return {
    cle: "equipements",
    famille: "equipements",
    titre,
    niveau: niveauLePlusGrave(lignes.map((l) => l.niveau)),
    resume,
    lignes,
  };
}

// --- Alertes, panne, maintenance --------------------------------------------

export function blocAlertes(sources: SourcesRapport): BlocRapport {
  const titre = "Alertes et maintenance";
  if (sources.alertes === null && sources.maintenances === null) {
    return blocIndisponible("alertes", "alertes", titre);
  }
  const { engin } = sources;
  const lignes: LigneRapport[] = [];

  if (engin.statut === "EN_PANNE") {
    lignes.push({ cle: "panne", libelle: "Véhicule en panne", niveau: "alerte", detail: "Statut actuel du véhicule" });
  }
  // Une ligne par TYPE d'alerte, pas par alerte : un GPS qui alerte toutes les 15 min
  // donne « … (×96) — depuis le … » (voir alertes-groupees.ts, 2026-09-28).
  for (const groupe of grouperAlertesDuVehicule(sources.alertes ?? [], engin.idEngin)) {
    lignes.push({
      cle: `alerte-${groupe.type}`,
      libelle: libelleGroupe(groupe),
      niveau: NIVEAU_PRIORITE[groupe.prioriteMax],
      detail: detailGroupe(groupe),
    });
  }
  for (const maintenance of sources.maintenances ?? []) {
    if (maintenance.engin?.idEngin !== engin.idEngin || maintenance.statut === "TERMINEE") continue;
    const enCours = maintenance.statut === "EN_COURS";
    const date = maintenance.dateDebut ? ` ${enCours ? "depuis" : "le"} ${formatDate(maintenance.dateDebut.slice(0, 10))}` : "";
    const objet = objetMaintenance(maintenance);
    lignes.push({
      cle: `maintenance-${maintenance.idMaintenance}`,
      libelle: enCours ? "Maintenance en cours" : "Maintenance planifiée",
      niveau: enCours ? "avertissement" : "ok",
      detail: `${libelleEnum(maintenance.type)}${date}${objet ? ` — ${objet}` : ""}`,
    });
  }

  const partiel = sources.alertes === null || sources.maintenances === null;
  return {
    cle: "alertes",
    famille: "alertes",
    titre,
    niveau: niveauLePlusGrave(
      lignes.map((l) => l.niveau),
      partiel ? "inconnu" : "ok",
    ),
    resume: lignes.length > 0 ? resumeParNiveau(lignes) : "Aucune alerte active ni maintenance en cours.",
    lignes,
    note: partiel
      ? sources.alertes === null
        ? "Alertes indisponibles pour votre profil."
        : "Maintenances indisponibles pour votre profil."
      : undefined,
  };
}

// --- Entretien périodique ---------------------------------------------------

/**
 * Un poste d'entretien = une ligne de la carte « Entretien périodique »
 * (regroupement demandé le 2026-09-24 : avant, une carte par poste).
 */
export function ligneEcheance(echeance: EcheanceEntretien): LigneRapport {
  const niveau = NIVEAU_ECHEANCE[echeance.statut];
  const observation = echeance.observation ? ` — ${echeance.observation}` : "";
  if (echeance.statut === "A_RENSEIGNER") {
    return {
      cle: `poste-${echeance.idPosteEntretien}`,
      libelle: echeance.libelle,
      niveau,
      detail: `À renseigner : dernière intervention à saisir sur la fiche${observation}`,
    };
  }
  const prochaine = decrireEcheance(echeance.prochaineDate, echeance.prochainCompteur, echeance.uniteCompteur);
  const derniere: string[] = [];
  if (echeance.dateDerniereIntervention) derniere.push(`le ${formatDate(echeance.dateDerniereIntervention)}`);
  if (echeance.compteurDerniereIntervention != null) {
    derniere.push(`à ${formatNombre(echeance.compteurDerniereIntervention)} ${echeance.uniteCompteur}`);
  }
  const suite = prochaine ? `prochaine échéance ${prochaine}` : "échéance non calculable";
  const rappel = derniere.length > 0 ? ` (dernière ${derniere.join(" ")})` : "";
  return {
    cle: `poste-${echeance.idPosteEntretien}`,
    libelle: echeance.libelle,
    niveau,
    detail: `${LIBELLES_STATUT_ECHEANCE[echeance.statut]} — ${suite}${rappel}${observation}`,
  };
}

export function blocEntretien(sources: SourcesRapport): BlocRapport {
  const titre = "Entretien périodique";
  if (sources.echeances === null) return blocIndisponible("entretien", "entretien", titre);
  const lignes = sources.echeances.map(ligneEcheance);
  return {
    cle: "entretien",
    famille: "entretien",
    titre,
    niveau: niveauLePlusGrave(lignes.map((l) => l.niveau)),
    resume:
      lignes.length > 0
        ? `${pluriel(lignes.length, "poste")} — ${resumeParNiveau(lignes)}`
        : "Aucun poste d'entretien ne s'applique (voir « Listes de la fiche »).",
    lignes,
  };
}
