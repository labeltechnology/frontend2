import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FileDown, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/useAuth";
import { useGenererRapport } from "@/features/rapports/api";
import { RapportApercuDialog } from "@/features/rapports/RapportApercuDialog";
import { OngletBesoins } from "@/features/renouvellement/onglets/OngletBesoins";
import { OngletFinDeVie } from "@/features/renouvellement/onglets/OngletFinDeVie";
import { OngletPlan } from "@/features/renouvellement/onglets/OngletPlan";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import type { Rapport } from "@/types/rapport";

const ONGLETS = ["plan", "besoins", "fin-de-vie"] as const;
type Onglet = (typeof ONGLETS)[number];

/**
 * Renouvellement du parc (2026-09-29, questions du DG « âge moyen,
 * stratégie », « besoins futurs », « fin de vie », « électrique / hybride »).
 * Trois onglets (?onglet=plan|besoins|fin-de-vie), photo d'aujourd'hui.
 */
export function RenouvellementPage() {
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const demande = params.get("onglet");
  const onglet: Onglet = ONGLETS.includes(demande as Onglet) ? (demande as Onglet) : "plan";
  const generer = useGenererRapport();
  const [rapport, setRapport] = useState<Rapport | null>(null);

  const genererPdf = async () => {
    try {
      setRapport(await generer.mutateAsync({ type: "RENOUVELLEMENT" }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Génération du rapport impossible");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
            <RefreshCw className="h-6 w-6 text-primary" aria-hidden="true" />
            Renouvellement du parc
          </h1>
          <p className="text-sm text-muted-foreground">Échéances de remplacement de chaque véhicule, besoins futurs du parc et produit des véhicules sortis.</p>
        </div>
        <Button variant="outline" onClick={genererPdf} disabled={generer.isPending}>
          {generer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Rapport PDF
        </Button>
      </div>

      <Tabs value={onglet} onValueChange={(v) => setParams({ onglet: v }, { replace: true })}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="plan">Plan de renouvellement</TabsTrigger>
          <TabsTrigger value="besoins">Besoins futurs</TabsTrigger>
          <TabsTrigger value="fin-de-vie">Fin de vie</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="mt-4">
          <OngletPlan actif={onglet === "plan"} />
        </TabsContent>
        <TabsContent value="besoins" className="mt-4">
          <OngletBesoins actif={onglet === "besoins"} />
        </TabsContent>
        <TabsContent value="fin-de-vie" className="mt-4">
          <OngletFinDeVie actif={onglet === "fin-de-vie"} peutModifier={peut(session?.role, "GERER_PARC")} />
        </TabsContent>
      </Tabs>

      <RapportApercuDialog rapport={rapport} onOpenChange={(open) => !open && setRapport(null)} onRegenere={setRapport} />
    </div>
  );
}
