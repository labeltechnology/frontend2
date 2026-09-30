import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDocuments } from "@/features/documents/api";
import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { documentsDuVehicule } from "@/features/historique-engin/historique";
import { PastilleNiveau } from "@/features/historique-engin/PastilleNiveau";
import { niveauDocument } from "@/features/rapport-engin/construire-rapport";
import { formatDate } from "@/lib/utils";

/**
 * Onglet « Documents » : tous les documents du véhicule, versions remplacées
 * comprises. Le document en vigueur porte la couleur du rapport (expiré,
 * bientôt expiré, valide) ; une version remplacée reste en retrait.
 */
export function OngletDocuments({ idEngin }: { idEngin: number }) {
  const documents = useDocuments();
  const aujourdhui = new Date();
  const liste = documentsDuVehicule(documents.data ?? [], idEngin);

  return (
    <EtatSource
      enChargement={documents.isPending && !documents.isError}
      enErreur={documents.isError}
      vide={liste.length === 0}
      messageVide="Aucun document enregistré pour ce véhicule."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Émission</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>État</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((d) => {
            const { niveau, detail } = niveauDocument(d, aujourdhui);
            return (
              <TableRow key={d.idDocument} className={d.actif ? undefined : "text-muted-foreground"}>
                <TableCell className="font-medium">{LIBELLES_TYPE_DOCUMENT[d.type]}</TableCell>
                <TableCell>{d.numeroReference ?? "—"}</TableCell>
                <TableCell>{formatDate(d.dateDebut?.slice(0, 10))}</TableCell>
                <TableCell>{formatDate(d.dateExpiration?.slice(0, 10))}</TableCell>
                <TableCell>v{d.version}</TableCell>
                <TableCell>
                  {d.actif ? <PastilleNiveau niveau={niveau} libelle={detail} /> : <Badge variant="outline">Remplacé</Badge>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
