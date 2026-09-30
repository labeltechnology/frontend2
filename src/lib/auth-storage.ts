import type { SessionUtilisateur } from "@/types/auth";

const CLE_TOKEN = "parcauto.token";

/**
 * Décode la charge utile (payload) d'un JWT sans vérifier sa signature — la
 * vérification de signature est du ressort exclusif du backend ; ici on ne
 * fait que lire des claims déjà validés par le serveur qui a émis le token
 * (email/idUtilisateur/role/exp), pour piloter l'UI (garde de routes,
 * affichage du rôle courant).
 */
function decoderPayload(token: string): SessionUtilisateur | null {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return null;
    const normalise = payloadBase64.replaceAll("-", "+").replaceAll("_", "/");
    const payloadJson = atob(normalise);
    const payload = JSON.parse(payloadJson) as {
      sub?: string;
      idUtilisateur?: number;
      role?: string;
      exp?: number;
    };
    if (!payload.sub || !payload.role || !payload.exp) return null;
    return {
      email: payload.sub,
      idUtilisateur: payload.idUtilisateur ?? 0,
      role: payload.role as SessionUtilisateur["role"],
      expiration: payload.exp,
    };
  } catch {
    return null;
  }
}

export function lireTokenStocke(): string | null {
  return localStorage.getItem(CLE_TOKEN);
}

export function stockerToken(token: string): void {
  localStorage.setItem(CLE_TOKEN, token);
}

export function effacerToken(): void {
  localStorage.removeItem(CLE_TOKEN);
}

/** Retourne la session déduite du token stocké, ou null si absent/invalide/expiré. */
export function lireSessionStockee(): SessionUtilisateur | null {
  const token = lireTokenStocke();
  if (!token) return null;
  const session = decoderPayload(token);
  if (!session) return null;
  if (session.expiration * 1000 <= Date.now()) {
    effacerToken();
    return null;
  }
  return session;
}

export function decoderToken(token: string): SessionUtilisateur | null {
  return decoderPayload(token);
}
