import { peut } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";
import type { IdRubriqueAide, PageAide, PageGuide, RubriqueAide, SectionAide } from "@/types/aide";

/**
 * Règles pures du centre d'aide (2026-09-28) : navigation dans
 * l'arborescence, aide contextuelle par écran, filtrage par rôle, et
 * contrôle des règles de la méthode (arborescence et rédaction), testées.
 */

export interface PagePlacee {
  page: PageAide;
  rubrique: RubriqueAide;
  section: SectionAide | null;
}

export function toutesLesPages(centre: readonly RubriqueAide[]): PagePlacee[] {
  return centre.flatMap((rubrique) => [
    ...rubrique.pages.map((page) => ({ page, rubrique, section: null })),
    ...rubrique.sections.flatMap((section) => section.pages.map((page) => ({ page, rubrique, section }))),
  ]);
}

export function indexerPages(centre: readonly RubriqueAide[]): Map<string, PagePlacee> {
  return new Map(toutesLesPages(centre).map((p) => [p.page.id, p]));
}

/** La page est-elle faisable par ce rôle ? (page sans capacité : oui) */
export function accessible(page: PageAide, role: RoleLibelle | undefined): boolean {
  return !page.capacite || peut(role, page.capacite);
}

/** « /engins/:id/rapport » → expression qui reconnaît « /engins/12/rapport ». */
function motifEcran(ecran: string): RegExp {
  const echappe = ecran
    .split("/")
    .map((morceau) => (morceau.startsWith(":") ? "[^/]+" : morceau.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${echappe}/?$`);
}

/**
 * Aide contextuelle (étape 6) : pages liées à l'écran affiché, guides
 * d'abord (priorité haute en tête), puis dépannage.
 */
export function pagesPourChemin(centre: readonly RubriqueAide[], chemin: string): PagePlacee[] {
  const ordreType: Record<PageAide["type"], number> = {
    GUIDE: 0,
    TEXTE: 1,
    FAQ: 2,
    DEPANNAGE: 3,
    REFERENCE: 4,
    NOUVEAUTES: 5,
    SUIVI: 6,
  };
  const ordrePriorite = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };
  return toutesLesPages(centre)
    .filter(({ page }) => page.ecrans?.some((ecran) => motifEcran(ecran).test(chemin)))
    .sort(
      (a, b) =>
        ordreType[a.page.type] - ordreType[b.page.type] ||
        (a.page.type === "GUIDE" && b.page.type === "GUIDE" ? ordrePriorite[a.page.priorite] - ordrePriorite[b.page.priorite] : 0),
    );
}

const ORDRE_FREQUENCE = { QUOTIDIENNE: 0, HEBDOMADAIRE: 1, MENSUELLE: 2, OCCASIONNELLE: 3 };

/** Tâches les plus utiles pour ce rôle (accueil) : priorité haute, les plus fréquentes d'abord. */
export function tachesPrioritaires(centre: readonly RubriqueAide[], role: RoleLibelle | undefined, nombre = 6): PageGuide[] {
  return toutesLesPages(centre)
    .map((p) => p.page)
    .filter((page): page is PageGuide => page.type === "GUIDE" && page.priorite === "HAUTE" && accessible(page, role))
    .sort((a, b) => ORDRE_FREQUENCE[a.frequence] - ORDRE_FREQUENCE[b.frequence] || a.titre.localeCompare(b.titre, "fr"))
    .slice(0, nombre);
}

/** Pages dont la révision date de plus de {@code jours} (suivi de l'aide). */
export function pagesARelire(centre: readonly RubriqueAide[], aujourdhui: Date, jours: number): PageAide[] {
  const limite = aujourdhui.getTime() - jours * 86_400_000;
  return toutesLesPages(centre)
    .map((p) => p.page)
    .filter((page) => new Date(`${page.revision}T00:00:00`).getTime() < limite);
}

export function rubriqueParId(centre: readonly RubriqueAide[], id: IdRubriqueAide): RubriqueAide | undefined {
  return centre.find((r) => r.id === id);
}

// --- Contrôle des règles de la méthode (étapes 3 et 4) ---

export const MAX_ELEMENTS_PAR_NIVEAU = 7;
export const MAX_MOTS_PAR_ETAPE = 20;
export const MAX_CARACTERES_REPONSE_FAQ = 330;

const ID_PAGE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FICHIER_CAPTURE = /^[a-z0-9]+(-[a-z0-9]+)*\.(png|jpg|gif|webp)$/;
/** Titre qui commence par un verbe à l'infinitif (« Planifier… », « Se connecter… »). */
const VERBE_INFINITIF = /^(se |s')?[a-zàâçéèêëîïôûùüÿœ]+(er|ir|re|oir)\b/i;

export function motsDe(texte: string): number {
  return texte.replace(/\*\*/g, "").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Liste des manquements aux règles : identifiants, arborescence (3 niveaux,
 * 7 éléments au plus par niveau), titres, modèle des guides, FAQ, dépannage,
 * liens « Voir aussi » et schémas. Vide = le centre d'aide est conforme.
 */
export function verifierCentreAide(centre: readonly RubriqueAide[], schemasConnus: ReadonlySet<string>): string[] {
  const problemes: string[] = [];
  const pages = toutesLesPages(centre);
  const ids = new Set<string>();

  if (centre.length > MAX_ELEMENTS_PAR_NIVEAU) problemes.push(`Trop de rubriques : ${centre.length}`);
  for (const rubrique of centre) {
    if (rubrique.sections.length > MAX_ELEMENTS_PAR_NIVEAU) problemes.push(`${rubrique.titre} : trop de sections`);
    if (rubrique.pages.length > MAX_ELEMENTS_PAR_NIVEAU) problemes.push(`${rubrique.titre} : trop de pages`);
    for (const section of rubrique.sections) {
      if (section.pages.length > MAX_ELEMENTS_PAR_NIVEAU) problemes.push(`${section.titre} : trop de pages`);
      if (section.pages.length === 0) problemes.push(`${section.titre} : section vide`);
    }
  }

  for (const { page } of pages) {
    const ref = `« ${page.titre} »`;
    if (!ID_PAGE.test(page.id)) problemes.push(`${ref} : identifiant invalide ${page.id}`);
    if (ids.has(page.id)) problemes.push(`${ref} : identifiant en double ${page.id}`);
    ids.add(page.id);
    if (!DATE.test(page.revision)) problemes.push(`${ref} : date de révision invalide`);
    if (!page.resume.trim()) problemes.push(`${ref} : résumé vide`);
    for (const ecran of page.ecrans ?? []) {
      if (!ecran.startsWith("/")) problemes.push(`${ref} : écran invalide ${ecran}`);
    }
    if ((page.type === "GUIDE" || page.type === "TEXTE" || page.type === "REFERENCE") && !VERBE_INFINITIF.test(page.titre)) {
      problemes.push(`${ref} : le titre doit commencer par un verbe d'action`);
    }
    if ((page.type === "GUIDE" || page.type === "TEXTE") && page.schema && !schemasConnus.has(page.schema)) {
      problemes.push(`${ref} : schéma inconnu ${page.schema}`);
    }
    if ((page.type === "GUIDE" || page.type === "TEXTE") && page.captures) {
      for (const capture of page.captures) {
        if (!FICHIER_CAPTURE.test(capture.fichier)) problemes.push(`${ref} : nom de capture illisible ${capture.fichier}`);
        if (!capture.alt.trim()) problemes.push(`${ref} : texte alternatif manquant (${capture.fichier})`);
      }
    }
    if (page.type === "GUIDE") {
      if (!page.objectif.trim()) problemes.push(`${ref} : objectif manquant`);
      if (page.etapes.length === 0) problemes.push(`${ref} : aucune étape`);
      if (!page.resultat.trim()) problemes.push(`${ref} : résultat attendu manquant`);
      page.etapes.forEach((etape, i) => {
        if (motsDe(etape) > MAX_MOTS_PAR_ETAPE) problemes.push(`${ref} : étape ${i + 1} trop longue (${motsDe(etape)} mots)`);
      });
    }
    if (page.type === "FAQ" && page.reponse.length > MAX_CARACTERES_REPONSE_FAQ) {
      problemes.push(`${ref} : réponse trop longue (${page.reponse.length} caractères)`);
    }
    if (page.type === "DEPANNAGE" && (!page.cause.trim() || page.solution.length === 0)) {
      problemes.push(`${ref} : cause ou solution manquante`);
    }
  }

  for (const { page } of pages) {
    for (const cible of page.voirAussi ?? []) {
      if (!ids.has(cible)) problemes.push(`« ${page.titre} » : lien « Voir aussi » vers une page inconnue ${cible}`);
    }
  }
  return problemes;
}
