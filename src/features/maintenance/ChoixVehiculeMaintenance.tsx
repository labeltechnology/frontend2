import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { useEngins } from "@/features/engins/api";
import { vehiculesProposes } from "@/features/maintenance/choix-vehicule";
import { formatNombre } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { Engin } from "@/types/engin";

const AFFICHES_MAX = 60;

/**
 * Première étape de « Nouvelle maintenance » ouverte depuis la page
 * Maintenance (2026-09-28) : recherche du véhicule (immatriculation, marque,
 * modèle, statut…), réformés et vendus exclus, statut et compteur visibles.
 */
export function ChoixVehiculeMaintenance({ onChoisir }: { onChoisir: (engin: Engin) => void }) {
  const { data: engins, isLoading, isError } = useEngins();
  const [recherche, setRecherche] = useState("");
  const proposes = useMemo(() => vehiculesProposes(engins ?? [], recherche), [engins, recherche]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          autoFocus
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Immatriculation, marque, modèle, statut…"
          aria-label="Rechercher un véhicule"
          className="pl-8"
        />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des véhicules…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Liste des véhicules indisponible.</p>
      ) : proposes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun véhicule ne correspond.</p>
      ) : (
        <ul className="max-h-[50vh] space-y-1 overflow-y-auto pr-1" aria-label="Véhicules">
          {proposes.slice(0, AFFICHES_MAX).map((e) => (
            <li key={e.idEngin}>
              <button
                type="button"
                onClick={() => onChoisir(e)}
                className="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{libelleVehicule(e)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {e.typeEngin?.libelle ?? "—"}
                    {e.typeEngin?.categorie === "ENGIN_CHANTIER"
                      ? e.compteurHeures != null && ` · ${formatNombre(e.compteurHeures)} h`
                      : e.kilometrage != null && ` · ${formatNombre(e.kilometrage)} km`}
                  </span>
                </span>
                <StatutBadge statut={e.statut} />
              </button>
            </li>
          ))}
          {proposes.length > AFFICHES_MAX && (
            <li className="px-1 pt-1 text-xs text-muted-foreground">
              {proposes.length - AFFICHES_MAX} autre(s) : précisez la recherche.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
