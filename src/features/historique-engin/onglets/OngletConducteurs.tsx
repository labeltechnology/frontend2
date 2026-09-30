import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAffectations } from "@/features/affectations/api";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { affectationsDuVehicule } from "@/features/historique-engin/historique";
import { formatDate, libelleEnum } from "@/lib/utils";
import type { StatutAffectation } from "@/types/affectation";

const VARIANTE_STATUT: Record<StatutAffectation, BadgeProps["variant"]> = {
  ACTIVE: "success",
  TERMINEE: "secondary",
  ANNULEE: "outline",
};

/** Onglet « Conducteurs » : toutes les affectations conducteur ↔ véhicule, de la plus récente à la plus ancienne. */
export function OngletConducteurs({ idEngin }: { idEngin: number }) {
  const affectations = useAffectations();
  const liste = affectationsDuVehicule(affectations.data ?? [], idEngin);

  return (
    <EtatSource
      enChargement={affectations.isPending && !affectations.isError}
      enErreur={affectations.isError}
      vide={liste.length === 0}
      messageVide="Aucun conducteur n'a été affecté à ce véhicule."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conducteur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Du</TableHead>
            <TableHead>Au</TableHead>
            <TableHead>Affectation</TableHead>
            <TableHead>Remarque</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((a) => (
            <TableRow key={a.idAffectation}>
              <TableCell className="font-medium">
                {a.conducteur.prenom} {a.conducteur.nom}
                <span className="ml-1 text-xs text-muted-foreground">({a.conducteur.matricule})</span>
              </TableCell>
              <TableCell>{a.conducteur.telephone ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(a.dateDebut.slice(0, 10))}</TableCell>
              <TableCell className="whitespace-nowrap">{a.dateFin ? formatDate(a.dateFin.slice(0, 10)) : "—"}</TableCell>
              <TableCell>
                <Badge variant={VARIANTE_STATUT[a.statut]}>{libelleEnum(a.statut)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{a.motifAnnulation ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
