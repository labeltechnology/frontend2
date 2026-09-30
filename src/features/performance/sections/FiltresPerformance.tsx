import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIODES, bornesPeriode, periodeCorrespondante, type ClePeriode } from "@/features/rapports/periodes";
import { cn } from "@/lib/utils";
import type { TypeEngin } from "@/types/engin";

interface FiltresPerformanceProps {
  debut: string;
  fin: string;
  onPeriode: (debut: string, fin: string) => void;
  idTypeEngin?: number | null;
  onType?: (id: number | null) => void;
  /** Absent = pas de choix du type (ex. sinistralité, 2026-09-29). */
  types?: TypeEngin[];
  /** Absent = l'utilisateur ne peut pas générer de rapport. */
  onRapport?: () => void;
  rapportEnCours?: boolean;
}

/** Période (raccourcis ou dates), type de véhicule, et génération du rapport PDF. */
export function FiltresPerformance({ debut, fin, onPeriode, idTypeEngin, onType, types, onRapport, rapportEnCours }: FiltresPerformanceProps) {
  const aujourdhui = new Date();
  const active = periodeCorrespondante(debut, fin, aujourdhui);
  const choisir = (cle: ClePeriode) => {
    const b = bornesPeriode(cle, aujourdhui);
    onPeriode(b.debut, b.fin);
  };

  return (
    <div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Période">
        {PERIODES.filter((p) => p.cle !== "SEPT_JOURS").map((p) => (
          <button
            key={p.cle}
            type="button"
            aria-pressed={active === p.cle}
            onClick={() => choisir(p.cle)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active === p.cle
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {p.libelle}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs text-muted-foreground">
          Du
          <Input type="date" value={debut} max={fin || undefined} onChange={(e) => onPeriode(e.target.value, fin)} className="h-9 w-40" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Au
          <Input type="date" value={fin} min={debut || undefined} onChange={(e) => onPeriode(debut, e.target.value)} className="h-9 w-40" />
        </label>
        {types && onType && (
        <div className="space-y-1 text-xs text-muted-foreground">
          <span>Type de véhicule</span>
          <Select value={idTypeEngin == null ? "tous" : String(idTypeEngin)} onValueChange={(v) => onType?.(v === "tous" ? null : Number(v))}>
            <SelectTrigger className="h-9 w-56" aria-label="Type de véhicule">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
                  {t.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}
        {onRapport && (
          <Button variant="outline" className="ml-auto h-9" onClick={onRapport} disabled={rapportEnCours || !debut || !fin || debut > fin}>
            {rapportEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Rapport PDF (tout le parc)
          </Button>
        )}
      </div>
      {debut && fin && debut > fin && <p className="text-sm text-destructive">La fin de la période doit être après son début.</p>}
    </div>
  );
}
