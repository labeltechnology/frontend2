import { useEffect } from "react";
import { CANAUX } from "@/lib/temps-reel/canaux";
import type { EvenementChangement } from "@/lib/temps-reel/protocole";

/**
 * Objets en cours de modification dans cet onglet (2026-09-29) : un
 * formulaire ouvert sur un véhicule, un chantier… Si un autre utilisateur
 * (ou un autre onglet) modifie le même objet pendant ce temps, l'écran
 * prévient (avis « modifié par un autre ») au lieu de laisser écraser son
 * travail sans le savoir.
 */
const enEdition = new Map<string, number>();

const cle = (canal: string, id: number) => `${canal}#${id}`;

export function commencerEdition(canal: string, id: number): () => void {
  const k = cle(canal, id);
  enEdition.set(k, (enEdition.get(k) ?? 0) + 1);
  return () => {
    const n = (enEdition.get(k) ?? 1) - 1;
    if (n <= 0) enEdition.delete(k);
    else enEdition.set(k, n);
  };
}

export function estEnEdition(canal: string, id: number): boolean {
  return enEdition.has(cle(canal, id));
}

/** Déclare l'objet en cours de modification tant que le formulaire est affiché (id absent = création). */
export function useEditionEnCours(canal: string, id: number | null | undefined): void {
  useEffect(() => {
    if (id === null || id === undefined) return undefined;
    return commencerEdition(canal, id);
  }, [canal, id]);
}

export interface Avis {
  titre: string;
  description: string;
}

/**
 * Avis à afficher pour un changement reçu, ou null : seulement pour un objet
 * en cours de modification ici, modifié ou supprimé ailleurs (autre personne,
 * autre onglet, ou tâche du serveur).
 */
export function avisModificationConcurrente(
  evenement: EvenementChangement,
  idOnglet: string,
  idUtilisateur: number | undefined,
  enCours: (canal: string, id: number) => boolean = estEnEdition,
): Avis | null {
  if (evenement.id === null || evenement.operation === "CREE") return null;
  if (evenement.onglet !== null && evenement.onglet === idOnglet) return null;
  if (!enCours(evenement.canal, evenement.id)) return null;
  const libelle = CANAUX[evenement.canal]?.libelle ?? "Cet élément";
  const feminin = libelle.startsWith("Cette");
  const action = evenement.operation === "SUPPRIME" ? (feminin ? "supprimée" : "supprimé") : feminin ? "modifiée" : "modifié";
  const auteur = !evenement.auteur
    ? "le serveur"
    : evenement.auteur.id === idUtilisateur
      ? "vous, dans un autre onglet"
      : (evenement.auteur.nom ?? "un autre utilisateur");
  return {
    titre: `${libelle} vient d'être ${action} par ${auteur}.`,
    description:
      evenement.operation === "SUPPRIME"
        ? "Vos modifications en cours ne pourront pas être enregistrées."
        : "Enregistrer maintenant écraserait ses changements : fermez puis rouvrez pour voir la nouvelle version.",
  };
}
