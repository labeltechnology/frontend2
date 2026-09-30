import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { incidentsDuVehicule } from "@/features/historique-engin/historique";
import { PastilleNiveau } from "@/features/historique-engin/PastilleNiveau";
import { useIncidents } from "@/features/incidents/api";
import { NIVEAU_GRAVITE_INCIDENT } from "@/features/rapport-engin/bloc-incidents";
import { formatDate, formatMontant, libelleEnum } from "@/lib/utils";
import type { StatutIncident } from "@/types/incident";

const VARIANTE_STATUT: Record<StatutIncident, BadgeProps["variant"]> = {
  DECLARE: "warning",
  EN_TRAITEMENT: "default",
  CLOTURE: "secondary",
};

/** Onglet « Incidents » (2026-09-25) : tous les incidents du véhicule, ouverts et clôturés, du plus récent au plus ancien. */
export function OngletIncidents({ idEngin }: { idEngin: number }) {
  const incidents = useIncidents();
  const liste = incidentsDuVehicule(incidents.data ?? [], idEngin);

  return (
    <EtatSource
      enChargement={incidents.isPending && !incidents.isError}
      enErreur={incidents.isError}
      vide={liste.length === 0}
      messageVide="Aucun incident enregistré pour ce véhicule."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Survenu le</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Gravité</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Clôture</TableHead>
            <TableHead className="text-right">Coût estimé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((i) => (
            <TableRow key={i.idIncident}>
              <TableCell className="whitespace-nowrap">{formatDate(i.dateSurvenue.slice(0, 10))}</TableCell>
              <TableCell className="font-medium">{libelleEnum(i.type)}</TableCell>
              <TableCell>
                <PastilleNiveau niveau={NIVEAU_GRAVITE_INCIDENT[i.gravite]} libelle={libelleEnum(i.gravite)} />
              </TableCell>
              <TableCell className="max-w-xs">{i.description}</TableCell>
              <TableCell>
                <Badge variant={VARIANTE_STATUT[i.statut]}>{libelleEnum(i.statut)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {i.dateCloture ? `${formatDate(i.dateCloture.slice(0, 10))}${i.compteRendu ? ` — ${i.compteRendu}` : ""}` : "—"}
              </TableCell>
              <TableCell className="text-right">{i.coutEstime != null ? formatMontant(i.coutEstime) : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
