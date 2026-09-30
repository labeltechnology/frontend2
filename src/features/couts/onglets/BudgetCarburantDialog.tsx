import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnregistrerBudgetCarburant } from "@/features/couts/api";
import { NOMS_MOIS, lirePartsMensuelles, montantBudgetPrevu, texteMontant } from "@/features/couts/couts";
import { lireNombreFacultatif, uniteUsage } from "@/features/performance/reglages-type";
import { ApiError } from "@/lib/api-client";
import type { LigneBudgetCarburant } from "@/types/couts";
import type { TypeEngin } from "@/types/engin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annee: number;
  types: TypeEngin[];
  /** Présent = modification de ce budget. */
  ligne: LigneBudgetCarburant | null;
}

/**
 * Budget carburant annuel d'un type : usage prévu, consommation prévue et prix
 * du litre prévu (le montant en découle), répartition mensuelle facultative.
 */
export function BudgetCarburantDialog({ open, onOpenChange, annee, types, ligne }: Props) {
  const enregistrer = useEnregistrerBudgetCarburant();
  const [idType, setIdType] = useState("");
  const [usage, setUsage] = useState("");
  const [conso, setConso] = useState("");
  const [prix, setPrix] = useState("");
  const [parts, setParts] = useState<string[]>(Array(12).fill(""));
  const [repartir, setRepartir] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIdType(ligne?.idTypeEngin != null ? String(ligne.idTypeEngin) : "");
    setUsage(ligne ? String(ligne.usagePrevu) : "");
    setConso(ligne ? String(ligne.consommationPrevue) : "");
    setPrix(ligne ? String(ligne.prixLitrePrevu) : "");
    const egales = ligne ? ligne.partsMensuelles.every((p) => Math.abs(p - 100 / 12) < 0.01) : true;
    setRepartir(!egales);
    setParts(ligne && !egales ? ligne.partsMensuelles.map((p) => String(Math.round(p * 10) / 10)) : Array(12).fill(""));
  }, [open, ligne]);

  const type = types.find((t) => String(t.idTypeEngin) === idType);
  const unite = uniteUsage(type?.categorie);
  const u = lireNombreFacultatif(usage);
  const c = lireNombreFacultatif(conso);
  const p = lireNombreFacultatif(prix);
  const apercu = u && c && p ? montantBudgetPrevu(u, c, p, unite) : null;

  const valider = async () => {
    if (!type) return toast.error("Choisissez le type de véhicule.");
    if (!u || !c || !p) return toast.error("Usage, consommation et prix doivent être des nombres positifs.");
    const partsMensuelles = repartir ? lirePartsMensuelles(parts) : null;
    if (typeof partsMensuelles === "string") return toast.error(partsMensuelles);
    try {
      await enregistrer.mutateAsync({
        annee,
        idTypeEngin: type.idTypeEngin,
        usagePrevu: u,
        consommationPrevue: c,
        prixLitrePrevu: p,
        partsMensuelles,
      });
      toast.success("Budget enregistré");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ligne ? "Modifier le budget" : "Nouveau budget carburant"} {annee}</DialogTitle>
          <DialogDescription>
            Le montant vaut usage prévu × consommation prévue × prix du litre : l'écart avec le réel pourra ainsi être expliqué.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type de véhicule</Label>
            <Select value={idType} onValueChange={setIdType} disabled={ligne !== null}>
              <SelectTrigger aria-label="Type de véhicule">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
                    {t.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="usagePrevu">{unite === "h" ? "Heures prévues sur l'année" : "Km prévus sur l'année"}</Label>
              <Input id="usagePrevu" type="number" min={0} value={usage} onChange={(e) => setUsage(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consommationPrevue">{unite === "h" ? "Consommation (L/h)" : "Consommation (L/100 km)"}</Label>
              <Input id="consommationPrevue" type="number" min={0} step="0.1" value={conso} onChange={(e) => setConso(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prixLitrePrevu">Prix du litre prévu (Ar)</Label>
              <Input id="prixLitrePrevu" type="number" min={0} value={prix} onChange={(e) => setPrix(e.target.value)} />
            </div>
          </div>
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            Budget annuel : <strong className="tabular-nums">{texteMontant(apercu)}</strong>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={repartir} onChange={(e) => setRepartir(e.target.checked)} />
            Répartir selon les mois (sinon 12 parts égales)
          </label>
          {repartir && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {NOMS_MOIS.map((m, i) => (
                <div key={m} className="space-y-1">
                  <Label htmlFor={`part-${i}`} className="text-xs">
                    {m} (%)
                  </Label>
                  <Input
                    id={`part-${i}`}
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
