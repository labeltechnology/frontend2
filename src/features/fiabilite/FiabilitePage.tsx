import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Settings2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/useAuth";
import { useTypesEngin } from "@/features/engins/api";
import { OngletConformite } from "@/features/fiabilite/onglets/OngletConformite";
import { OngletFiabilite } from "@/features/fiabilite/onglets/OngletFiabilite";
import { OngletSinistres } from "@/features/fiabilite/onglets/OngletSinistres";
import { ReglagesTypesDialog } from "@/features/fiabilite/ReglagesTypesDialog";
import { peut } from "@/lib/droits";

const ONGLETS = ["fiabilite", "conformite", "sinistres"] as const;
type Onglet = (typeof ONGLETS)[number];

/**
 * Fiabilité et conformité (2026-09-29, questions du DG « maintenance et
 * fiabilité », « conformité et risques »). Choix validés : contrôle qualité
 * simple à la clôture ; contrôle permis / CACES bloquant au démarrage ;
 * fatigue « conduite continue + journée » réglable ; volet « Sinistre » de
 * l'incident. Trois onglets (?onglet=fiabilite|conformite|sinistres), chacun
 * ne charge ses données qu'une fois ouvert.
 */
export function FiabilitePage() {
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const [reglages, setReglages] = useState(false);
  const demande = params.get("onglet");
  const onglet: Onglet = ONGLETS.includes(demande as Onglet) ? (demande as Onglet) : "fiabilite";
  const types = useTypesEngin();
  const listeTypes = useMemo(
    () => [...(types.data ?? [])].filter((t) => t.actif).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
    [types.data],
  );
  const peutGerer = peut(session?.role, "GERER_PARC");

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            Fiabilité et conformité
          </h1>
          <p className="text-sm text-muted-foreground">
            Pannes, immobilisations, réparations et entretiens ; documents, qualifications et fatigue ; sinistres.
          </p>
        </div>
        {peutGerer && (
          <Button variant="outline" onClick={() => setReglages(true)}>
            <Settings2 className="h-4 w-4" /> Réglages par type
          </Button>
        )}
      </div>

      <Tabs value={onglet} onValueChange={(v) => setParams({ onglet: v }, { replace: true })}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="fiabilite">Fiabilité et entretien</TabsTrigger>
          <TabsTrigger value="conformite">Conformité</TabsTrigger>
          <TabsTrigger value="sinistres">Sinistres</TabsTrigger>
        </TabsList>
        <TabsContent value="fiabilite" className="mt-4">
          {onglet === "fiabilite" && <OngletFiabilite types={listeTypes} peutGenererRapport={peut(session?.role, "CONSULTER_GESTION")} />}
        </TabsContent>
        <TabsContent value="conformite" className="mt-4">
          <OngletConformite actif={onglet === "conformite"} peutReglerFatigue={peut(session?.role, "ADMINISTRER")} />
        </TabsContent>
        <TabsContent value="sinistres" className="mt-4">
          {onglet === "sinistres" && <OngletSinistres actif peutModifier={peutGerer} />}
        </TabsContent>
      </Tabs>

      <ReglagesTypesDialog open={reglages} onOpenChange={setReglages} />
    </div>
  );
}
