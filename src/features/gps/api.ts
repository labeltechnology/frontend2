import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { intervalleSecours } from "@/lib/temps-reel/etat";
import type {
  CreerDispositifGpsRequest,
  DispositifGps,
  LocalisationVehicule,
  PositionFlotte,
  PositionGps,
  Trajet,
} from "@/types/gps";

export const gpsKeys = {
  dispositifs: ["gps", "dispositifs"] as const,
  positions: (idDispositifGps: number) => ["gps", "positions", idDispositifGps] as const,
  flotte: ["gps", "positions", "flotte"] as const,
  localisation: (idEngin: number) => ["gps", "localisation", idEngin] as const,
};

async function listerDispositifs(): Promise<DispositifGps[]> {
  const { data } = await apiClient.get<DispositifGps[]>("/api/gps/dispositifs");
  return data;
}

async function installerDispositif(requete: CreerDispositifGpsRequest): Promise<DispositifGps> {
  const { data } = await apiClient.post<DispositifGps>("/api/gps/dispositifs", requete);
  return data;
}

async function desactiverDispositif(id: number): Promise<DispositifGps> {
  const { data } = await apiClient.patch<DispositifGps>(`/api/gps/dispositifs/${id}/desactiver`);
  return data;
}

async function reactiverDispositif(id: number): Promise<DispositifGps> {
  const { data } = await apiClient.patch<DispositifGps>(`/api/gps/dispositifs/${id}/reactiver`);
  return data;
}

async function retirerDispositif(id: number): Promise<DispositifGps> {
  const { data } = await apiClient.patch<DispositifGps>(`/api/gps/dispositifs/${id}/retirer`);
  return data;
}

async function dernieresPositions(idDispositifGps: number, nombre = 50): Promise<PositionGps[]> {
  const { data } = await apiClient.get<PositionGps[]>("/api/gps/positions", {
    params: { idDispositifGps, nombre },
  });
  return data;
}

async function cloturerTrajet(idMission: number): Promise<Trajet> {
  const { data } = await apiClient.patch<Trajet>(`/api/gps/trajets/${idMission}/cloturer`);
  return data;
}

async function localisationVehicule(idEngin: number): Promise<LocalisationVehicule> {
  const { data } = await apiClient.get<LocalisationVehicule>(`/api/gps/engins/${idEngin}/localisation`);
  return data;
}

async function dernieresPositionsFlotte(): Promise<PositionFlotte[]> {
  const { data } = await apiClient.get<PositionFlotte[]>("/api/gps/positions/flotte");
  return data;
}

export function useDispositifsGps() {
  return useQuery({ queryKey: gpsKeys.dispositifs, queryFn: listerDispositifs });
}

export function useInstallerDispositif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: installerDispositif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gpsKeys.dispositifs }),
  });
}

export function useDesactiverDispositif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: desactiverDispositif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gpsKeys.dispositifs }),
  });
}

export function useReactiverDispositif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactiverDispositif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gpsKeys.dispositifs }),
  });
}

export function useRetirerDispositif() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retirerDispositif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gpsKeys.dispositifs }),
  });
}

export function useDernieresPositions(idDispositifGps: number | null) {
  return useQuery({
    queryKey: gpsKeys.positions(idDispositifGps ?? 0),
    queryFn: () => dernieresPositions(idDispositifGps as number),
    enabled: idDispositifGps !== null,
  });
}

export function useCloturerTrajet() {
  return useMutation({ mutationFn: cloturerTrajet });
}

/**
 * Vue « flotte » : poussée par le temps réel (canal gps, toutes les 10 s au plus) ;
 * relue toutes les 30 s seulement si le direct est coupé (2 min sinon, par sécurité).
 */
export function usePositionsFlotte() {
  return useQuery({
    queryKey: gpsKeys.flotte,
    queryFn: dernieresPositionsFlotte,
    refetchInterval: intervalleSecours(30_000),
  });
}

/**
 * Dernière position d'UN véhicule (2026-09-28, carte « Localisation » du
 * rapport véhicule) — une seule ligne au lieu de toute la flotte. Même
 * rafraîchissement que la carte flotte (30 s).
 */
export function useLocalisationVehicule(idEngin: number) {
  return useQuery({
    queryKey: gpsKeys.localisation(idEngin),
    queryFn: () => localisationVehicule(idEngin),
    refetchInterval: intervalleSecours(30_000),
  });
}
