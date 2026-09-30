import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/useAuth";
import { useTypesEngin } from "@/features/engins/api";
import { OngletBudget } from "@/features/couts/onglets/OngletBudget";
import { OngletConduite } from "@/features/couts/onglets/OngletConduite";
import { OngletPrevisions } from "@/features/couts/onglets/OngletPrevisions";
import { OngletProblemes } from "@/features/couts/onglets/OngletProblemes";
import { OngletTco } from "@/features/couts/onglets/OngletTco";
import { peut } from "@/lib/droits";

const ONGLETS = ["tco", "problemes", "budget", "previsions", "conduite"] as const;
type Onglet = (typeof ONGLETS)[number];

/**
 * Coûts et rentabilité (2026-09-29, questions du DG). Choix validés : coûts
 * fixes saisis dans l'onglet « Coûts » de la fiche ; seuils « à surveiller /
 * à remplacer » dans Paramètres ; budget carburant annuel par type réparti par
 * mois ; score de conduite avec Traccar et survitesses.
 *
 * Cinq onglets (lien direct : ?onglet=tco|problemes|budget|previsions|conduite) ;
 * « Prévisions » (2026-09-29) : tendances et projections sur 12 mois ;
 * chacun ne charge ses données qu'une fois ouvert.
 */
export function CoutsPage() {
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const demande = params.get("onglet");
  const onglet: Onglet = ONGLETS.includes(demande as Onglet) ? (demande as Onglet) : "tco";
  const types = useTypesEngin();
  const listeTypes = useMemo(
    () => [...(types.data ?? [])].filter((t) => t.actif).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
    [types.data],
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <Wallet className="h-6 w-6 text-primary" aria-hidden="true" />
          Coûts et rentabilité
        </h1>
        <p className="text-sm text-muted-foreground">
          Coût complet de chaque véhicule, véhicules à surveiller ou à remplacer, budget carburant, prévisions et conduite.
        </p>
      </div>

      <Tabs value={onglet} onValueChange={(v) => setParams({ onglet: v }, { replace: true })}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="tco">Coût complet (TCO)</TabsTrigger>
          <TabsTrigger value="problemes">Véhicules à problèmes</TabsTrigger>
          <TabsTrigger value="budget">Budget carburant</TabsTrigger>
          <TabsTrigger value="previsions">Prévisions</TabsTrigger>
          <TabsTrigger value="conduite">Conduite</TabsTrigger>
        </TabsList>
        <TabsContent value="tco" className="mt-4">
          {onglet === "tco" && <OngletTco types={listeTypes} peutGenererRapport={peut(session?.role, "CONSULTER_GESTION")} />}
        </TabsContent>
        <TabsContent value="problemes" className="mt-4">
          <OngletProblemes actif={onglet === "problemes"} peutRegler={peut(session?.role, "ADMINISTRER")} />
        </TabsContent>
        <TabsContent value="budget" className="mt-4">
          <OngletBudget actif={onglet === "budget"} types={listeTypes} peutModifier={peut(session?.role, "GERER_PARC")} />
        </TabsContent>
        <TabsContent value="previsions" className="mt-4">
          <OngletPrevisions actif={onglet === "previsions"} types={listeTypes} />
        </TabsContent>
        <TabsContent value="conduite" className="mt-4">
          <OngletConduite actif={onglet === "conduite"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
