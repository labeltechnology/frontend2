import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FILTRES_PAR_DEFAUT,
  LIBELLES_TYPE_MAINTENANCE,
  type FiltreAtelier,
  type FiltresMaintenance,
  type FiltreStatut,
} from "@/features/maintenance/liste/maintenance-liste";
import { cn } from "@/lib/utils";
import type { TypeMaintenance } from "@/types/maintenance";

const STATUTS: { valeur: FiltreStatut; libelle: string }[] = [
  { valeur: "TOUTES", libelle: "Toutes" },
  { valeur: "PLANIFIEE", libelle: "Planifiées" },
  { valeur: "EN_RETARD", libelle: "En retard" },
  { valeur: "EN_COURS", libelle: "En cours" },
  { valeur: "TERMINEE", libelle: "Terminées" },
];

/** Recherche + filtres de la liste des maintenances (2026-09-28). */
export function BarreFiltresMaintenance({
  filtres,
  onChange,
  resultat,
  total,
}: {
  filtres: FiltresMaintenance;
  onChange: (filtres: FiltresMaintenance) => void;
  resultat: number;
  total: number;
}) {
  const modifie =
    filtres.statut !== "TOUTES" || filtres.type !== "TOUS" || filtres.atelier !== "TOUS" || filtres.recherche.trim() !== "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            value={filtres.recherche}
            onChange={(e) => onChange({ ...filtres, recherche: e.target.value })}
            placeholder="Véhicule, travaux, garage, facture…"
            aria-label="Rechercher une maintenance"
            className="pl-8"
          />
        </div>
        <Select value={filtres.type} onValueChange={(v) => onChange({ ...filtres, type: v as "TOUS" | TypeMaintenance })}>
          <SelectTrigger className="w-40" aria-label="Type de maintenance">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOUS">Tous les types</SelectItem>
            {(Object.keys(LIBELLES_TYPE_MAINTENANCE) as TypeMaintenance[]).map((t) => (
              <SelectItem key={t} value={t}>
                {LIBELLES_TYPE_MAINTENANCE[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtres.atelier} onValueChange={(v) => onChange({ ...filtres, atelier: v as FiltreAtelier })}>
          <SelectTrigger className="w-44" aria-label="Atelier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOUS">Atelier et garages</SelectItem>
            <SelectItem value="INTERNE">Atelier interne</SelectItem>
            <SelectItem value="GARAGE">Garages externes</SelectItem>
          </SelectContent>
        </Select>
        {modifie && (
          <Button variant="ghost" size="sm" onClick={() => onChange(FILTRES_PAR_DEFAUT)}>
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap rounded-md bg-muted p-0.5" role="group" aria-label="Filtrer par statut">
          {STATUTS.map(({ valeur, libelle }) => (
            <button
              key={valeur}
              type="button"
              aria-pressed={filtres.statut === valeur}
              onClick={() => onChange({ ...filtres, statut: valeur })}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filtres.statut === valeur ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {libelle}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {resultat === total ? `${total} maintenance(s)` : `${resultat} sur ${total}`}
        </span>
      </div>
    </div>
  );
}
