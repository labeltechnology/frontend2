import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEngins } from "@/features/engins/api";
import { useEnregistrerCession } from "@/features/renouvellement/api";
import { MOTIFS_CESSION, requeteCession, valeursCession, type ValeursCession } from "@/features/renouvellement/renouvellement";
import { ApiError } from "@/lib/api-client";
import { libelleVehicule } from "@/lib/vehicule";
import type { FinDeVieVehicule, MotifCession } from "@/types/renouvellement";

function aujourdhuiIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Sortie du parc d'un véhicule (2026-09-29) : date, motif, prix, acquéreur.
 * Le véhicule passe au statut « Vendu » (vente) ou « Réformé » (autres
 * motifs). {@code cible} = véhicule déjà sorti à compléter ou corriger ;
 * null = nouvelle sortie, véhicule à choisir parmi ceux en service.
 */
export function CessionDialog({
  open,
  cible,
  onOpenChange,
}: {
  open: boolean;
  cible: FinDeVieVehicule | null;
  onOpenChange: (o: boolean) => void;
}) {
  const aujourdhui = aujourdhuiIso();
  const engins = useEngins();
  const enregistrer = useEnregistrerCession();
  const [v, setV] = useState<ValeursCession>(valeursCession(cible, aujourdhui));

  useEffect(() => {
    if (open) setV(valeursCession(cible, aujourdhui));
  }, [open, cible, aujourdhui]);

  const enService = useMemo(
    () =>
      (engins.data ?? [])
        .filter((e) => e.statut !== "REFORME" && e.statut !== "VENDU" && e.statut !== "EN_MISSION" && e.statut !== "AFFECTE")
        .sort((a, b) => libelleVehicule(a).localeCompare(libelleVehicule(b), "fr")),
    [engins.data],
  );

  const onEnregistrer = async () => {
    const r = requeteCession(v, aujourdhui);
    if (typeof r === "string") return toast.error(r);
    try {
      await enregistrer.mutateAsync(r);
      toast.success(r.requete.motif === "VENTE" ? "Vente enregistrée : le véhicule est « Vendu »" : "Sortie enregistrée : le véhicule est « Réformé »");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cible ? "Cession du véhicule" : "Sortir un véhicule du parc"}</DialogTitle>
          <DialogDescription>
            {cible ? cible.libelleVehicule : "Vente, réforme ou perte totale. Le véhicule ne pourra plus être affecté."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {!cible && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Véhicule</Label>
              <Select value={v.idEngin} onValueChange={(x) => setV({ ...v, idEngin: x })}>
                <SelectTrigger aria-label="Véhicule">
                  <SelectValue placeholder="Choisir un véhicule en service" />
                </SelectTrigger>
                <SelectContent>
                  {enService.map((e) => (
                    <SelectItem key={e.idEngin} value={String(e.idEngin)}>
                      {libelleVehicule(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Un véhicule en mission ou affecté doit d'abord être libéré.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="dateCession">Date de sortie</Label>
            <Input id="dateCession" type="date" max={aujourdhui} value={v.dateCession} onChange={(e) => setV({ ...v, dateCession: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Motif</Label>
            <Select value={v.motif} onValueChange={(x) => setV({ ...v, motif: x as MotifCession })}>
              <SelectTrigger aria-label="Motif">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MOTIFS_CESSION) as MotifCession[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {MOTIFS_CESSION[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prixCession">Prix de cession (Ar)</Label>
            <Input id="prixCession" inputMode="decimal" value={v.prixCession} onChange={(e) => setV({ ...v, prixCession: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acquereur">Acquéreur</Label>
            <Input id="acquereur" maxLength={150} value={v.acquereur} onChange={(e) => setV({ ...v, acquereur: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="commentaireCession">Commentaire</Label>
            <Textarea id="commentaireCession" rows={2} maxLength={500} value={v.commentaire} onChange={(e) => setV({ ...v, commentaire: e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          La valeur nette comptable et la plus ou moins-value sont calculées à partir de la rubrique Coûts de la fiche (prix d'achat, amortissement).
        </p>
        <DialogFooter>
          <Button onClick={onEnregistrer} disabled={enregistrer.isPending}>
            {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
