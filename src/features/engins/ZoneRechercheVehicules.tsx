import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Zone de recherche de la page Véhicules (2026-09-25) : placée dans l'en-tête,
 * à côté du bouton « Nouveau véhicule » ; partagée par les onglets « Liste »
 * et « Planning » (le filtre reste appliqué quand on change d'onglet).
 * Affiche le nombre de véhicules trouvés et un bouton pour effacer.
 */
export function ZoneRechercheVehicules({
  valeur,
  onChange,
  nombreTrouves,
  nombreTotal,
}: {
  valeur: string;
  onChange: (valeur: string) => void;
  nombreTrouves: number;
  nombreTotal: number;
}) {
  const filtre = valeur.trim().length > 0;
  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row-reverse sm:items-center sm:gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Immatriculation, n° de série, marque, type, statut…"
          aria-label="Rechercher un véhicule"
          className="pl-8 pr-8"
        />
        {filtre && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {filtre && (
        <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
          {nombreTrouves} véhicule{nombreTrouves > 1 ? "s" : ""} sur {nombreTotal}
        </p>
      )}
    </div>
  );
}
