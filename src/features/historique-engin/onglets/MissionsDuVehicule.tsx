import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { missionsDuVehicule } from "@/features/historique-engin/historique";
import { useMissions } from "@/features/missions/api";
import { formatDateTime, libelleEnum } from "@/lib/utils";
import type { StatutMission } from "@/types/mission";

const VARIANTE_STATUT: Record<StatutMission, BadgeProps["variant"]> = {
  PLANIFIEE: "default",
  EN_COURS: "warning",
  TERMINEE: "success",
  ANNULEE: "outline",
};

/** Missions du véhicule (onglet « Emplacements » de l'historique, 2026-09-25), de la plus récente à la plus ancienne. */
export function MissionsDuVehicule({ idEngin }: { idEngin: number }) {
  const missions = useMissions();
  const liste = missionsDuVehicule(missions.data ?? [], idEngin);

  return (
    <EtatSource
      enChargement={missions.isPending && !missions.isError}
      enErreur={missions.isError}
      vide={liste.length === 0}
      messageVide="Aucune mission pour ce véhicule."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Motif</TableHead>
            <TableHead>Période prévue</TableHead>
            <TableHead>Conducteur</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Remarque</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((m) => (
            <TableRow key={m.idMission}>
              <TableCell className="font-medium">{m.motif}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(m.dateDebutPrevue)} → {formatDateTime(m.dateFinPrevue)}
              </TableCell>
              <TableCell>
                {m.conducteur.prenom} {m.conducteur.nom}
              </TableCell>
              <TableCell>
                <Badge variant={VARIANTE_STATUT[m.statut]}>{libelleEnum(m.statut)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.statut === "ANNULEE" ? (m.motifAnnulation ?? "Annulée") : m.dateFinReelle ? `Retour le ${formatDateTime(m.dateFinReelle)}` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
