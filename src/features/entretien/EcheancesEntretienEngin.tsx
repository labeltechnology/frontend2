import { useState } from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { useAuth } from "@/features/auth/useAuth";
import { useEcheancesEntretien } from "@/features/entretien/api";
import {
  LIBELLES_STATUT_ECHEANCE,
  VARIANTE_STATUT_ECHEANCE,
  decrireEcheance,
} from "@/features/entretien/echeance";
import { InterventionEntretienDialog } from "@/features/entretien/InterventionEntretienDialog";
import { formatDate, formatNombre } from "@/lib/utils";
import type { EcheanceEntretien } from "@/types/entretien";
import { peut } from "@/lib/droits";

interface EcheancesEntretienEnginProps {
  idEngin: number;
  compteurActuel: number | null;
}

/**
 * Échéancier d'entretien d'un engin existant (onglet de la fiche véhicule) :
 * un bloc de la fiche papier par ligne, statut calculé par le backend.
 * « Intervention effectuée » réservé à GERER_MAINTENANCE (DG, responsable du
 * parc, chef de maintenance — lib/droits.ts), comme côté backend.
 */
export function EcheancesEntretienEngin({ idEngin, compteurActuel }: EcheancesEntretienEnginProps) {
  const { session } = useAuth();
  const peutSaisir = peut(session?.role, "GERER_MAINTENANCE");
  const { data: echeances, isLoading, isError } = useEcheancesEntretien(idEngin);
  const [cible, setCible] = useState<EcheanceEntretien | null>(null);

  const colonnes: DataTableColumn<EcheanceEntretien>[] = [
    { key: "poste", header: "Poste", render: (e) => <span className="font-medium">{e.libelle}</span> },
    {
      key: "derniere",
      header: "Dernière intervention",
      render: (e) =>
        e.dateDerniereIntervention || e.compteurDerniereIntervention != null ? (
          <span>
            {e.dateDerniereIntervention ? formatDate(e.dateDerniereIntervention) : "Date inconnue"}
            {e.compteurDerniereIntervention != null && (
              <span className="text-muted-foreground"> — {formatNombre(e.compteurDerniereIntervention)} {e.uniteCompteur}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "prochaine",
      header: "Prochaine échéance",
      render: (e) => decrireEcheance(e.prochaineDate, e.prochainCompteur, e.uniteCompteur) ?? "—",
    },
    {
      key: "statut",
      header: "Statut",
      render: (e) => <Badge variant={VARIANTE_STATUT_ECHEANCE[e.statut]}>{LIBELLES_STATUT_ECHEANCE[e.statut]}</Badge>,
    },
    { key: "observation", header: "Observations", render: (e) => e.observation ?? "—" },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Entretien du véhicule</CardTitle>
        <p className="text-sm text-muted-foreground">
          Échéances calculées à partir de la dernière intervention et des intervalles de chaque poste. Une alerte est
          émise à l'approche puis au dépassement.
        </p>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={colonnes}
          data={echeances}
          isLoading={isLoading}
          isError={isError}
          getRowKey={(e) => e.idPosteEntretien}
          emptyMessage="Aucun poste d'entretien ne s'applique à ce véhicule."
          rowActions={
            peutSaisir
              ? (e) => (
                  <Button variant="outline" size="sm" onClick={() => setCible(e)}>
                    <Wrench className="h-4 w-4" />
                    Intervention effectuée
                  </Button>
                )
              : undefined
          }
        />
      </CardContent>
      <InterventionEntretienDialog
        idEngin={idEngin}
        compteurActuel={compteurActuel}
        echeance={cible}
        onOpenChange={(open) => !open && setCible(null)}
      />
    </Card>
  );
}
