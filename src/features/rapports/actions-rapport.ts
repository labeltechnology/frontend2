import { toast } from "sonner";
import { useGenererRapport, useRapportExcel, useRapportPdf } from "@/features/rapports/api";
import { nomFichierRapport } from "@/features/rapports/liste-rapports";
import { ApiError } from "@/lib/api-client";
import { declencherTelechargementBlob } from "@/lib/utils";
import type { GenererRapportRequest, Rapport } from "@/types/rapport";

/** Mêmes type, période et cible qu'un rapport existant : chiffres recalculés à aujourd'hui. */
export function requeteRegeneration(r: Rapport): GenererRapportRequest {
  return {
    type: r.type,
    dateDebutPeriode: r.dateDebutPeriode ?? undefined,
    dateFinPeriode: r.dateFinPeriode ?? undefined,
    idEngin: r.idEngin ?? undefined,
    idConducteur: r.idConducteur ?? undefined,
    idChantier: r.idChantier ?? undefined,
  };
}

function messageErreur(e: unknown, defaut: string): string {
  return e instanceof ApiError ? e.message : defaut;
}

/**
 * Actions rapides d'un rapport (liste et aperçu, 2026-09-28) : télécharger le
 * PDF ou l'Excel, régénérer avec les mêmes paramètres.
 */
export function useActionsRapport() {
  const pdf = useRapportPdf();
  const excel = useRapportExcel();
  const generer = useGenererRapport();

  return {
    telechargerPdf: async (r: Rapport, blobDejaCharge?: Blob) => {
      try {
        const blob = blobDejaCharge ?? (await pdf.mutateAsync(r.idRapport));
        declencherTelechargementBlob(blob, nomFichierRapport(r, "pdf"));
      } catch (e) {
        toast.error(messageErreur(e, "Téléchargement du PDF impossible"));
      }
    },
    telechargerExcel: async (r: Rapport) => {
      try {
        const blob = await excel.mutateAsync(r.idRapport);
        declencherTelechargementBlob(blob, nomFichierRapport(r, "xlsx"));
      } catch (e) {
        toast.error(messageErreur(e, "Téléchargement du fichier Excel impossible"));
      }
    },
    /** Renvoie le nouveau rapport, ou null si la génération a échoué (message déjà affiché). */
    regenerer: async (r: Rapport): Promise<Rapport | null> => {
      try {
        const nouveau = await generer.mutateAsync(requeteRegeneration(r));
        toast.success("Rapport régénéré avec les chiffres d'aujourd'hui");
        return nouveau;
      } catch (e) {
        toast.error(messageErreur(e, "Régénération impossible"));
        return null;
      }
    },
    pdfEnCours: pdf.isPending,
    excelEnCours: excel.isPending,
    regenerationEnCours: generer.isPending,
  };
}
