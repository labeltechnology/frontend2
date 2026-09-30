import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useBesoinsMaterielChantier,
  useCreerBesoinMaterielChantier,
  useModifierBesoinMaterielChantier,
  useSupprimerBesoinMaterielChantier,
} from "@/features/chantiers/api";
import { useTypesEngin } from "@/features/engins/api";
import { ApiError } from "@/lib/api-client";
import type { Chantier } from "@/types/chantier";
import { toast } from "sonner";

interface BesoinMaterielChantierDialogProps {
  chantier: Chantier | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Gère les besoins en matériel (type de véhicule + quantité) d'un
 * chantier — demande explicite de l'utilisateur (2026-09-23) : « voir la
 * disponibilité du matériel roulant pour mieux connaître en avance et mieux
 * planifier ». Chaque ligne affiche la disponibilité prévisionnelle calculée
 * côté backend (flotte utilisable du type moins les engins déjà réservés par
 * d'autres chantiers sur une période qui chevauche celle de ce chantier) —
 * badge d'alerte si elle est inférieure au besoin. Les besoins peuvent aussi
 * être saisis directement à la création du chantier (ChantierFormDialog) ;
 * ce dialogue sert aux ajustements ultérieurs (ajout, quantité, suppression).
 */
export function BesoinMaterielChantierDialog({ chantier, onOpenChange }: BesoinMaterielChantierDialogProps) {
  const open = chantier !== null;
  const { data: besoins, isLoading } = useBesoinsMaterielChantier(chantier?.idChantier);
  const { data: typesEngin } = useTypesEngin();
  const creer = useCreerBesoinMaterielChantier();
  const modifier = useModifierBesoinMaterielChantier(chantier?.idChantier ?? 0);
  const supprimer = useSupprimerBesoinMaterielChantier(chantier?.idChantier ?? 0);

  const [idTypeEnginSelectionne, setIdTypeEnginSelectionne] = useState<string>("");
  const [quantiteSaisie, setQuantiteSaisie] = useState<string>("1");

  const idsTypesUtilises = new Set(besoins?.map((b) => b.typeEngin.idTypeEngin));
  const typesDisponibles = typesEngin?.filter((t) => t.actif && !idsTypesUtilises.has(t.idTypeEngin)) ?? [];

  const onAjouter = async () => {
    if (!chantier || !idTypeEnginSelectionne || Number(quantiteSaisie) < 1) return;
    try {
      await creer.mutateAsync({
        idChantier: chantier.idChantier,
        idTypeEngin: Number(idTypeEnginSelectionne),
        quantite: Number(quantiteSaisie),
      });
      setIdTypeEnginSelectionne("");
      setQuantiteSaisie("1");
      toast.success("Besoin ajouté");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Ajout impossible");
    }
  };

  const onModifierQuantite = async (id: number, quantite: number) => {
    if (!quantite || quantite < 1) return;
    try {
      await modifier.mutateAsync({ id, requete: { quantite } });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Modification impossible");
    }
  };

  const onSupprimer = async (id: number) => {
    try {
      await supprimer.mutateAsync(id);
      toast.success("Besoin supprimé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Suppression impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Besoins en matériel {chantier ? `— ${chantier.nom}` : ""}</DialogTitle>
          <DialogDescription>
            Types de véhicules nécessaires et disponibilité prévisionnelle sur la période du chantier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Select value={idTypeEnginSelectionne} onValueChange={setIdTypeEnginSelectionne}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              {typesDisponibles.map((type) => (
                <SelectItem key={type.idTypeEngin} value={String(type.idTypeEngin)}>
                  {type.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            className="w-20"
            value={quantiteSaisie}
            onChange={(e) => setQuantiteSaisie(e.target.value)}
          />
          <Button onClick={onAjouter} disabled={!idTypeEnginSelectionne || creer.isPending}>
            {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && (besoins?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Aucun besoin en matériel enregistré pour l'instant.</p>
          )}
          {besoins?.map((b) => {
            const suffisant = b.quantiteDisponiblePrevisionnelle >= b.quantite;
            return (
              <div
                key={b.idBesoinMaterielChantier}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{b.typeEngin.libelle}</span>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 w-16"
                    defaultValue={b.quantite}
                    onBlur={(e) => onModifierQuantite(b.idBesoinMaterielChantier, Number(e.target.value))}
                  />
                  <Badge variant={suffisant ? "success" : "destructive"}>
                    {b.quantiteDisponiblePrevisionnelle} disponible
                    {b.quantiteDisponiblePrevisionnelle > 1 ? "s" : ""} / {b.quantite} requis
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onSupprimer(b.idBesoinMaterielChantier)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
