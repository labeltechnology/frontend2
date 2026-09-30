import { estPleinComplet, libelleApprovisionnement } from "@/features/carburant/approvisionnement";
import { formatDate, formatMontant, formatNombre } from "@/lib/utils";
import type { Alerte } from "@/types/alerte";
import type { Carburant, ConsommationMoyenne } from "@/types/carburant";
import type { Engin } from "@/types/engin";
import { pleinsDuVehicule } from "@/features/historique-engin/historique";
import { blocIndisponible, pluriel } from "@/features/rapport-engin/construire-rapport";
import { niveauLePlusGrave, type BlocRapport, type LigneRapport } from "@/features/rapport-engin/niveaux";

/**
 * Carte « Carburant » du rapport véhicule (2026-09-25, demande de
 * l'utilisateur « ajouter card carburant et incident dans le rapport
 * véhicule »). Trois lignes :
 *  1. Dernier plein : date, litres, kilométrage, station.
 *  2. Consommation moyenne (L/100 km) — calculée par le serveur (règle 10.9,
 *     GET /api/carburant/engins/{id}/consommation-moyenne), pas recalculée ici.
 *  3. Dépense du mois en cours (Ar).
 *
 * Couleurs : rouge si une alerte « consommation anormale » du véhicule n'est
 * pas traitée (détectée par le serveur, règle 10.10) ; vert sinon ; gris si
 * aucun plein n'est enregistré ou si la moyenne ne peut pas être calculée
 * (moins de deux pleins).
 */
export interface SourcesCarburant {
  engin: Engin;
  /** Pleins de tout le parc (filtrés ici) ; null = indisponibles. */
  pleins: Carburant[] | null;
  /** Moyenne du serveur ; null = indisponible (erreur ou accès refusé). */
  consommation: ConsommationMoyenne | null;
  /** Alertes non traitées ; null = indisponibles (la ligne consommation n'est alors pas colorée par elles). */
  alertes: Alerte[] | null;
  aujourdhui: Date;
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function ligneDernierPlein(dernier: Carburant | undefined): LigneRapport {
  if (!dernier) return { cle: "dernier-plein", libelle: "Dernier plein", niveau: "inconnu", detail: "Aucun plein enregistré" };
  const station = dernier.station ? ` — ${dernier.station}` : "";
  const type = estPleinComplet(dernier) ? "" : ` (${libelleApprovisionnement(dernier.typeApprovisionnement).toLowerCase()})`;
  return {
    cle: "dernier-plein",
    libelle: "Dernier plein",
    niveau: "ok",
    detail: `Le ${formatDate(dernier.dateHeure.slice(0, 10))} : ${formatNombre(dernier.quantiteLitres, 1)} L${type} à ${formatNombre(dernier.kilometrageAuPlein)} km${station}`,
  };
}

function ligneConsommation(consommation: ConsommationMoyenne | null, anomalies: Alerte[]): LigneRapport {
  const base = { cle: "consommation", libelle: "Consommation moyenne" };
  const valeur =
    consommation && consommation.litresAux100Km > 0
      ? `${formatNombre(consommation.litresAux100Km, 1)} L/100 km sur ${pluriel(consommation.nombrePleinsConsideres, "plein")}`
      : null;
  if (anomalies.length > 0) {
    const derniere = anomalies[0];
    return {
      ...base,
      niveau: "alerte",
      detail: `${valeur ? valeur + " — " : ""}consommation anormale signalée le ${formatDate(derniere.dateCreation.slice(0, 10))}, non traitée`,
    };
  }
  if (consommation === null) return { ...base, niveau: "inconnu", detail: "Non disponible" };
  if (!valeur) return { ...base, niveau: "inconnu", detail: "Pas assez de pleins pour la calculer (2 minimum)" };
  return { ...base, niveau: "ok", detail: valeur };
}

function ligneDepenseMois(pleins: Carburant[], aujourdhui: Date): LigneRapport {
  const prefixe = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}`;
  const duMois = pleins.filter((p) => p.dateHeure.startsWith(prefixe));
  const total = duMois.reduce((somme, p) => somme + p.montantTotal, 0);
  const mois = `${MOIS[aujourdhui.getMonth()]} ${aujourdhui.getFullYear()}`;
  return {
    cle: "depense-mois",
    libelle: "Dépense du mois",
    niveau: "ok",
    detail: duMois.length === 0 ? `Aucun plein en ${mois}` : `${formatMontant(total)} — ${pluriel(duMois.length, "plein")} en ${mois}`,
  };
}

export function blocCarburant({ engin, pleins, consommation, alertes, aujourdhui }: SourcesCarburant): BlocRapport {
  const titre = "Carburant";
  if (pleins === null) return blocIndisponible("carburant", "carburant", titre);

  const duVehicule = pleinsDuVehicule(pleins, engin.idEngin);
  const anomalies = (alertes ?? [])
    .filter((a) => a.type === "CONSOMMATION_ANORMALE" && a.idEngin === engin.idEngin && !a.traitee)
    .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));

  const lignes = [ligneDernierPlein(duVehicule[0]), ligneConsommation(consommation, anomalies), ligneDepenseMois(duVehicule, aujourdhui)];
  const resume =
    duVehicule.length === 0
      ? "Aucun plein enregistré pour ce véhicule."
      : `${pluriel(duVehicule.length, "plein")} enregistré${duVehicule.length > 1 ? "s" : ""} — total ${formatMontant(duVehicule.reduce((s, p) => s + p.montantTotal, 0))}`;

  return {
    cle: "carburant",
    famille: "carburant",
    titre,
    // Sans aucun plein, la carte reste grise (rien à juger).
    niveau: duVehicule.length === 0 && anomalies.length === 0 ? "inconnu" : niveauLePlusGrave(lignes.map((l) => l.niveau)),
    resume,
    lignes,
  };
}
