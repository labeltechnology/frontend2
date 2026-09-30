import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCarburant, useConsommationMoyenne } from "@/features/carburant/api";
import { libelleApprovisionnement } from "@/features/carburant/approvisionnement";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { pleinsDuVehicule } from "@/features/historique-engin/historique";
import { formatDateTime, formatMontant, formatNombre } from "@/lib/utils";

/** Onglet « Carburant » (2026-09-25) : tous les pleins du véhicule, du plus récent au plus ancien. */
export function OngletCarburant({ idEngin }: { idEngin: number }) {
  const pleins = useCarburant();
  const consommation = useConsommationMoyenne(idEngin);
  const liste = pleinsDuVehicule(pleins.data ?? [], idEngin);
  const totalLitres = liste.reduce((s, p) => s + p.quantiteLitres, 0);
  const totalMontant = liste.reduce((s, p) => s + p.montantTotal, 0);
  const moyenne = consommation.data && consommation.data.litresAux100Km > 0 ? consommation.data.litresAux100Km : null;

  return (
    <EtatSource
      enChargement={pleins.isPending && !pleins.isError}
      enErreur={pleins.isError}
      vide={liste.length === 0}
      messageVide="Aucun plein enregistré pour ce véhicule."
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {formatNombre(totalLitres, 1)} L pour {formatMontant(totalMontant)}
        {moyenne !== null && <> — consommation moyenne {formatNombre(moyenne, 1)} L/100 km</>}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Kilométrage</TableHead>
            <TableHead className="text-right">Litres</TableHead>
            <TableHead className="text-right">Prix unitaire</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Conducteur</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((p) => (
            <TableRow key={p.idCarburant}>
              <TableCell className="whitespace-nowrap">{formatDateTime(p.dateHeure)}</TableCell>
              <TableCell>{libelleApprovisionnement(p.typeApprovisionnement)}</TableCell>
              <TableCell className="text-right">{formatNombre(p.kilometrageAuPlein)} km</TableCell>
              <TableCell className="text-right">{formatNombre(p.quantiteLitres, 1)}</TableCell>
              <TableCell className="text-right">{formatMontant(p.prixUnitaire)}</TableCell>
              <TableCell className="text-right font-medium">{formatMontant(p.montantTotal)}</TableCell>
              <TableCell>{p.station ?? "—"}</TableCell>
              <TableCell>{p.conducteur ? `${p.conducteur.prenom} ${p.conducteur.nom}` : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
