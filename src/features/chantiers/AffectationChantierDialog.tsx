import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAffectationsChantier,
  useAnnulerAffectationChantier,
  useCreerAffectationChantier,
  useTerminerAffectationChantier,
} from "@/features/chantiers/api";
import { useEngins } from "@/features/engins/api";
import { ApiError } from "@/lib/api-client";
import type { Chantier } from "@/types/chantier";
import { toast } from "sonner";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";

interface AffectationChantierDialogProps {
  chantier: Chantier | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Rattache/détache des engins à un chantier, sur le même principe qu'une
 * Affectation (engin <-> conducteur) — voir AffectationChantierService
 * côté backend. Le rattachement d'un engin à un chantier ne change pas son
 * StatutEngin : il reste par ailleurs affectable à un conducteur.
 */
export function AffectationChantierDialog({ chantier, onOpenChange }: AffectationChantierDialogProps) {
  const open = chantier !== null;
  const { data: rattachements, isLoading } = useAffectationsChantier(chantier?.idChantier);
  const { data: engins } = useEngins();
  const creer = useCreerAffectationChantier();
  const terminer = useTerminerAffectationChantier(chantier?.idChantier ?? 0);
  const annuler = useAnnulerAffectationChantier(chantier?.idChantier ?? 0);

  const [idEnginSelectionne, setIdEnginSelectionne] = useState<string>("");

  const rattachementsActifs = rattachements?.filter((r) => r.statut === "ACTIVE") ?? [];
  const idsEnginsRattaches = new Set(rattachementsActifs.map((r) => r.engin.idEngin));
  const enginsDisponibles = engins?.filter((e) => !idsEnginsRattaches.has(e.idEngin)) ?? [];

  const onAjouter = async () => {
    if (!chantier || !idEnginSelectionne) return;
    try {
      await creer.mutateAsync({ idEngin: Number(idEnginSelectionne), idChantier: chantier.idChantier });
      setIdEnginSelectionne("");
      toast.success("Véhicule rattaché au chantier");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Rattachement impossible");
    }
  };

  const onTerminer = async (idAffectationChantier: number) => {
    try {
      await terminer.mutateAsync(idAffectationChantier);
      toast.success("Rattachement terminé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onDetacher = async (idAffectationChantier: number) => {
    const motif = window.prompt("Motif de détachement de le véhicule :");
    if (!motif) return;
    try {
      await annuler.mutateAsync({ id: idAffectationChantier, motifAnnulation: motif });
      toast.success("Véhicule détaché du chantier");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Engins rattachés {chantier ? `— ${chantier.nom}` : ""}</DialogTitle>
          <DialogDescription>Ajoute ou retire des véhicules et véhicules de ce chantier.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Select value={idEnginSelectionne} onValueChange={setIdEnginSelectionne}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sélectionner un véhicule à rattacher" />
            </SelectTrigger>
            <SelectContent>
              {enginsDisponibles.map((engin) => (
                <SelectItem key={engin.idEngin} value={String(engin.idEngin)}>
                  {libelleVehicule(engin)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAjouter} disabled={!idEnginSelectionne || creer.isPending}>
            {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && rattachementsActifs.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun véhicule rattaché pour l'instant.</p>
          )}
          {rattachementsActifs.map((r) => (
            <div
              key={r.idAffectationChantier}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="default">{identifiantVehicule(r.engin)}</Badge>
                <span className="text-sm text-muted-foreground">
                  {r.engin.marque} {r.engin.modele}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onTerminer(r.idAffectationChantier)}>
                  Terminer
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDetacher(r.idAffectationChantier)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
