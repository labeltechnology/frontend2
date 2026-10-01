import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHistoriqueInterventions } from "@/features/historique-engin/api";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { formatDate, formatNombre } from "@/lib/utils";
import type { OrigineIntervention } from "@/types/historique-engin";

const LIBELLES_ORIGINE: Record<OrigineIntervention, string> = {
  FICHE_CREATION: "Fiche de création",
  SAISIE: "Saisie sur la fiche",
  MAINTENANCE: "Clôture de maintenance",
  REPRISE: "Reprise de l'historique antérieur",
};

/** Onglet « Entretien » : chaque intervention d'entretien périodique enregistrée (V44), de la plus récente à la plus ancienne. */
export function OngletEntretien({ idEngin }: { idEngin: number }) {
  const historique = useHistoriqueInterventions(idEngin);
  const liste = historique.data ?? [];

  return (
    <EtatSource
      enChargement={historique.isPending && !historique.isError}
      enErreur={historique.isError}
      vide={liste.length === 0}
      messageVide="Aucune intervention d'entretien enregistrée pour ce véhicule."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Poste d'entretien</TableHead>
            <TableHead className="text-right">Compteur</TableHead>
            <TableHead>Origine</TableHead>
            <TableHead>Observation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((i) => (
            <TableRow key={i.idIntervention}>
              <TableCell className="whitespace-nowrap">{formatDate(i.dateIntervention)}</TableCell>
              <TableCell className="font-medium">{i.libellePoste}</TableCell>
              <TableCell className="whitespace-nowrap text-right">
                {i.compteur != null ? `${formatNombre(i.compteur)} ${i.unite}` : "—"}
              </TableCell>
              <TableCell>{LIBELLES_ORIGINE[i.origine]}</TableCell>
              <TableCell className="text-muted-foreground">{i.observation ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
