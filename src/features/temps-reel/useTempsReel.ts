import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { apiClient } from "@/lib/api-client";
import { appliquerChangement } from "@/lib/temps-reel/appliquer";
import { publierTempsReel } from "@/lib/temps-reel/bus";
import { canauxAAbonner } from "@/lib/temps-reel/canaux";
import { ConnexionTempsReel } from "@/lib/temps-reel/connexion";
import { avisModificationConcurrente } from "@/lib/temps-reel/edition";
import { definirEtatTempsReel } from "@/lib/temps-reel/etat";
import { ID_ONGLET } from "@/lib/temps-reel/onglet";
import type { EvenementChangement } from "@/lib/temps-reel/protocole";
import { PlanificateurRelectures } from "@/lib/temps-reel/relectures";

const DELAI_ENTRE_AVIS_MS = 10_000;

async function demanderTicket(): Promise<string> {
  const { data } = await apiClient.post<{ ticket: string }>("/api/temps-reel/ticket");
  return data.ticket;
}

/**
 * Synchronisation instantanée de l'écran (2026-09-29), montée UNE fois dans
 * AppLayout tant qu'une session existe :
 * - une seule connexion WebSocket par onglet, abonnée à tous les canaux
 *   (le serveur refuse ceux que le rôle ne peut pas suivre) ;
 * - chaque changement reçu met le cache à jour tout de suite
 *   (appliquerChangement) puis déclenche une relecture groupée ;
 * - après une coupure, tout ce qui est affiché est relu ;
 * - avis si un objet en cours de modification ici change ailleurs ;
 * - les autres modules (messagerie) reçoivent les événements par le bus.
 */
export function useTempsReel(): void {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const idUtilisateur = session?.idUtilisateur;

  useEffect(() => {
    if (!idUtilisateur) return undefined;
    const relectures = new PlanificateurRelectures((predicat) => {
      void queryClient.invalidateQueries({ predicate: (q) => predicat(q.queryKey) });
    });
    const derniersAvis = new Map<string, number>();

    const avertir = (evenement: EvenementChangement) => {
      const avis = avisModificationConcurrente(evenement, ID_ONGLET, idUtilisateur);
      if (!avis) return;
      const cle = `${evenement.canal}#${evenement.id}`;
      const maintenant = Date.now();
      if (maintenant - (derniersAvis.get(cle) ?? 0) < DELAI_ENTRE_AVIS_MS) return;
      derniersAvis.set(cle, maintenant);
      toast.warning(avis.titre, { description: avis.description, duration: 10_000 });
    };

    const connexion = new ConnexionTempsReel({
      demanderTicket,
      // `||` et non `??` : en déploiement même-origine la base est la chaîne
      // VIDE, et `new URL("/ws/temps-reel", "")` lève « Invalid URL ». Il faut
      // donc retomber sur l'origine de la page, pas seulement si la base est
      // absente.
      baseApi: () => apiClient.defaults.baseURL || window.location.origin,
      canaux: canauxAAbonner,
      surEtat: definirEtatTempsReel,
      surOuverture: (reconnexion) => {
        // Ce qui a pu changer pendant la coupure.
        if (reconnexion) relectures.toutRelire();
        publierTempsReel({ type: "OUVERTURE", reconnexion });
      },
      surEvenement: (evenement) => {
        if (evenement.type === "CHANGEMENT") {
          const aJour = appliquerChangement(queryClient, evenement);
          relectures.planifier(evenement.canal, !aJour);
          avertir(evenement);
        }
        publierTempsReel(evenement);
      },
    });
    connexion.demarrer();
    return () => {
      connexion.arreter();
      relectures.arreter();
    };
  }, [idUtilisateur, queryClient]);
}
