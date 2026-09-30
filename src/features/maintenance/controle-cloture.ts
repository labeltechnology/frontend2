/**
 * Contrôle qualité à la clôture d'une maintenance (2026-09-29, version
 * simple validée : qui a contrôlé, essai concluant, réserve). Règles côté
 * écran, miroir de maintenance/controle/ControleCloture (serveur) : le
 * contrôleur est obligatoire, un essai non concluant bloque la clôture, une
 * réserve est gardée et crée une alerte.
 */
export interface SaisieControle {
  controlePar: string;
  essaiOk: boolean;
  reserve: string;
}

export interface ControleClotureRequest {
  controlePar: string;
  essaiOk: boolean;
  reserve?: string;
}

export interface ControleCloture {
  idMaintenance: number;
  controlePar: string;
  essaiOk: boolean;
  reserve: string | null;
  dateControle: string;
}

export const CONTROLE_VIDE: SaisieControle = { controlePar: "", essaiOk: false, reserve: "" };

/** Message bloquant, ou null si le contrôle permet de clôturer. */
export function erreurControle(s: SaisieControle): string | null {
  if (!s.controlePar.trim()) return "Indiquez qui a contrôlé la réparation.";
  if (s.controlePar.trim().length > 100) return "Le nom du contrôleur est trop long (100 caractères au plus).";
  if (!s.essaiOk) return "La maintenance ne se clôture que si l'essai est concluant. Sinon, laissez-la en cours.";
  if (s.reserve.trim().length > 500) return "La réserve est trop longue (500 caractères au plus).";
  return null;
}

export function requeteControle(s: SaisieControle): ControleClotureRequest {
  const reserve = s.reserve.trim();
  return { controlePar: s.controlePar.trim(), essaiOk: s.essaiOk, ...(reserve ? { reserve } : {}) };
}
