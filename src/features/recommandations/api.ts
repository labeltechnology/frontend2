import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Recommandations } from "@/types/recommandation";

export function useRecommandations() {
  return useQuery({
    queryKey: ["recommandations"],
    queryFn: async () => (await apiClient.get<Recommandations>("/api/recommandations")).data,
    staleTime: 5 * 60 * 1000,
  });
}
