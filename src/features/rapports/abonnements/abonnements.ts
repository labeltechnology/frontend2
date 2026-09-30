import { CATALOGUE, type DefinitionRapport } from "@/features/rapports/catalogue";
import type { AbonnementRapport, EnvoiRapport, FrequenceEnvoi, ParametresEnvoiRapports } from "@/types/diffusion";
import type { TypeRapport } from "@/types/rapport";

/**
 * Règles d'affichage des abonnements aux rapports par e-mail (2026-09-29),
 * sans React. Miroir de diffusion/calcul/RapportsDiffusables : seuls les
 * rapports « tout le parc » (sans véhicule, conducteur ni chantier) se
 * reçoivent par abonnement.
 */
export const FREQUENCES: Record<FrequenceEnvoi, string> = {
  HEBDOMADAIRE: "Chaque semaine",
  MENSUELLE: "Chaque mois",
};

export const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function rapportsAbonnables(): DefinitionRapport[] {
  return CATALOGUE.filter((d) => d.cible === "AUCUNE");
}

/** « Chaque lundi à 7 h (semaine écoulée) » / « Le 1er de chaque mois à 7 h (mois écoulé) ». */
export function textePlanning(p: Pick<ParametresEnvoiRapports, "jourSemaine" | "jourMois" | "heure">, f: FrequenceEnvoi): string {
  if (f === "HEBDOMADAIRE") return `Chaque ${JOURS_SEMAINE[p.jourSemaine - 1]} à ${p.heure} h (semaine écoulée)`;
  const jour = p.jourMois === 1 ? "1er" : String(p.jourMois);
  return `Le ${jour} de chaque mois à ${p.heure} h (mois écoulé)`;
}

/** Abonnement existant pour un rapport et une fréquence. */
export function abonnementDe(liste: AbonnementRapport[], type: TypeRapport, f: FrequenceEnvoi): AbonnementRapport | undefined {
  return liste.find((a) => a.typeRapport === type && a.frequence === f);
}

/** Nombre d'abonnements actifs par fréquence (bouton « Envoyer maintenant »). */
export function actifsParFrequence(liste: AbonnementRapport[]): Record<FrequenceEnvoi, number> {
  return {
    HEBDOMADAIRE: liste.filter((a) => a.actif && a.frequence === "HEBDOMADAIRE").length,
    MENSUELLE: liste.filter((a) => a.actif && a.frequence === "MENSUELLE").length,
  };
}

/** Utilisateurs pouvant recevoir des rapports (miroir de EnvoiRapportsService.destinataireValide). */
export function destinatairesPossibles<U extends { idUtilisateur: number; statut: string; email: string; nom: string; prenom: string; role: { libelle: string } }>(
  utilisateurs: U[],
): U[] {
  return utilisateurs
    .filter((u) => u.statut === "ACTIF" && u.email.includes("@") && u.role.libelle !== "CONDUCTEUR")
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));
}

/** Envois d'un utilisateur (historique complet filtré côté écran pour l'administration). */
export function envoisDe(envois: EnvoiRapport[], idUtilisateur: number | null): EnvoiRapport[] {
  return idUtilisateur == null ? envois : envois.filter((e) => e.idUtilisateur === idUtilisateur);
}

/** « Semaine du 21/09 au 27/09/2026 », « Mois de août 2026 », « E-mail d'essai ». */
export function textePeriodeEnvoi(e: Pick<EnvoiRapport, "frequence" | "periodeDebut" | "periodeFin">): string {
  if (e.frequence === "TEST" || !e.periodeDebut || !e.periodeFin) return "E-mail d'essai";
  const [ad, md, jd] = e.periodeDebut.split("-");
  const [af, mf, jf] = e.periodeFin.split("-");
  if (e.frequence === "MENSUELLE") {
    const nom = new Date(Number(ad), Number(md) - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return `Mois de ${nom}`;
  }
  const debut = ad === af ? `${jd}/${md}` : `${jd}/${md}/${ad}`;
  return `Semaine du ${debut} au ${jf}/${mf}/${af}`;
}

/** Prochain envoi le plus proche parmi les abonnements actifs d'une fréquence. */
export function prochainEnvoi(liste: AbonnementRapport[], f: FrequenceEnvoi): string | null {
  const dates = liste.filter((a) => a.actif && a.frequence === f && a.prochainEnvoi).map((a) => a.prochainEnvoi as string);
  return dates.length === 0 ? null : dates.sort()[0];
}
