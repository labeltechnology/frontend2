/**
 * Politique de mot de passe (2026-09-29), miroir partiel de
 * security/motdepasse/PolitiqueMotDePasse : l'écran signale tout de suite
 * les manquements évidents ; le serveur refait tous les contrôles (dont la
 * liste des mots de passe courants).
 */
export const LONGUEUR_MINIMALE = 12;
export const LONGUEUR_MAXIMALE_OCTETS = 72;

const NOMS_INTERDITS = ["parcauto", "parkauto", "labeltechnology"];

export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, "");
}

/** Repère un seul ou deux caractères répétés, ou une suite (abcd, 4321) sur tout le mot. */
export function estRepetitionOuSuite(normal: string): boolean {
  if (new Set(normal).size <= 2) return true;
  let montante = 0;
  let descendante = 0;
  for (let i = 1; i < normal.length; i++) {
    const ecart = normal.charCodeAt(i) - normal.charCodeAt(i - 1);
    if (ecart === 1) montante++;
    else if (ecart === -1) descendante++;
  }
  const paires = normal.length - 1;
  return montante >= paires - 1 || descendante >= paires - 1;
}

export function problemesMotDePasse(motDePasse: string, infos: { email?: string | null; nom?: string | null; prenom?: string | null }): string[] {
  const p: string[] = [];
  if ([...motDePasse].length < LONGUEUR_MINIMALE) p.push(`Au moins ${LONGUEUR_MINIMALE} caractères (une courte phrase est plus facile à retenir).`);
  if (new TextEncoder().encode(motDePasse).length > LONGUEUR_MAXIMALE_OCTETS) p.push("Trop long (72 octets au plus).");
  if (!motDePasse) return p;
  const normal = normaliser(motDePasse);
  if (estRepetitionOuSuite(normal)) p.push("Évitez les caractères répétés ou les suites (aaaa, 1234, abcd).");
  const perso: string[] = [];
  const email = infos.email ?? "";
  if (email.includes("@")) perso.push(...normaliser(email.slice(0, email.indexOf("@"))).split(/[._+-]/));
  for (const s of [infos.nom, infos.prenom]) if (s) perso.push(...normaliser(s).split(/[-'.]/));
  if (perso.some((m) => m.length >= 3 && normal.includes(m))) p.push("Ni votre nom, ni votre prénom, ni votre e-mail.");
  if (NOMS_INTERDITS.some((m) => normal.includes(m))) p.push("Pas le nom de l'application ou de l'entreprise.");
  return p;
}
