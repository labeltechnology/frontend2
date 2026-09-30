import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { partsEgales, requeteBudgetPoste } from "@/features/couts/budget-postes/budget-postes";
import { useEnregistrerBudgetPoste } from "@/features/couts/budget-postes/budget-postes-api";
import { NOMS_MOIS } from "@/features/couts/couts";
import { ApiError } from "@/lib/api-client";
import type { LigneBudgetPoste } from "@/types/pilotage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annee: number;
  /** Le poste à budgéter (nouveau ou modification). */
  ligne: LigneBudgetPoste | null;
}

/** Budget annuel d'un poste (2026-09-30) : montant, répartition mensuelle facultative. */
export function BudgetPosteDialog({ open, onOpenChange, annee, ligne }: Props) {
  const enregistrer = useEnregistrerBudgetPoste();
  const [montant, setMontant] = useState("");
  const [repartir, setRepartir] = useState(false);
  const [parts, setParts] = useState<string[]>(Array(12).fill(""));

  useEffect(() => {
    if (!open) return;
    setMontant(ligne?.montantAnnuel != null ? String(ligne.montantAnnuel) : "");
    const egales = partsEgales(ligne?.partsMensuelles ?? []);
    setRepartir(!egales);
    setParts(ligne && !egales ? ligne.partsMensuelles.map((p) => String(Math.round(p * 10) / 10)) : Array(12).fill(""));
  }, [open, ligne]);

  const valider = async () => {
    if (!ligne) return;
    const requete = requeteBudgetPoste(annee, ligne, montant, repartir, parts);
    if (typeof requete === "string") return toast.error(requete);
    try {
      await enregistrer.mutateAsync(requete);
      toast.success(`Budget « ${ligne.libelle} » enregistré`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Budget {ligne?.libelle.toLowerCase()} {annee}
          </DialogTitle>
          <DialogDescription>
            Comparé chaque mois aux dépenses réelles (tableau de bord de direction, « Coûts du mois »).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="montantAnnuelPoste">Montant annuel (Ar)</Label>
            <Input id="montantAnnuelPoste" type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={repartir} onChange={(e) => setRepartir(e.target.checked)} />
            Répartir selon les mois (sinon 12 parts égales)
          </label>
          {repartir && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {NOMS_MOIS.map((m, i) => (
                <div key={m} className="space-y-1">
                  <Label htmlFor={`part-poste-${i}`} className="text-xs">
                    {m} (%)
                  </Label>
                  <Input
                    id={`part-poste-${i}`}
                    type="number"
                    min={0}
                    step="0.1"
                    value={parts[i]}
                    onChange={(e) => setParts((anciennes) => anciennes.map((v, j) => (j === i ? e.target.value : v)))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={valider} disabled={enregistrer.isPending}>
            {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
