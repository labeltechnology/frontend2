import { apiClient } from "@/lib/api-client";
import { nomFichierExport, type TableauExport } from "@/lib/tableau-export";
import { declencherTelechargementBlob } from "@/lib/utils";

/**
 * Export Excel d'un tableau affiché (2026-09-29) : le serveur fabrique le
 * .xlsx (POST /api/exports/excel) avec un format numérique par colonne.
 */
export async function exporterExcel(tableau: TableauExport): Promise<void> {
  const { data } = await apiClient.post<Blob>("/api/exports/excel", tableau, { responseType: "blob" });
  declencherTelechargementBlob(data, nomFichierExport(tableau.titre));
}
