import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReglerKpi } from "@/features/dashboard/pilotage/pilotage-api";
import { lireNombre, problemeReglage } from "@/features/dashboard/pilotage/pilotage";
import { ApiError } from "@/lib/api-client";
import type { KpiPilotage } from "@/types/pilotage";

/**
 * Objectif et seuil d'alerte d'un KPI (2026-09-30). Pour un KPI repris de la
 * page Performance, l'objectif est le même que sur cette page.
 */
export function ReglageKpiDialog({ kpi, onFermer }: { kpi: KpiPilotage | null; onFermer: () => void }) {
  const regler = useReglerKpi();
  const [objectif, setObjectif] = useState("");
  const [seuil, setSeuil] = useState("");

  useEffect(() => {
    if (!kpi) return;
    setObjectif(kpi.objectif === null ? "" : String(kpi.objectif).replace(".", ","));
    setSeuil(kpi.seuilAlerte === null ? "" : String(kpi.seuilAlerte).replace(".", ","));
  }, [kpi]);

  const valider = async () => {
    if (!kpi) return;
    const o = lireNombre(objectif);
    const s = lireNombre(seuil);
    const probleme = problemeReglage(o, s, kpi);
    if (probleme || o === undefined || s === undefined) {
      toast.error(probleme ?? "Saisie invalide");
      return;
    }
    try {
      await regler.mutateAsync({ code: kpi.code, reglage: { objectif: o, seuilAlerte: s } });
      toast.success(`Réglage de « ${kpi.libelle} » enregistré`);
      onFermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const hausse = kpi?.sens === "HAUSSE";
  return (
    <Dialog open={kpi !== null} onOpenChange={(open) => !open && onFermer()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{kpi?.libelle}</DialogTitle>
          <DialogDescription>
            {kpi?.definition} {hausse ? "Une valeur haute est souhaitée." : "Une valeur basse est souhaitée."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="objectifKpi">Objectif ({kpi?.unite})</Label>
            <Input id="objectifKpi" inputMode="decimal" value={objectif} onChange={(e) => setObjectif(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seuilKpi">
              Seuil d'alerte ({hausse ? "sous" : "au-delà de"})
            </Label>
            <Input id="seuilKpi" inputMode="decimal" value={seuil} onChange={(e) => setSeuil(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Vert : objectif atteint. Orange : objectif manqué sans franchir le seuil. Rouge : seuil franchi. Laisser vide
          retire la valeur (sans seuil, le rouge commence à 10 % de l'objectif).
          {kpi?.objectifPartageAvecPerformance && " Cet objectif s'applique également à la page « Performance »."}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onFermer}>
            Annuler
          </Button>
          <Button onClick={valider} disabled={regler.isPending}>
            {regler.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
