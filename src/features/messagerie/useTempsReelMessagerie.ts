import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clesMessagerie } from "@/features/messagerie/api";
import { fusionnerMessages } from "@/features/messagerie/messagerie";
import { ecouterTempsReel } from "@/lib/temps-reel/bus";
import type { MessageConversation } from "@/types/messagerie";

/**
 * Messagerie en temps réel (2026-09-28). Depuis le 2026-09-29, elle
 * n'ouvre plus sa propre connexion : elle écoute la connexion commune de
 * l'application (features/temps-reel/useTempsReel, canal « messagerie »).
 *
 * - À chaque message reçu : ajout dans la conversation ouverte (cache
 *   react-query), rafraîchissement de la liste et du badge.
 * - Après une (re)connexion : relecture de ce qui a pu arriver pendant la coupure.
 */
export function useTempsReelMessagerie() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      ecouterTempsReel((evenement) => {
        if (evenement.type === "OUVERTURE") {
          void queryClient.invalidateQueries({ queryKey: clesMessagerie.tout });
          return;
        }
        if (evenement.type !== "MESSAGE") return;
        const message = evenement.message as MessageConversation;
        queryClient.setQueryData<MessageConversation[]>(clesMessagerie.messages(evenement.idConversation), (liste) =>
          liste ? fusionnerMessages(liste, [message]) : liste,
        );
        void queryClient.invalidateQueries({ queryKey: clesMessagerie.conversations });
        void queryClient.invalidateQueries({ queryKey: clesMessagerie.nonLus });
      }),
    [queryClient],
  );
}
