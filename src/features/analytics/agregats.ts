import { dansIntervalle, lireDate, type Intervalle, type Seau } from "@/features/analytics/periode";
import type { Fait } from "@/features/analytics/mesures";
import { tronconsPleinAPlein } from "@/features/carburant/approvisionnement";
import type { Carburant } from "@/types/carburant";
import type { Engin } from "@/types/engin";

/** Agrégats de la page Analytique (2026-09-25) — fonctions pures. */

export function total(faits: Fait[], intervalle: Intervalle): number {
  return faits.reduce((s, f) => (dansIntervalle(f.date, intervalle) ? s + f.valeur : s), 0);
}

/** Écart en % par rapport à la période précédente ; null si rien à comparer (période précédente à 0). */
export function ecartPourcent(actuel: number, precedent: number): number | null {
  if (precedent <= 0) return null;
  return ((actuel - precedent) / precedent) * 100;
}

/** Somme des faits par seau (jour, semaine, mois). */
export function serie(faits: Fait[], seaux: Seau[]): number[] {
  const valeurs = seaux.map(() => 0);
  for (const f of faits) {
    const i = seaux.findIndex((s) => f.date >= s.debut && f.date < s.fin);
    if (i >= 0) valeurs[i] += f.valeur;
  }
  return valeurs;
}

export interface LigneClassement {
  engin: Engin;
  valeur: number;
}

/** Véhicules classés par valeur décroissante sur l'intervalle (les valeurs nulles sont écartées). */
export function classementVehicules(faits: Fait[], engins: Engin[], intervalle: Intervalle, nombre: number): LigneClassement[] {
  const parEngin = new Map<number, number>();
  for (const f of faits) {
    if (dansIntervalle(f.date, intervalle)) parEngin.set(f.idEngin, (parEngin.get(f.idEngin) ?? 0) + f.valeur);
  }
  return engins
    .map((engin) => ({ engin, valeur: parEngin.get(engin.idEngin) ?? 0 }))
    .filter((l) => l.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, nombre);
}

export interface ConsommationVehicule {
  engin: Engin;
  litresAux100: number;
  distance: number;
}

/**
 * Consommation par véhicule routier sur l'intervalle (règle 10.9, même calcul
 * que le serveur) : méthode « plein à plein » (2026-09-28) — Σ litres des
 * tronçons ÷ Σ distances × 100, appoints et bidons comptés dans le tronçon
 * qu'ils précèdent (voir carburant/approvisionnement.ts). Il faut au moins
 * deux pleins complets. Les engins de chantier (compteur horaire) sont
 * exclus : pas de L/100 km.
 */
export function consommationParVehicule(pleins: Carburant[], engins: Engin[], intervalle: Intervalle, retenus: Set<number> | null): ConsommationVehicule[] {
  const resultat: ConsommationVehicule[] = [];
  for (const engin of engins) {
    if (engin.typeEngin?.categorie !== "VEHICULE_ROUTIER" || (retenus && !retenus.has(engin.idEngin))) continue;
    const siens = pleins
      .filter((p) => p.engin.idEngin === engin.idEngin && dansIntervalle(lireDate(p.dateHeure), intervalle));
    const troncons = tronconsPleinAPlein(siens);
    const distance = troncons.reduce((s, t) => s + t.distance, 0);
    if (distance <= 0) continue;
    const litres = troncons.reduce((s, t) => s + t.litres, 0);
    resultat.push({ engin, litresAux100: (litres / distance) * 100, distance });
  }
  return resultat.sort((a, b) => b.litresAux100 - a.litresAux100);
}

/** Consommation moyenne de la flotte : Σ litres ÷ Σ distances des véhicules calculés. */
export function consommationFlotte(lignes: ConsommationVehicule[]): number | null {
  const distance = lignes.reduce((s, l) => s + l.distance, 0);
  if (distance <= 0) return null;
  return lignes.reduce((s, l) => s + (l.litresAux100 * l.distance) / 100, 0) / distance * 100;
}

export interface Part {
  cle: string;
  libelle: string;
  nombre: number;
  /** Montant associé (ex. coût des maintenances de ce type) ; absent = sans objet. */
  montant?: number;
}

/** Comptage par clé, dans l'ordre des libellés fournis (toutes les clés affichées, même à 0). */
export function repartition<T>(elements: T[], cle: (e: T) => string, libelles: Record<string, string>, montant?: (e: T) => number): Part[] {
  return Object.entries(libelles).map(([c, libelle]) => {
    const siens = elements.filter((e) => cle(e) === c);
    return { cle: c, libelle, nombre: siens.length, montant: montant ? siens.reduce((s, e) => s + montant(e), 0) : undefined };
  });
}
