import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { entretienKeys } from "@/features/entretien/api";
import type { ControleClotureRequest } from "@/features/maintenance/controle-cloture";
import type {
  CreerMaintenanceRequest,
  CreerPieceRequest,
  Maintenance,
  Piece,
  UtiliserPieceRequest,
} from "@/types/maintenance";

export const maintenanceKeys = {
  liste: ["maintenances"] as const,
  pieces: ["pieces"] as const,
};

async function listerMaintenances(): Promise<Maintenance[]> {
  const { data } = await apiClient.get<Maintenance[]>("/api/maintenances");
  return data;
}

async function creerMaintenance(requete: CreerMaintenanceRequest): Promise<Maintenance> {
  const { data } = await apiClient.post<Maintenance>("/api/maintenances", requete);
  return data;
}

async function demarrerMaintenance(id: number): Promise<Maintenance> {
  const { data } = await apiClient.patch<Maintenance>(`/api/maintenances/${id}/demarrer`);
  return data;
}

async function ajouterPieceMaintenance(id: number, requete: UtiliserPieceRequest): Promise<Maintenance> {
  const { data } = await apiClient.post<Maintenance>(`/api/maintenances/${id}/pieces`, requete);
  return data;
}

async function terminerMaintenance(
  id: number,
  prochaineDateEntretien?: string,
  controle?: ControleClotureRequest,
): Promise<Maintenance> {
  // 2026-09-29 : avec le contrôle qualité, tout part dans le corps ; sans, ancien appel.
  if (controle) {
    const { data } = await apiClient.patch<Maintenance>(`/api/maintenances/${id}/terminer`, {
      prochaineDateEntretien: prochaineDateEntretien || null,
      controle,
    });
    return data;
  }
  const { data } = await apiClient.patch<Maintenance>(`/api/maintenances/${id}/terminer`, null, {
    params: prochaineDateEntretien ? { prochaineDateEntretien } : undefined,
  });
  return data;
}

async function listerPieces(): Promise<Piece[]> {
  const { data } = await apiClient.get<Piece[]>("/api/pieces");
  return data;
}

async function creerPiece(requete: CreerPieceRequest): Promise<Piece> {
  const { data } = await apiClient.post<Piece>("/api/pieces", requete);
  return data;
}

async function approvisionnerPiece(id: number, quantite: number): Promise<Piece> {
  const { data } = await apiClient.patch<Piece>(`/api/pieces/${id}/approvisionner`, null, {
    params: { quantite },
  });
  return data;
}

export function useMaintenances() {
  return useQuery({ queryKey: maintenanceKeys.liste, queryFn: listerMaintenances });
}

export function useCreerMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerMaintenance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.liste }),
  });
}

export function useDemarrerMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: demarrerMaintenance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.liste }),
  });
}

export function useAjouterPieceMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: UtiliserPieceRequest }) =>
      ajouterPieceMaintenance(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.liste });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.pieces });
    },
  });
}

export function useTerminerMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      prochaineDateEntretien,
      controle,
    }: {
      id: number;
      prochaineDateEntretien?: string;
      controle?: ControleClotureRequest;
    }) => terminerMaintenance(id, prochaineDateEntretien, controle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.liste });
      // Réserve au contrôle → nouvelle alerte ; fiabilité recalculée.
      queryClient.invalidateQueries({ queryKey: ["alertes"] });
      queryClient.invalidateQueries({ queryKey: ["fiabilite"] });
      // Une maintenance liée à un poste recalcule son échéance côté backend (2026-09-24).
      queryClient.invalidateQueries({ queryKey: entretienKeys.echeances });
    },
  });
}

export function usePieces() {
  return useQuery({ queryKey: maintenanceKeys.pieces, queryFn: listerPieces });
}

export function useCreerPiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerPiece,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.pieces }),
  });
}

export function useApprovisionnerPiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantite }: { id: number; quantite: number }) => approvisionnerPiece(id, quantite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.pieces }),
  });
}
