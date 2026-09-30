import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAffectationsChantierTousChantiers, useChantiers } from "@/features/chantiers/api";
import { EtatSource } from "@/features/historique-engin/EtatSource";
import { MissionsDuVehicule } from "@/features/historique-engin/onglets/MissionsDuVehicule";
import { rattachementsDuVehicule } from "@/features/historique-engin/historique";
import { joursJusqua } from "@/features/rapport-engin/construire-rapport";
import { formatDate, libelleEnum } from "@/lib/utils";
import type { StatutAffectationChantier } from "@/types/chantier";

const VARIANTE_STATUT: Record<StatutAffectationChantier, BadgeProps["variant"]> = {
  ACTIVE: "default",
  TERMINEE: "success",
  ANNULEE: "outline",
};

/**
 * Onglet « Emplacements » : les missions du véhicule (2026-09-25, voir
 * MissionsDuVehicule) puis tous les chantiers où il a été, est ou sera prévu
 * (période du véhicule sur le chantier). En dehors, le véhicule est au siège.
 */
export function OngletEmplacements({ idEngin }: { idEngin: number }) {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h3 className="font-display text-base font-semibold">Missions</h3>
        <MissionsDuVehicule idEngin={idEngin} />
      </section>
      <section className="space-y-2">
        <h3 className="font-display text-base font-semibold">Chantiers</h3>
        <ChantiersDuVehicule idEngin={idEngin} />
      </section>
    </div>
  );
}

/** Chantiers du véhicule — même chargement que le rapport (une requête par chantier, en cache). */
function ChantiersDuVehicule({ idEngin }: { idEngin: number }) {
  const chantiers = useChantiers();
  const rattachements = useAffectationsChantierTousChantiers(chantiers.data);
  const enChargement =
    (chantiers.isPending && !chantiers.isError) || rattachements.some((q) => q.isPending && !q.isError);
  const enErreur = chantiers.isError || rattachements.some((q) => q.isError);
  const liste = rattachementsDuVehicule(
    rattachements.flatMap((q) => q.data ?? []),
    idEngin,
  );
  const aujourdhui = new Date();

  return (
    <EtatSource
      enChargement={enChargement}
      enErreur={enErreur}
      vide={liste.length === 0}
      messageVide="Ce véhicule n'a jamais été prévu sur un chantier : il est au siège."
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chantier</TableHead>
            <TableHead>Lieu</TableHead>
            <TableHead>Période du véhicule</TableHead>
            <TableHead>Rattachement</TableHead>
            <TableHead>Remarque</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liste.map((r) => {
            const aujourdHuiSurPlace =
              r.statut === "ACTIVE" &&
              joursJusqua(r.dateDebutPrevue, aujourdhui) <= 0 &&
              joursJusqua(r.dateFinPrevue, aujourdhui) >= 0;
            return (
              <TableRow key={r.idAffectationChantier}>
                <TableCell className="font-medium">
                  {r.chantier.nom}
                  {aujourdHuiSurPlace && (
                    <Badge variant="success" className="ml-2">
                      Aujourd'hui
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{r.chantier.lieu ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  du {formatDate(r.dateDebutPrevue.slice(0, 10))} au {formatDate(r.dateFinPrevue.slice(0, 10))}
                </TableCell>
                <TableCell>
                  <Badge variant={VARIANTE_STATUT[r.statut]}>{libelleEnum(r.statut)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.statut === "TERMINEE" && r.dateFin
                    ? `Retiré le ${formatDate(r.dateFin.slice(0, 10))}`
                    : r.statut === "ANNULEE"
                      ? (r.motifAnnulation ?? "Annulé")
                      : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </EtatSource>
  );
}
