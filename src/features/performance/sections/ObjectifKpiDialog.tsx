import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModifierObjectifKpi } from "@/features/performance/api";
import { formaterValeurUnite, lireObjectif } from "@/features/performance/performance";
import { ApiError } from "@/lib/api-client";
import type { KpiParc } from "@/types/performance";
import { toast } from "sonner";

/** Réglage de l'objectif d'un KPI (capacité GERER_PARC). Champ vide = pas d'objectif. */
export function ObjectifKpiDialog({ kpi, onOpenChange }: { kpi: KpiParc | null; onOpenChange: (open: boolean) => void }) {
  const [texte, setTexte] = useState("");
  const modifier = useModifierObjectifKpi();

  useEffect(() => {
    setTexte(kpi?.objectif != null ? String(kpi.objectif) : "");
  }, [kpi]);

  const enregistrer = async () => {
    if (!kpi) return;
    const valeur = lireObjectif(texte, kpi.unite);
    if (valeur === undefined) {
      toast.error(kpi.unite === "%" ? "Saisissez un nombre entre 0 et 100" : "Saisissez un nombre positif");
      return;
    }
    try {
      await modifier.mutateAsync({ code: kpi.code, valeur });
      toast.success(valeur === null ? "Objectif retiré" : "Objectif enregistré");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open={kpi !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Objectif : {kpi?.libelle}</DialogTitle>
          <DialogDescription>
            {kpi?.sens === "BAISSE" ? "Plus la valeur est basse, mieux c'est." : "Plus la valeur est haute, mieux c'est."} Laissez vide
            pour ne pas fixer d'objectif.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="objectifKpi">Objectif ({kpi?.unite})</Label>
          <Input
            id="objectifKpi"
            type="number"
            min={0}
            max={kpi?.unite === "%" ? 100 : undefined}
            step="any"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enregistrer()}
          />
          {kpi?.objectifParDefaut != null && (
            <p className="text-xs text-muted-foreground">Valeur proposée : {formaterValeurUnite(kpi.objectifParDefaut, kpi.unite)}</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={enregistrer} disabled={modifier.isPending}>
            {modifier.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
