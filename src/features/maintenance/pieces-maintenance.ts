import { normaliserNombre } from "@/lib/utils";
import type { DefinirCoutsGarageRequest, Piece, UtiliserPieceRequest } from "@/types/maintenance";

/**
 * Pièces et montants saisis dans « Faire la maintenance » (2026-09-25).
 * Fonctions pures. Deux cas, selon l'atelier :
 *  - atelier INTERNE : pièces du stock (quantité ; prix unitaire du stock ;
 *    le stock diminue) — POST /api/maintenances/{id}/pieces, une par ligne ;
 *  - GARAGE EXTERNE : lignes libres (désignation, quantité, prix unitaire)
 *    + main-d'œuvre ; coût total = pièces + main-d'œuvre —
 *    PUT /api/maintenances/{id}/couts-garage (V46).
 * Les champs restent en texte (saisie libre, virgule acceptée) et sont lus
 * par `lireNombre`.
 */

export interface LigneStockSaisie {
  cle: string;
  idPiece: string;
  quantite: string;
}

export interface LigneGarageSaisie {
  cle: string;
  designation: string;
  quantite: string;
  prixUnitaire: string;
}

let compteur = 0;
/** Clé React stable d'une nouvelle ligne. */
export function nouvelleCle(): string {
  compteur += 1;
  return `ligne-${compteur}`;
}

/** « 1 500,50 » → 1500.5 ; vide ou invalide → null. */
export function lireNombre(valeur: string): number | null {
  const texte = normaliserNombre(valeur);
  if (texte === "") return null;
  const n = Number(texte);
  return Number.isFinite(n) ? n : null;
}

function entierPositif(valeur: string): number | null {
  const n = lireNombre(valeur);
  return n !== null && Number.isInteger(n) && n > 0 ? n : null;
}

// --- Atelier interne : pièces du stock -----------------------------------------

export interface CalculLigneStock {
  piece: Piece | undefined;
  quantite: number | null;
  montant: number | null;
  erreur: string | null;
}

/** Montant et contrôle de chaque ligne (pièce choisie, quantité entière > 0, stock suffisant, pas de doublon). */
export function calculerLignesStock(lignes: readonly LigneStockSaisie[], pieces: readonly Piece[]): CalculLigneStock[] {
  return lignes.map((ligne, index) => {
    const piece = pieces.find((p) => String(p.idPiece) === ligne.idPiece);
    const quantite = entierPositif(ligne.quantite);
    let erreur: string | null = null;
    if (!piece) erreur = "Choisissez une pièce.";
    else if (quantite === null) erreur = "Quantité : nombre entier supérieur à 0.";
    else if (quantite > piece.quantiteStock) erreur = `Stock insuffisant (${piece.quantiteStock} en stock).`;
    else if (lignes.findIndex((l) => l.idPiece === ligne.idPiece) !== index) erreur = "Pièce déjà ajoutée : modifiez la quantité de la première ligne.";
    return { piece, quantite, montant: piece && quantite !== null ? piece.prixUnitaire * quantite : null, erreur };
  });
}

export function totalLignes(calculs: readonly { montant: number | null }[]): number {
  return calculs.reduce((total, c) => total + (c.montant ?? 0), 0);
}

export function requetesPiecesStock(calculs: readonly CalculLigneStock[]): UtiliserPieceRequest[] {
  return calculs
    .filter((c) => c.erreur === null && c.piece && c.quantite !== null)
    .map((c) => ({ idPiece: c.piece!.idPiece, quantite: c.quantite! }));
}

// --- Garage externe : pièces facturées + main-d'œuvre ----------------------------

export interface CalculLigneGarage {
  quantite: number | null;
  prixUnitaire: number | null;
  montant: number | null;
  erreur: string | null;
}

export function calculerLignesGarage(lignes: readonly LigneGarageSaisie[]): CalculLigneGarage[] {
  return lignes.map((ligne) => {
    const quantite = entierPositif(ligne.quantite);
    const prix = lireNombre(ligne.prixUnitaire);
    let erreur: string | null = null;
    if (ligne.designation.trim() === "") erreur = "Désignation requise.";
    else if (ligne.designation.trim().length > 150) erreur = "Désignation : 150 caractères au plus.";
    else if (quantite === null) erreur = "Quantité : nombre entier supérieur à 0.";
    else if (prix === null || prix < 0) erreur = "Prix unitaire : nombre positif ou nul.";
    const prixValide = prix !== null && prix >= 0 ? prix : null;
    return {
      quantite,
      prixUnitaire: prixValide,
      montant: quantite !== null && prixValide !== null ? quantite * prixValide : null,
      erreur,
    };
  });
}

/** Main-d'œuvre : vide = 0 ; sinon nombre positif ou nul (null = invalide). */
export function lireMainOeuvre(valeur: string): number | null {
  if (valeur.trim() === "") return 0;
  const n = lireNombre(valeur);
  return n !== null && n >= 0 ? n : null;
}

export function requeteCoutsGarage(
  lignes: readonly LigneGarageSaisie[],
  calculs: readonly CalculLigneGarage[],
  mainOeuvre: number,
): DefinirCoutsGarageRequest {
  return {
    coutMainOeuvre: mainOeuvre,
    piecesExternes: lignes.map((ligne, i) => ({
      designation: ligne.designation.trim(),
      quantite: calculs[i].quantite ?? 0,
      prixUnitaire: calculs[i].prixUnitaire ?? 0,
    })),
  };
}
