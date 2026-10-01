import { useSearchParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OngletAdoption } from "@/features/suivi-logiciel/onglets/OngletAdoption";
import { OngletConnexions } from "@/features/suivi-logiciel/onglets/OngletConnexions";
import { OngletQualiteDonnees } from "@/features/suivi-logiciel/onglets/OngletQualiteDonnees";
import { ONGLETS_SUIVI, type OngletSuivi } from "@/features/suivi-logiciel/suivi-logiciel";

/**
 * Suivi du logiciel (2026-09-29, questions sur le logiciel) : adoption,
 * qualité des données, journal des connexions. Capacité ADMINISTRER.
 * Lien direct : ?onglet=adoption|donnees|connexions.
 */
export function SuiviLogicielPage() {
  const [params, setParams] = useSearchParams();
  const demande = params.get("onglet");
  const onglet: OngletSuivi = ONGLETS_SUIVI.includes(demande as OngletSuivi) ? (demande as OngletSuivi) : "adoption";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <Activity className="h-6 w-6 text-primary" aria-hidden="true" />
          Suivi du logiciel
        </h1>
        <p className="text-sm text-muted-foreground">Utilisateurs de l'application, données manquantes dans les fiches et historique des connexions.</p>
      </div>
      <Tabs value={onglet} onValueChange={(v) => setParams({ onglet: v }, { replace: true })}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="adoption">Adoption</TabsTrigger>
          <TabsTrigger value="donnees">Qualité des données</TabsTrigger>
          <TabsTrigger value="connexions">Connexions</TabsTrigger>
        </TabsList>
        <TabsContent value="adoption" className="mt-4">
          <OngletAdoption actif={onglet === "adoption"} />
        </TabsContent>
        <TabsContent value="donnees" className="mt-4">
          <OngletQualiteDonnees actif={onglet === "donnees"} />
        </TabsContent>
        <TabsContent value="connexions" className="mt-4">
          <OngletConnexions actif={onglet === "connexions"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
