import type { QueryKey } from "@tanstack/react-query";
import { dejaAJour, dependDuCanal } from "@/lib/temps-reel/appliquer";
import { CANAUX, CANAUX_SANS_SYNTHESE, RACINES_SYNTHESE } from "@/lib/temps-reel/canaux";

export const DELAI_RELECTURE_CANAL_MS = 1_500;
export const DELAI_RELECTURE_SYNTHESE_MS = 10_000;

/**
 * Regroupe les relectures déclenchées par les changements reçus (2026-09-29) :
 * une rafale de changements sur un canal ne provoque qu'une relecture
 * (1,5 s après le premier), et les vues de synthèse ne sont relues qu'au
 * plus toutes les 10 s. Seules les requêtes affichées sont réellement
 * relues (comportement de react-query).
 */
export class PlanificateurRelectures {
  private readonly enAttente = new Map<string, { complete: boolean }>();
  private readonly minuteurs = new Map<string, ReturnType<typeof setTimeout>>();
  private minuteurSynthese: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly invalider: (predicat: (cle: QueryKey) => boolean) => void) {}

  /**
   * @param complete faux si les listes complètes et le détail viennent d'être
   *                 mis à jour avec les données reçues (inutile de les relire).
   */
  planifier(canal: string, complete: boolean): void {
    const def = CANAUX[canal];
    if (!def) return;
    const attente = this.enAttente.get(canal);
    if (attente) attente.complete ||= complete;
    else this.enAttente.set(canal, { complete });
    if (!this.minuteurs.has(canal)) {
      this.minuteurs.set(
        canal,
        setTimeout(() => this.relireCanal(canal), DELAI_RELECTURE_CANAL_MS),
      );
    }
    if (!CANAUX_SANS_SYNTHESE.has(canal) && this.minuteurSynthese === undefined) {
      this.minuteurSynthese = setTimeout(() => {
        this.minuteurSynthese = undefined;
        this.invalider((cle) => typeof cle[0] === "string" && RACINES_SYNTHESE.includes(cle[0]));
      }, DELAI_RELECTURE_SYNTHESE_MS);
    }
  }

  /** Relit tout ce qui dépend des canaux suivis (après une reconnexion). */
  toutRelire(): void {
    const racines = new Set(Object.values(CANAUX).flatMap((d) => d.racines));
    this.invalider((cle) => typeof cle[0] === "string" && racines.has(cle[0]));
  }

  arreter(): void {
    this.minuteurs.forEach((m) => clearTimeout(m));
    this.minuteurs.clear();
    this.enAttente.clear();
    clearTimeout(this.minuteurSynthese);
    this.minuteurSynthese = undefined;
  }

  private relireCanal(canal: string): void {
    this.minuteurs.delete(canal);
    const attente = this.enAttente.get(canal);
    this.enAttente.delete(canal);
    const def = CANAUX[canal];
    if (!def || !attente) return;
    this.invalider((cle) => dependDuCanal(def, cle) && (attente.complete || !dejaAJour(def, cle)));
  }
}
