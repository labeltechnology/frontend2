import { useCallback, useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConfirmer } from "@/components/confirmation/ConfirmationProvider";
import { DELAI_ANNULATION_MS, planifierSuppression, retirerDuCache, type SuppressionEnAttente } from "@/components/confirmation/suppression-differee";
import { ApiError } from "@/lib/api-client";

/** Suppressions pas encore envoyées : fermer l'onglet avant le délai demande confirmation au navigateur. */
const enAttente = new Set<SuppressionEnAttente>();

export interface DemandeSuppression<T> {
  titre: string;
  message: string;
  /** Message affiché après la confirmation, ex. « Maintenance n° 84 supprimée ». */
  libelleFait: string;
  /** Listes à mettre à jour tout de suite (clés react-query) et l'élément visé. */
  cles: QueryKey[];
  estVise: (element: T) => boolean;
  supprimer: () => Promise<unknown>;
}

/**
 * Confirmer, masquer, puis supprimer après 8 s sauf « Annuler » (2026-09-30).
 * Après l'appel, les listes sont relues ; en cas d'erreur, l'élément
 * réapparaît avec le message du serveur.
 */
export function useSuppressionAnnulable() {
  const confirmer = useConfirmer();
  const queryClient = useQueryClient();

  useEffect(() => {
    const avertir = (e: BeforeUnloadEvent) => {
      if ([...enAttente].some((s) => s.enAttente())) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, []);

  return useCallback(
    async <T,>(d: DemandeSuppression<T>): Promise<boolean> => {
      if (!(await confirmer({ titre: d.titre, message: d.message, libelleConfirmer: "Supprimer", danger: true }))) return false;
      const relire = () => Promise.all(d.cles.map((cle) => queryClient.invalidateQueries({ queryKey: cle })));
      for (const cle of d.cles) queryClient.setQueriesData({ queryKey: cle }, (anciennes: unknown) => retirerDuCache<T>(anciennes, d.estVise));

      const suppression = planifierSuppression(async () => {
        enAttente.delete(suppression);
        try {
          await d.supprimer();
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Suppression impossible");
        } finally {
          await relire();
        }
      }, DELAI_ANNULATION_MS);
      enAttente.add(suppression);

      toast.success(d.libelleFait, {
        duration: DELAI_ANNULATION_MS,
        action: {
          label: "Annuler",
          onClick: () => {
            if (suppression.annuler()) {
              enAttente.delete(suppression);
              void relire();
              toast.info("Suppression annulée");
            }
          },
        },
      });
      return true;
    },
    [confirmer, queryClient],
  );
}
