import { formatDate, formatDateTime } from "@/lib/utils";
import type { AffectationChantier } from "@/types/chantier";
import type { Engin } from "@/types/engin";
import type { Mission } from "@/types/mission";
import { blocIndisponible, joursJusqua } from "@/features/rapport-engin/construire-rapport";
import { niveauLePlusGrave, type BlocRapport, type LigneRapport, type NiveauRapport } from "@/features/rapport-engin/niveaux";

/**
 * Carte « Localisation » du rapport véhicule (titre « Emplacement du jour »
 * jusqu'au 2026-09-28 ; la carte GPS du véhicule y est affichée par
 * CarteLocalisationGps, voir RapportEnginPage) : où se trouve le
 * véhicule AUJOURD'HUI, pour ne pas confondre (demande de l'utilisateur :
 * « emplacement de ce jour, ex. chantier A ou SIÈGE »). Une seule ligne,
 * dans cet ordre de priorité (2026-09-25) :
 *  1. en mission — mission en cours, ou planifiée et couvrant aujourd'hui ;
 *  2. sur un chantier — période du véhicule sur le chantier couvrant
 *     aujourd'hui (dateDebutPrevue / dateFinPrevue du rattachement) ;
 *  3. au siège — avec le prochain départ (mission ou chantier) s'il y en a.
 * Le détail (passé, à venir) est dans la page historique.
 *
 * Couleurs : vert = situation normale ; jaune = mission en cours dont le
 * retour prévu est dépassé ; rouge = véhicule en panne alors qu'une mission
 * ou un chantier l'attend.
 * Ignorés : missions terminées / annulées, rattachements terminés ou annulés,
 * chantiers terminés ou annulés, périodes déjà passées.
 */
export const LIBELLE_SIEGE = "Siège";

export interface SourcesEmplacement {
  engin: Engin;
  /** Rattachements de tous les chantiers (filtrés ici sur le véhicule) ; null = indisponibles. */
  rattachements: AffectationChantier[] | null;
  /** Missions de tout le parc (filtrées ici) ; null = indisponibles (la carte se base alors sur les chantiers). */
  missions: Mission[] | null;
  aujourdhui: Date;
}

function avecLieu(r: AffectationChantier, texte: string): string {
  return r.chantier.lieu ? `${texte} — ${r.chantier.lieu}` : texte;
}

/** Prochain départ (mission ou chantier), le plus proche en date. */
interface Depart {
  type: "mission" | "chantier";
  debut: string;
  texte: string;
}

export function blocEmplacement({ engin, rattachements, missions, aujourdhui }: SourcesEmplacement): BlocRapport {
  const titre = "Localisation";
  if (rattachements === null) return blocIndisponible("emplacement", "emplacement", titre);

  const chantiers = rattachements
    .filter(
      (r) =>
        r.statut === "ACTIVE" &&
        r.engin.idEngin === engin.idEngin &&
        r.chantier.statut !== "TERMINE" &&
        r.chantier.statut !== "ANNULE" &&
        joursJusqua(r.dateFinPrevue, aujourdhui) >= 0,
    )
    .sort((a, b) => a.dateDebutPrevue.localeCompare(b.dateDebutPrevue));
  const chantiersDuJour = chantiers.filter((r) => joursJusqua(r.dateDebutPrevue, aujourdhui) <= 0);
  const chantiersAVenir = chantiers.filter((r) => joursJusqua(r.dateDebutPrevue, aujourdhui) > 0);

  const missionsActives = (missions ?? [])
    .filter((m) => m.engin.idEngin === engin.idEngin && (m.statut === "EN_COURS" || m.statut === "PLANIFIEE"))
    .sort((a, b) => a.dateDebutPrevue.localeCompare(b.dateDebutPrevue));
  const missionDuJour =
    missionsActives.find((m) => m.statut === "EN_COURS") ??
    missionsActives.find(
      (m) => joursJusqua(m.dateDebutPrevue, aujourdhui) <= 0 && joursJusqua(m.dateFinPrevue, aujourdhui) >= 0,
    );
  const missionsAVenir = missionsActives.filter((m) => m !== missionDuJour && joursJusqua(m.dateDebutPrevue, aujourdhui) > 0);

  const enPanne = engin.statut === "EN_PANNE";
  const panne = enPanne ? "Véhicule en panne — " : "";

  let ligne: LigneRapport;
  let departCite: Depart["type"] | null = null;
  if (missionDuJour) {
    const retard = missionDuJour.statut === "EN_COURS" && joursJusqua(missionDuJour.dateFinPrevue, aujourdhui) < 0;
    const niveau: NiveauRapport = enPanne ? "alerte" : retard ? "avertissement" : "ok";
    const conducteur = missionDuJour.conducteur ? ` — ${missionDuJour.conducteur.prenom} ${missionDuJour.conducteur.nom}` : "";
    ligne = {
      cle: "mission",
      libelle: `En mission : ${missionDuJour.motif}`,
      niveau,
      detail:
        panne +
        (missionDuJour.statut === "EN_COURS" ? "" : "départ prévu aujourd'hui, ") +
        `${retard ? "retour prévu dépassé" : "retour prévu"} le ${formatDateTime(missionDuJour.dateFinPrevue)}${conducteur}`,
    };
  } else if (chantiersDuJour.length > 0) {
    ligne = {
      cle: "jour",
      libelle: chantiersDuJour.map((r) => r.chantier.nom).join(" · "),
      niveau: enPanne ? "alerte" : "ok",
      detail: panne + chantiersDuJour.map((r) => avecLieu(r, `jusqu'au ${formatDate(r.dateFinPrevue.slice(0, 10))}`)).join(" · "),
    };
  } else {
    const departs: Depart[] = [
      ...missionsAVenir.map<Depart>((m) => ({
        type: "mission",
        debut: m.dateDebutPrevue.slice(0, 10),
        texte: `prochaine mission : ${m.motif} le ${formatDate(m.dateDebutPrevue.slice(0, 10))}`,
      })),
      ...chantiersAVenir.map<Depart>((r) => ({
        type: "chantier",
        debut: r.dateDebutPrevue.slice(0, 10),
        texte: `prochain chantier : ${r.chantier.nom} le ${formatDate(r.dateDebutPrevue.slice(0, 10))}`,
      })),
    ].sort((a, b) => a.debut.localeCompare(b.debut));
    const prochain = departs[0];
    departCite = prochain?.type ?? null;
    ligne = {
      cle: "siege",
      libelle: LIBELLE_SIEGE,
      // Au siège, la panne n'est une alerte ici que si une mission ou un chantier attend le véhicule.
      niveau: enPanne && prochain ? "alerte" : "ok",
      detail: prochain ? (enPanne ? panne : "") + prochain.texte : "Aucune mission ni chantier prévu",
    };
  }

  // Résumé : ce qui reste prévu après la ligne affichée (le départ déjà cité n'est pas recompté).
  const autresMissions = missionsAVenir.length - (departCite === "mission" ? 1 : 0);
  const autresChantiers = chantiersAVenir.length - (departCite === "chantier" ? 1 : 0);
  const morceaux: string[] = [];
  if (autresMissions > 0) morceaux.push(autresMissions === 1 ? "1 mission" : `${autresMissions} missions`);
  if (autresChantiers > 0) morceaux.push(autresChantiers === 1 ? "1 chantier" : `${autresChantiers} chantiers`);
  const resume = morceaux.length > 0 ? `À venir ensuite : ${morceaux.join(", ")}` : "Aucune autre affectation prévue";

  return {
    cle: "emplacement",
    famille: "emplacement",
    titre,
    niveau: niveauLePlusGrave([ligne.niveau]),
    resume,
    lignes: [ligne],
    note: missions === null ? "Missions indisponibles pour votre profil." : undefined,
  };
}
