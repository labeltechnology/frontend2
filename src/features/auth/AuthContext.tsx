import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import { decoderToken, effacerToken, lireSessionStockee, stockerToken } from "@/lib/auth-storage";
import type { LoginRequest, LoginResponse, SessionUtilisateur } from "@/types/auth";

interface AuthContextValue {
  session: SessionUtilisateur | null;
  seConnecter: (requete: LoginRequest) => Promise<void>;
  seDeconnecter: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUtilisateur | null>(() => lireSessionStockee());

  const seConnecter = useCallback(async (requete: LoginRequest) => {
    const reponse = await apiClient.post<LoginResponse>("/api/auth/login", requete);
    stockerToken(reponse.data.token);
    const nouvelleSession = decoderToken(reponse.data.token);
    setSession(nouvelleSession);
  }, []);

  const seDeconnecter = useCallback(() => {
    effacerToken();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, seConnecter, seDeconnecter }),
    [session, seConnecter, seDeconnecter],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
