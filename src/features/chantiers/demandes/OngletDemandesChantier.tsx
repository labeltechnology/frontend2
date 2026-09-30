import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemandeDialog } from "@/features/chantiers/demandes/DemandeDialog";
import { ListeDemandes } from "@/features/chantiers/demandes/ListeDemandes";
import { useDemandes } from "@/features/chantiers/demandes/demandes-api";
import type { Chantier, PrioriteChantier } from "@/types/chantier";

/** Onglet « Demandes » de la fiche chantier (V64) : demandes de matériel du chantier. */
export function OngletDemandesChantier({
  chantier,
  prioriteChantier,
  peutDemander,
  gestion,
  idUtilisateur,
}: {
  chantier: Chantier;
  prioriteChantier: PrioriteChantier;
  peutDemander: boolean;
  gestion: boolean;
  idUtilisateur: number | undefined;
}) {
  const { data, isLoading, isError } = useDemandes(chantier.idChantier);
  const [nouvelle, setNouvelle] = useState(false);
  const ouvert = chantier.statut === "PLANIFIE" || chantier.statut === "EN_COURS";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Le chantier demande des véhicules ; la gestion du parc répond, puis prévoit les véhicules sur la fiche. La demande passe
          « servie » automatiquement.
        </p>
        {peutDemander && ouvert && (
          <Button type="button" onClick={() => setNouvelle(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle demande
          </Button>
        )}
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Chargement des demandes…</p>}
      {isError && <p className="text-sm text-destructive">Impossible de charger les demandes.</p>}
      {data && <ListeDemandes demandes={data} avecChantier={false} gestion={gestion} idUtilisateur={idUtilisateur} />}
      {nouvelle && <DemandeDialog chantier={chantier} prioriteChantier={prioriteChantier} onClose={() => setNouvelle(false)} />}
    </div>
  );
}
