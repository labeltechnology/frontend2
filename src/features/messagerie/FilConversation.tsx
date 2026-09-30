import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { chargerMessagesAvant, clesMessagerie, useMarquerLu, useMessages } from "@/features/messagerie/api";
import { Composeur } from "@/features/messagerie/Composeur";
import { fusionnerMessages, heureMessage, lienObjetFil } from "@/features/messagerie/messagerie";
import { PieceJointeMessage } from "@/features/messagerie/PieceJointeMessage";
import { libelleRole } from "@/lib/droits";
import { cn } from "@/lib/utils";
import type { Conversation, MessageConversation } from "@/types/messagerie";

/**
 * Conversation ouverte : messages (les miens à droite), chargement des plus
 * anciens, défilement automatique vers le dernier message, marquage « lu »
 * à l'ouverture et à l'arrivée d'un message d'un autre utilisateur.
 */
export function FilConversation({ conversation }: { conversation: Conversation }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages, isLoading, isError } = useMessages(conversation.idConversation);
  const marquerLu = useMarquerLu();
  const [chargementAncien, setChargementAncien] = useState(false);
  const [plusAncien, setPlusAncien] = useState(true);
  const fin = useRef<HTMLDivElement>(null);
  const dernierId = messages?.[messages.length - 1]?.idMessage;
  const lienObjet = lienObjetFil(conversation.objetType, conversation.objetId);

  useEffect(() => {
    setPlusAncien(true);
  }, [conversation.idConversation]);

  // Défilement vers le bas et « lu » à chaque nouveau dernier message.
  useEffect(() => {
    if (dernierId === undefined) return;
    fin.current?.scrollIntoView({ block: "end" });
    marquerLu.mutate(conversation.idConversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dernierId, conversation.idConversation]);

  const chargerPrecedents = async () => {
    const premier = messages?.[0];
    if (!premier) return;
    setChargementAncien(true);
    try {
      const anciens = await chargerMessagesAvant(conversation.idConversation, premier.idMessage);
      if (anciens.length === 0) setPlusAncien(false);
      queryClient.setQueryData<MessageConversation[]>(clesMessagerie.messages(conversation.idConversation), (liste) =>
        fusionnerMessages(liste ?? [], anciens),
      );
    } finally {
      setChargementAncien(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{conversation.titre}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.type === "PRIVEE"
              ? libelleRole(conversation.interlocuteur?.role)
              : conversation.type === "CANAL"
                ? "Canal d'équipe"
                : "Discussion liée"}
          </p>
        </div>
        {lienObjet && (
          <Button asChild variant="outline" size="sm">
            <Link to={lienObjet}>
              <ExternalLink className="h-4 w-4" />
              Ouvrir
            </Link>
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p>}
        {isError && <p className="py-6 text-center text-sm text-destructive">Messages indisponibles.</p>}
        {messages && messages.length >= 50 && plusAncien && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={chargerPrecedents} disabled={chargementAncien}>
              {chargementAncien && <Loader2 className="h-4 w-4 animate-spin" />}
              Messages précédents
            </Button>
          </div>
        )}
        {messages?.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun message. Écrivez le premier.</p>
        )}
        {messages?.map((m) => {
          const moi = m.auteur.idUtilisateur === session?.idUtilisateur;
          return (
            <div key={m.idMessage} className={cn("flex", moi ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] space-y-1.5 rounded-2xl px-3 py-2 text-sm shadow-sm",
                  moi ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                {!moi && conversation.type !== "PRIVEE" && (
                  <p className="text-xs font-semibold">
                    {m.auteur.nomComplet}
                    <span className="ml-1 font-normal opacity-70">· {libelleRole(m.auteur.role)}</span>
                  </p>
                )}
                {m.contenu && <p className="whitespace-pre-wrap break-words">{m.contenu}</p>}
                {m.piecesJointes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.piecesJointes.map((pj) => (
                      <PieceJointeMessage key={pj.idPieceJointe} pieceJointe={pj} />
                    ))}
                  </div>
                )}
                <p className={cn("text-right text-[10px]", moi ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {heureMessage(m.dateEnvoi)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <Composeur idConversation={conversation.idConversation} />
    </div>
  );
}
