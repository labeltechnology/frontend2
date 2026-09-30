import { useContext } from "react";
import { AuthContext } from "@/features/auth/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé sous <AuthProvider>");
  }
  return context;
}
