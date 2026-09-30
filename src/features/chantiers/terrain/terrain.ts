import { normaliserNombre } from "@/lib/utils";
import type {
  EnregistrerMouvementRequest,
  EtatMateriel,
  MouvementMateriel,
  SourcePresence,
  StatutPresence,
  TypeMouvement,
} from "@/types/chantier";

/**
 * Terrain d'un chantier (V64, 2026-09-29) — logique pure : libellés et
 * couleurs de présence, taux, formulaire d'état des lieux (sortie / retour)
 * avec les mêmes contrôles que le serveur (ReglesMouvement), qui reste l'arbitre.
 */

export const LIBELLES_PRESENCE: Record<StatutPresence, string> = {
  PRESENT: "Sur le chantier",
  ABSENT: "Ailleurs",
  SANS_GPS: "Pas de données GPS",
  NON_LOCALISABLE: "Chantier non localisé",
};

export const CLASSE_PRESENCE: Record<StatutPresence, string> = {
  PRESENT: "bg-emerald-500",
  ABSENT: "bg-destructive",
  SANS_GPS: "bg-muted-foreground/40",
  NON_LOCALISABLE: "bg-amber-500",
};

export function libelleSource(source: SourcePresence, rayon: number): string {
  switch (source) {
    case "ZONES":
      return `Présence jugée sur les zones tracées du chantier (à ${rayon} m près des routes et locaux).`;
    case "RAYON":
      return `Présence jugée dans un rayon de ${rayon} m autour de la position du chantier.`;
    default:
      return "Chantier non localisé : placez-le sur la carte ou tracez ses zones pour suivre la présence GPS.";
  }
}

export function texteTaux(taux: number | null | undefined): string {
  return taux == null ? "—" : `${taux.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function classeTaux(taux: number | null | undefined): string {
  if (taux == null) return "text-muted-foreground";
  if (taux >= 80) return "text-emerald-600";
  if (taux >= 50) return "text-amber-600";
  return "text-destructive";
}

export const LIBELLES_ETAT: Record<EtatMateriel, string> = {
  BON: "Bon état",
  RESERVES: "Avec réserves",
  ENDOMMAGE: "Endommagé",
};

export const VARIANT_ETAT: Record<EtatMateriel, "success" | "warning" | "destructive"> = {
  BON: "success",
  RESERVES: "warning",
  ENDOMMAGE: "destructive",
};

export const MAX_PHOTOS_MOUVEMENT = 10;
export const JOURS_AVANT_DEBUT = 7;

/** Saisie du formulaire d'état des lieux (texte pour les nombres). */
export interface SaisieMouvement {
  dateHeure: string;
  kilometrage: string;
  compteurHoraire: string;
  niveauCarburant: string;
  etat: EtatMateriel;
  observations: string;
  manquants: string[];
  note: string;
  commentaireNote: string;
  declarerDegats: boolean;
  creerMaintenance: boolean;
}

/** « 2026-10-05T07:30 » en heure locale (champ datetime-local). */
export function dateHeureLocale(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function saisieMouvement(existant: MouvementMateriel | null, maintenant: Date): SaisieMouvement {
  const n = (v: number | null | undefined) => (v == null ? "" : String(v));
  return {
    dateHeure: existant ? existant.dateHeure.slice(0, 16) : dateHeureLocale(maintenant),
    kilometrage: n(existant?.kilometrage),
    compteurHoraire: n(existant?.compteurHoraire),
    niveauCarburant: n(existant?.niveauCarburant),
    etat: existant?.etat ?? "BON",
    observations: existant?.observations ?? "",
    manquants: existant?.elementsManquants ?? [],
    note: n(existant?.note),
    commentaireNote: existant?.commentaireNote ?? "",
    declarerDegats: false,
    creerMaintenance: false,
  };
}

/** Nombre saisi (virgule acceptée) ; null si vide, NaN si illisible. */
export function lireNombre(texte: string): number | null {
  const propre = normaliserNombre(texte);
  if (!propre) return null;
  const v = Number(propre);
  return Number.isFinite(v) ? v : Number.NaN;
}

function jourDe(dateHeure: string): string {
  return dateHeure.slice(0, 10);
}

function decaler(dateIso: string, jours: number): string {
  const [a, m, j] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j + jours)).toISOString().slice(0, 10);
}

/** Problème de saisie ; null si l'état des lieux peut être envoyé. */
export function problemeMouvement(
  s: SaisieMouvement,
  type: TypeMouvement,
  periode: { debut: string; fin: string },
  autre: MouvementMateriel | null,
  maintenant: Date,
): string | null {
  if (!s.dateHeure) return "Indiquez la date et l'heure.";
  if (s.dateHeure > dateHeureLocale(new Date(maintenant.getTime() + 10 * 60_000))) return "La date ne peut pas être dans le futur.";
  const jour = jourDe(s.dateHeure);
  if (type === "SORTIE") {
    if (jour < decaler(periode.debut, -JOURS_AVANT_DEBUT)) {
      return `La sortie a lieu plus de ${JOURS_AVANT_DEBUT} jours avant le début de la période du véhicule.`;
    }
    if (jour > periode.fin) return "La sortie a lieu après la fin de la période du véhicule.";
  } else if (jour < periode.debut) {
    return "Le retour a lieu avant le début de la période du véhicule.";
  }
  const km = lireNombre(s.kilometrage);
  const h = lireNombre(s.compteurHoraire);
  const carburant = lireNombre(s.niveauCarburant);
  const note = lireNombre(s.note);
  if (Number.isNaN(km) || Number.isNaN(h) || (km ?? 0) < 0 || (h ?? 0) < 0) return "Compteurs : nombres positifs.";
  if (carburant !== null && (Number.isNaN(carburant) || carburant < 0 || carburant > 100)) {
    return "Le niveau de carburant va de 0 à 100 %.";
  }
  if (note !== null && (type === "SORTIE" || !Number.isInteger(note) || note < 1 || note > 5)) {
    return type === "SORTIE" ? "La note se donne au retour." : "La note va de 1 à 5.";
  }
  if (s.declarerDegats && s.etat !== "ENDOMMAGE") return "Les dégâts se déclarent pour un véhicule endommagé.";
  if (s.creerMaintenance && s.etat === "BON") return "Une maintenance se crée pour un véhicule avec réserves ou endommagé.";
  if (autre) {
    const sortie = type === "SORTIE" ? { d: s.dateHeure, km, h } : { d: autre.dateHeure.slice(0, 16), km: autre.kilometrage, h: autre.compteurHoraire };
    const retour = type === "SORTIE" ? { d: autre.dateHeure.slice(0, 16), km: autre.kilometrage, h: autre.compteurHoraire } : { d: s.dateHeure, km, h };
    if (retour.d < sortie.d) return "Le retour ne peut pas précéder la sortie.";
    if (retour.km != null && sortie.km != null && retour.km < sortie.km) return "Le kilométrage du retour est inférieur à celui de la sortie.";
    if (retour.h != null && sortie.h != null && retour.h < sortie.h) return "Le compteur horaire du retour est inférieur à celui de la sortie.";
  }
  return null;
}

/** Corps envoyé (appeler seulement si problemeMouvement renvoie null). */
export function requeteMouvement(s: SaisieMouvement, type: TypeMouvement): EnregistrerMouvementRequest {
  return {
    dateHeure: `${s.dateHeure}:00`,
    kilometrage: lireNombre(s.kilometrage),
    compteurHoraire: lireNombre(s.compteurHoraire),
    niveauCarburant: lireNombre(s.niveauCarburant),
    etat: s.etat,
    observations: s.observations.trim() || undefined,
    elementsManquants: s.manquants.map((m) => m.trim()).filter(Boolean),
    note: type === "RETOUR" ? lireNombre(s.note) : null,
    commentaireNote: type === "RETOUR" ? s.commentaireNote.trim() || undefined : undefined,
    declarerDegats: type === "RETOUR" && s.declarerDegats,
    creerMaintenance: type === "RETOUR" && s.creerMaintenance,
  };
}

/** « 0 j », « 3 j », « En cours » (maintenance pas finie), « — » sans retour. */
export function libelleRemiseEnService(delai: number | null, retourFait: boolean): string {
  if (!retourFait) return "—";
  return delai == null ? "En cours" : `${delai} j`;
}
