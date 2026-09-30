import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlertes } from "@/features/alertes/api";
import { useMaintenances } from "@/features/maintenance/api";
import { objetMaintenance } from "@/features/maintenance/objet-maintenance";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { alertesDuVehicule, maintenancesDuVehicule } from "@/features/historique-engin/historique";
import { PastilleNiveau } from "@/features/historique-engin/PastilleNiveau";
import { NIVEAU_PRIORITE } from "@/features/rapport-engin/construire-rapport";
import { formatDate, formatDateTime, formatMontant, libelleEnum } from "@/lib/utils";
import type { StatutMaintenance } from "@/types/maintenance";
import { texteSuivi } from "@/features/alertes/traitement";

const VARIANTE_STATUT_MAINTENANCE: Record<StatutMaintenance, BadgeProps["variant"]> = {
  PLANIFIEE: "default",
  EN_COURS: "warning",
  TERMINEE: "success",
};

/** Onglet « Alertes et maintenance » : toutes les alertes (traitées comprises) et toutes les maintenances du véhicule. */
export function OngletAlertesMaintenance({ idEngin }: { idEngin: number }) {
  const alertes = useAlertes(false);
  const maintenances = useMaintenances();
  const listeAlertes = alertesDuVehicule(alertes.data ?? [], idEngin);
  const listeMaintenances = maintenancesDuVehicule(maintenances.data ?? [], idEngin);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h3 className="font-display text-base font-semibold">Alertes</h3>
        <EtatSource
          enChargement={alertes.isPending && !alertes.isError}
          enErreur={alertes.isError}
          vide={listeAlertes.length === 0}
          messageVide="Aucune alerte pour ce véhicule."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Suivi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listeAlertes.map((a) => (
                <TableRow key={a.idAlerte}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(a.dateCreation)}</TableCell>
                  <TableCell>{libelleEnum(a.type)}</TableCell>
                  <TableCell>
                    <PastilleNiveau niveau={NIVEAU_PRIORITE[a.priorite]} libelle={libelleEnum(a.priorite)} />
                  </TableCell>
                  <TableCell className="max-w-md">{a.description}</TableCell>
                  <TableCell className="max-w-xs text-muted-foreground">
                    {texteSuivi(a)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </EtatSource>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-base font-semibold">Maintenances</h3>
        <EtatSource
          enChargement={maintenances.isPending && !maintenances.isError}
          enErreur={maintenances.isError}
          vide={listeMaintenances.length === 0}
          messageVide="Aucune maintenance pour ce véhicule."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Période</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Atelier</TableHead>
                <TableHead className="text-right">Coût</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listeMaintenances.map((m) => (
                <TableRow key={m.idMaintenance}>
                  <TableCell className="whitespace-nowrap">
                    {m.dateDebut ? formatDate(m.dateDebut.slice(0, 10)) : "À planifier"}
                    {m.dateFin && ` → ${formatDate(m.dateFin.slice(0, 10))}`}
                  </TableCell>
                  <TableCell>{libelleEnum(m.type)}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANTE_STATUT_MAINTENANCE[m.statut]}>{libelleEnum(m.statut)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">{objetMaintenance(m) ?? "—"}</TableCell>
                  <TableCell>{m.nomGarageExterne ?? "Atelier interne"}</TableCell>
                  <TableCell className="text-right">
                    {/* Coût figé à la clôture ; avant, le coût calculé à l'instant (pièces + main-d'œuvre, V46). */}
                    {formatMontant(m.coutTotal ?? m.coutCalcule)}
                    {m.coutTotal == null && m.coutCalcule != null && m.coutCalcule > 0 && (
                      <span className="block text-xs text-muted-foreground">provisoire</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </EtatSource>
      </section>
    </div>
  );
}
