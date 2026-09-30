import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHistoriqueControlesBord } from "@/features/historique-engin/api";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { grouperControlesParDate } from "@/features/historique-engin/historique";
import { PastilleNiveau } from "@/features/historique-engin/PastilleNiveau";
import { formatDate } from "@/lib/utils";
import type { CategorieElementBord } from "@/types/equipement-bord";

const LIBELLES_CATEGORIE: Record<CategorieElementBord, string> = {
  SECURITE: "Pharmacie et sécurité",
  OUTIL: "Boîte à outils",
};

/**
 * Onglet « Sécurité et outils » : chaque contrôle des éléments de bord (V44),
 * du plus récent au plus ancien, avec les absents en tête de chaque contrôle.
 */
export function OngletEquipements({ idEngin }: { idEngin: number }) {
  const historique = useHistoriqueControlesBord(idEngin);
  const controles = grouperControlesParDate(historique.data ?? []);

  return (
    <EtatSource
      enChargement={historique.isPending && !historique.isError}
      enErreur={historique.isError}
      vide={controles.length === 0}
      messageVide="Aucun contrôle de sécurité ni de boîte à outils enregistré."
    >
      <div className="space-y-6">
        {controles.map(({ dateControle, controles: lignes }) => {
          const absents = lignes.filter((l) => !l.present).length;
          return (
            <section key={dateControle} className="space-y-2">
              <h3 className="flex flex-wrap items-center gap-2 font-display text-base font-semibold">
                Contrôle du {formatDate(dateControle)}
                <PastilleNiveau
                  niveau={absents > 0 ? "alerte" : "ok"}
                  libelle={absents > 0 ? `${absents} absent${absents > 1 ? "s" : ""}` : "Tout est présent"}
                />
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élément</TableHead>
                    <TableHead>Rubrique</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Observation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((l) => (
                    <TableRow key={l.idControle}>
                      <TableCell className="font-medium">{l.libelle}</TableCell>
                      <TableCell>{LIBELLES_CATEGORIE[l.categorie]}</TableCell>
                      <TableCell>
                        {l.present ? <Badge variant="success">Présent</Badge> : <Badge variant="destructive">Absent</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.observation ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          );
        })}
      </div>
    </EtatSource>
  );
}
