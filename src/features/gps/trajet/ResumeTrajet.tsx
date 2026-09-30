import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuree, totauxParChantier } from "@/features/gps/trajet/periode";
import { formatDateTime, formatNombre } from "@/lib/utils";
import type { TrajetPeriode } from "@/types/carte-gps";

/** Chiffres du trajet et passages sur chantier, sous la carte (2026-09-30). */
export function ResumeTrajet({ trajet }: { trajet: TrajetPeriode }) {
  const totaux = totauxParChantier(trajet.passages);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="text-muted-foreground">Distance : </span>
          {formatNombre(trajet.distanceKm, 1)} km
        </span>
        <span>
          <span className="text-muted-foreground">Vitesse max : </span>
          {trajet.vitesseMaxKmh == null ? "—" : `${formatNombre(trajet.vitesseMaxKmh, 0)} km/h`}
        </span>
        <span>
          <span className="text-muted-foreground">Positions : </span>
          {formatNombre(trajet.nombrePositions)}
          {trajet.echantillonne && <span className="text-muted-foreground"> (tracé allégé à l'écran)</span>}
        </span>
        {totaux.length > 0 && (
          <span>
            <span className="text-muted-foreground">Sur chantier : </span>
            {totaux.map((t) => `${t.nomChantier} ${formatDuree(t.minutes)}`).join(" · ")}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium">Passages sur chantier</h3>
        {trajet.passages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun passage sur un chantier pendant cette période.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chantier</TableHead>
                <TableHead>Entrée</TableHead>
                <TableHead>Sortie</TableHead>
                <TableHead>Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trajet.passages.map((p) => (
                <TableRow key={`${p.idChantier}-${p.entree}`}>
                  <TableCell>
                    <Link to={`/chantiers/${p.idChantier}/fiche`} className="font-medium hover:underline">
                      {p.nomChantier}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(p.entree)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {p.enCours ? <Badge variant="default">Encore sur place</Badge> : formatDateTime(p.sortie)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDuree(p.dureeMinutes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
