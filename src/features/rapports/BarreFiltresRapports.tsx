import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FAMILLES, type FamilleRapport } from "@/features/rapports/catalogue";
import { FILTRES_RAPPORTS_DEFAUT, type FiltreGeneration, type FiltresRapports } from "@/features/rapports/liste-rapports";
import { cn } from "@/lib/utils";

const GENERATIONS: { valeur: FiltreGeneration; libelle: string }[] = [
  { valeur: "TOUS", libelle: "Toutes les dates" },
  { valeur: "SEPT_JOURS", libelle: "7 derniers jours" },
  { valeur: "TRENTE_JOURS", libelle: "30 derniers jours" },
];

/** Recherche, famille et date de génération des rapports (2026-09-28). */
export function BarreFiltresRapports({
  filtres,
  onChange,
  compteParFamille,
  resultat,
  total,
}: {
  filtres: FiltresRapports;
  onChange: (filtres: FiltresRapports) => void;
  compteParFamille: Record<FamilleRapport, number>;
  resultat: number;
  total: number;
}) {
  const modifie = filtres.recherche.trim() !== "" || filtres.famille !== "TOUTES" || filtres.generation !== "TOUS";
  const pastille = (actif: boolean) =>
    cn(
      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition",
      actif ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filtres.recherche}
            onChange={(e) => onChange({ ...filtres, recherche: e.target.value })}
            placeholder="Rechercher un rapport, un véhicule, un conducteur, un chantier…"
            className="pl-8"
            aria-label="Rechercher"
          />
        </div>
        <Select value={filtres.generation} onValueChange={(v) => onChange({ ...filtres, generation: v as FiltreGeneration })}>
          <SelectTrigger className="w-[11rem]" aria-label="Date de génération">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GENERATIONS.map((g) => (
              <SelectItem key={g.valeur} value={g.valeur}>
                {g.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={pastille(filtres.famille === "TOUTES")} onClick={() => onChange({ ...filtres, famille: "TOUTES" })}>
          Tous
        </button>
        {FAMILLES.map((f) => (
          <button
            key={f.cle}
            type="button"
            className={pastille(filtres.famille === f.cle)}
            onClick={() => onChange({ ...filtres, famille: f.cle })}
          >
            {f.libelle}
            <span className="tabular-nums opacity-70">{compteParFamille[f.cle]}</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {resultat === total ? `${total} rapport${total > 1 ? "s" : ""}` : `${resultat} sur ${total}`}
        </span>
        {modifie && (
          <Button variant="ghost" size="sm" onClick={() => onChange(FILTRES_RAPPORTS_DEFAUT)}>
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>
    </div>
  );
}
