import { useNavigate } from "react-router-dom";
import { Loader2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useOuvrirFil } from "@/features/messagerie/api";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import type { TypeObjetFil } from "@/types/messagerie";

/**
 * Ouvre (ou crée) le fil de discussion d'un véhicule, d'une mission, d'un
 * chantier ou d'une maintenance, puis va dans la messagerie. Même règle que
 * le serveur : réservé aux profils de gestion (CONSULTER_GESTION).
 */
export function useOuvrirDiscussion() {
  const navigate = useNavigate();
  const ouvrir = useOuvrirFil();
  const { session } = useAuth();
  const autorise = peut(session?.role, "CONSULTER_GESTION");

  const ouvrirDiscussion = async (type: TypeObjetFil, idObjet: number) => {
    try {
      const conversation = await ouvrir.mutateAsync({ type, idObjet });
      navigate(`/messagerie?c=${conversation.idConversation}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Discussion impossible à ouvrir");
    }
  };
  return { autorise, ouvrirDiscussion, enCours: ouvrir.isPending };
}

export function BoutonDiscussion({ type, idObjet }: { type: TypeObjetFil; idObjet: number }) {
  const { autorise, ouvrirDiscussion, enCours } = useOuvrirDiscussion();
  if (!autorise) return null;
  return (
    <Button variant="outline" onClick={() => ouvrirDiscussion(type, idObjet)} disabled={enCours}>
      {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
      Discussion
    </Button>
  );
}
