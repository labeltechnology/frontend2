import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { conducteursKeys } from "@/features/conducteurs/api";
import type { CompteConducteur, Conducteur } from "@/types/conducteur";

/**
 * Compte de connexion d'un conducteur (2026-09-28, appli mobile) :
 * GET /api/conducteurs/comptes-disponibles et PUT /api/conducteurs/{id}/compte
 * (réservés à la gestion du parc).
 */

const clesCompte = {
  disponibles: (idConducteur: number) => ["conducteurs", "comptes-disponibles", idConducteur] as const,
};

async function comptesDisponibles(idConducteur: number): Promise<CompteConducteur[]> {
  const { data } = await apiClient.get<CompteConducteur[]>("/api/conducteurs/comptes-disponibles", {
    params: { idConducteur },
  });
  return data;
}

async function lierCompte(idConducteur: number, idUtilisateur: number | null): Promise<Conducteur> {
  const { data } = await apiClient.put<Conducteur>(`/api/conducteurs/${idConducteur}/compte`, { idUtilisateur });
  return data;
}

export function useComptesDisponibles(idConducteur: number | null) {
  return useQuery({
    queryKey: clesCompte.disponibles(idConducteur ?? 0),
    queryFn: () => comptesDisponibles(idConducteur!),
    enabled: idConducteur !== null,
  });
}

export function useLierCompte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idConducteur, idUtilisateur }: { idConducteur: number; idUtilisateur: number | null }) =>
      lierCompte(idConducteur, idUtilisateur),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conducteursKeys.liste }),
  });
}
