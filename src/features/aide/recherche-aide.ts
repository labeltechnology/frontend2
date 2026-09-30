import type { PageAide } from "@/types/aide";
import type { PagePlacee } from "@/features/aide/centre-aide";

/**
 * Recherche du centre d'aide (étape 6 : barre de recherche visible) :
 * sans accents ni majuscules, tous les mots doivent être trouvés ; le titre
 * et les mots-clés comptent plus que le corps du texte.
 */
export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\*\*/g, "")
    .replace(/[’']/g, " ");
}

function corps(page: PageAide): string {
  switch (page.type) {
    case "GUIDE":
      return [page.objectif, ...page.etapes, page.resultat, ...(page.bonASavoir ?? [])].join(" ");
    case "TEXTE":
      return page.sections
        .flatMap((s) => [s.titre, ...(s.paragraphes ?? []), ...(s.liste ?? []), ...(s.tableau?.lignes.flat() ?? [])])
        .join(" ");
    case "FAQ":
      return page.reponse;
    case "DEPANNAGE":
      return [page.symptome, page.message ?? "", page.cause, ...page.solution].join(" ");
    case "REFERENCE":
      return page.articles.flatMap((a) => [a.titre, a.resume, ...a.fonctionnalites, ...a.reglesCles]).join(" ");
    case "NOUVEAUTES":
      return page.versions.flatMap((v) => [v.titre, ...v.points]).join(" ");
    case "SUIVI":
      return "";
  }
}

interface EntreeIndex {
  placee: PagePlacee;
  titre: string;
  motsCles: string;
  resume: string;
  corps: string;
}

export function indexerRecherche(pages: readonly PagePlacee[]): EntreeIndex[] {
  return pages.map((placee) => ({
    placee,
    titre: normaliser(placee.page.titre),
    motsCles: normaliser((placee.page.motsCles ?? []).join(" ")),
    resume: normaliser(placee.page.resume),
    corps: normaliser(corps(placee.page)),
  }));
}

/** Mots de 2 lettres et plus, sans mots vides fréquents. */
const MOTS_VIDES = new Set(["le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "au", "aux", "en", "je", "comment", "faire", "pour", "mon", "ma", "mes"]);

export function motsRecherche(requete: string): string[] {
  return normaliser(requete)
    .split(/[^a-z0-9%]+/)
    .filter((mot) => mot.length >= 2 && !MOTS_VIDES.has(mot));
}

/** À score égal, les tâches les plus importantes (étape 2) passent devant. */
function bonusPriorite(page: PageAide): number {
  if (page.type !== "GUIDE") return 0;
  return page.priorite === "HAUTE" ? 3 : page.priorite === "MOYENNE" ? 1 : 0;
}

export function rechercher(index: readonly EntreeIndex[], requete: string, limite = 20): PagePlacee[] {
  const mots = motsRecherche(requete);
  if (mots.length === 0) return [];
  const resultats: { placee: PagePlacee; score: number }[] = [];
  for (const entree of index) {
    let score = 0;
    let tousTrouves = true;
    for (const mot of mots) {
      const s =
        (entree.titre.includes(mot) ? 10 : 0) +
        (entree.motsCles.includes(mot) ? 6 : 0) +
        (entree.resume.includes(mot) ? 3 : 0) +
        (entree.corps.includes(mot) ? 1 : 0);
      if (s === 0) {
        tousTrouves = false;
        break;
      }
      score += s;
    }
    if (tousTrouves) resultats.push({ placee: entree.placee, score: score + bonusPriorite(entree.placee.page) });
  }
  return resultats
    .sort((a, b) => b.score - a.score || a.placee.page.titre.localeCompare(b.placee.page.titre, "fr"))
    .slice(0, limite)
    .map((r) => r.placee);
}
