import { useMemo, type ComponentType } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEngins } from "@/features/engins/api";
import { ONGLETS_HISTORIQUE, ongletDepuisParametre, type OngletHistorique } from "@/features/historique-engin/onglets";
import { OngletAlertesMaintenance } from "@/features/historique-engin/onglets/OngletAlertesMaintenance";
import { OngletCarburant } from "@/features/historique-engin/onglets/OngletCarburant";
import { OngletConducteurs } from "@/features/historique-engin/onglets/OngletConducteurs";
import { OngletDocuments } from "@/features/historique-engin/onglets/OngletDocuments";
import { OngletEmplacements } from "@/features/historique-engin/onglets/OngletEmplacements";
import { OngletEntretien } from "@/features/historique-engin/onglets/OngletEntretien";
import { OngletEquipements } from "@/features/historique-engin/onglets/OngletEquipements";
import { OngletIncidents } from "@/features/historique-engin/onglets/OngletIncidents";
import { identifiantVehicule } from "@/lib/vehicule";

/** Contenu de chaque onglet ; un onglet n'est monté (et ses données chargées) que lorsqu'il est ouvert. */
const CONTENU_ONGLET: Record<OngletHistorique, ComponentType<{ idEngin: number }>> = {
  alertes: OngletAlertesMaintenance,
  documents: OngletDocuments,
  equipements: OngletEquipements,
  entretien: OngletEntretien,
  emplacement: OngletEmplacements,
  conducteur: OngletConducteurs,
  carburant: OngletCarburant,
  incidents: OngletIncidents,
};

/**
 * Historique du véhicule (2026-09-25) : page ouverte par le bouton « Voir
 * détail » de chaque carte du rapport, directement sur l'onglet de la carte
 * (`?onglet=`, voir onglets.ts). Lecture seule ; un onglet par rubrique du
 * rapport, chacun dans son propre fichier (dossier onglets/).
 */
export function HistoriqueEnginPage() {
  const navigate = useNavigate();
  const { idEngin } = useParams<{ idEngin: string }>();
  const [parametres, setParametres] = useSearchParams();
  const onglet = ongletDepuisParametre(parametres.get("onglet"));
  const { data: engins, isLoading, isError } = useEngins();
  const engin = useMemo(() => engins?.find((e) => String(e.idEngin) === idEngin), [engins, idEngin]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }
  if (isError || !engin) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{isError ? "Impossible de charger les véhicules." : "Véhicule introuvable."}</p>
        <Button variant="outline" onClick={() => navigate("/engins")}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux véhicules
        </Button>
      </div>
    );
  }

  const changerOnglet = (valeur: string) => setParametres({ onglet: ongletDepuisParametre(valeur) }, { replace: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Historique du véhicule {identifiantVehicule(engin)}</h2>
          <p className="text-sm text-muted-foreground">
            {engin.marque} {engin.modele} — du plus récent au plus ancien.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => navigate(`/engins/${engin.idEngin}/rapport`)}>
            <ArrowLeft className="h-4 w-4" />
            Retour au rapport
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/engins/${engin.idEngin}/fiche`)}>
            <Pencil className="h-4 w-4" />
            Modifier la fiche
          </Button>
        </div>
      </div>

      <Tabs value={onglet} onValueChange={changerOnglet}>
        <TabsList className="h-auto flex-wrap justify-start">
          {ONGLETS_HISTORIQUE.map((o) => (
            <TabsTrigger key={o.cle} value={o.cle}>
              {o.libelle}
            </TabsTrigger>
          ))}
        </TabsList>
        {ONGLETS_HISTORIQUE.map((o) => {
          const Contenu = CONTENU_ONGLET[o.cle];
          return (
            <TabsContent key={o.cle} value={o.cle}>
              <Card className="p-4">
                <Contenu idEngin={engin.idEngin} />
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
