import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  affectationsChantierKeys,
  affectationsConducteurChantierKeys,
  besoinsMaterielChantierKeys,
  chantiersKeys,
} from "@/features/chantiers/api";
import type {
  ConducteurCandidatChantier,
  EnginCandidatChantier,
  FicheChantier,
  FicheChantierRequest,
} from "@/types/chantier";

/**
 * Fiche chantier (2026-09-24) — endpoints de FicheChantierController.
 * L'enregistrement est unique (tout ou rien, une transaction côté backend) ;
 * il invalide aussi les caches des écrans qui affichent les mêmes données
 * (liste des chantiers, dialogues engins/besoins, carte).
 */
export const ficheChantierKeys = {
  fiche: (idChantier: number) => ["fiche-chantier", idChantier] as const,
  candidats: (idChantier: number | undefined) => ["fiche-chantier", "candidats", idChantier ?? "nouveau"] as const,
  conducteurs: (idChantier: number | undefined) => ["fiche-chantier", "conducteurs", idChantier ?? "nouveau"] as const,
};

/** Conducteurs proposés (2026-09-29) : situation et périodes prises (autres chantiers, missions). */
async function listerConducteursCandidats(idChantier: number | undefined): Promise<ConducteurCandidatChantier[]> {
  const { data } = await apiClient.get<ConducteurCandidatChantier[]>("/api/chantiers/fiche/conducteurs-candidats", {
    params: idChantier !== undefined ? { idChantier } : undefined,
  });
  return (data ?? []).map((c) => ({ ...c, occupations: c.occupations ?? [] }));
}

/** actif = false : pas de requête (profils sans CONSULTER_GESTION, qui ne voient pas l'emploi du temps des conducteurs). */
export function useConducteursCandidats(idChantier: number | undefined, actif = true) {
  return useQuery({
    queryKey: ficheChantierKeys.conducteurs(idChantier),
    queryFn: () => listerConducteursCandidats(idChantier),
    enabled: actif,
  });
}

async function obtenirFiche(idChantier: number): Promise<FicheChantier> {
  const { data } = await apiClient.get<FicheChantier>(`/api/chantiers/${idChantier}/fiche`);
  return data;
}

/**
 * Normalise la réponse à la frontière de l'API : `occupations` est déclaré
 * obligatoire dans EnginCandidatChantier, mais un backend antérieur à son
 * introduction (2026-09-24) renvoie des candidats SANS ce champ. Tout le code
 * en aval (plusLonguePeriodeLibre, problemePeriode…) itère dessus sans garde :
 * un champ absent y devenait « occupations is undefined » et vidait toute la
 * page dès que la période du chantier était complète.
 *
 * Normaliser ici plutôt que semer des `?? []` dans chaque fonction : les types
 * restent non-nullables en aval, et un seul endroit connaît le défaut.
 */
async function listerCandidats(idChantier: number | undefined): Promise<EnginCandidatChantier[]> {
  const { data } = await apiClient.get<EnginCandidatChantier[]>("/api/chantiers/fiche/engins-candidats", {
    params: idChantier !== undefined ? { idChantier } : undefined,
  });
  return (data ?? []).map((candidat) => ({ ...candidat, occupations: candidat.occupations ?? [] }));
}

async function creerFiche(requete: FicheChantierRequest): Promise<FicheChantier> {
  const { data } = await apiClient.post<FicheChantier>("/api/chantiers/fiche", requete);
  return data;
}

async function modifierFiche(idChantier: number, requete: FicheChantierRequest): Promise<FicheChantier> {
  const { data } = await apiClient.put<FicheChantier>(`/api/chantiers/${idChantier}/fiche`, requete);
  return data;
}

export function useFicheChantier(idChantier: number | undefined) {
  return useQuery({
    queryKey: ficheChantierKeys.fiche(idChantier ?? 0),
    queryFn: () => obtenirFiche(idChantier as number),
    enabled: idChantier !== undefined,
  });
}

/**
 * Véhicules du parc, leur situation (en panne ou non) et leurs périodes déjà
 * prises sur d'autres chantiers : la disponibilité se juge ensuite, côté
 * page, sur la période choisie pour chaque véhicule (engins-chantier.ts).
 */
export function useEnginsCandidats(idChantier: number | undefined) {
  return useQuery({ queryKey: ficheChantierKeys.candidats(idChantier), queryFn: () => listerCandidats(idChantier) });
}

function useInvalidationFiche() {
  const queryClient = useQueryClient();
  return (fiche: FicheChantier) => {
    const id = fiche.chantier.idChantier;
    queryClient.setQueryData(ficheChantierKeys.fiche(id), fiche);
    void queryClient.invalidateQueries({ queryKey: chantiersKeys.liste });
    void queryClient.invalidateQueries({ queryKey: ["fiche-chantier", "candidats"] });
    void queryClient.invalidateQueries({ queryKey: ["fiche-chantier", "conducteurs"] });
    void queryClient.invalidateQueries({ queryKey: affectationsConducteurChantierKeys.parChantier(id) });
    void queryClient.invalidateQueries({ queryKey: affectationsChantierKeys.parChantier(id) });
    void queryClient.invalidateQueries({ queryKey: besoinsMaterielChantierKeys.parChantier(id) });
  };
}

export function useCreerFicheChantier() {
  const invalider = useInvalidationFiche();
  return useMutation({ mutationFn: creerFiche, onSuccess: invalider });
}

export function useModifierFicheChantier(idChantier: number) {
  const invalider = useInvalidationFiche();
  return useMutation({
    mutationFn: (requete: FicheChantierRequest) => modifierFiche(idChantier, requete),
    onSuccess: invalider,
  });
}
