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
  useAffectationsConducteurChantier,
  useAnnulerAffectationConducteurChantier,
  useCreerAffectationConducteurChantier,
  useTerminerAffectationConducteurChantier,
} from "@/features/chantiers/api";
import { useConducteurs } from "@/features/conducteurs/api";
import { ApiError } from "@/lib/api-client";
import type { Chantier } from "@/types/chantier";
import { toast } from "sonner";

interface AffectationConducteurChantierDialogProps {
  chantier: Chantier | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Rattache/détache des conducteurs à un chantier, sur le même principe que
 * AffectationChantierDialog (engins). Différence volontaire (demande
 * explicite de l'utilisateur, 2026-09-23) : un conducteur d'engin comme un
 * conducteur de véhicule peut être rattaché à plusieurs chantiers différents
 * en même temps (compétence CACES rare partagée entre sites, tournées
 * d'approvisionnement) — voir AffectationConducteurChantierService côté
 * backend, qui n'applique donc pas la contrainte "un seul rattachement actif
 * à la fois" utilisée pour les engins. La liste des conducteurs disponibles
 * n'exclut donc que ceux déjà rattachés à CE chantier (évite un doublon),
 * pas ceux actifs sur d'autres chantiers.
 */
export function AffectationConducteurChantierDialog({
  chantier,
  onOpenChange,
}: AffectationConducteurChantierDialogProps) {
  const open = chantier !== null;
  const { data: rattachements, isLoading } = useAffectationsConducteurChantier(chantier?.idChantier);
  const { data: conducteurs } = useConducteurs();
  const creer = useCreerAffectationConducteurChantier();
  const terminer = useTerminerAffectationConducteurChantier(chantier?.idChantier ?? 0);
  const annuler = useAnnulerAffectationConducteurChantier(chantier?.idChantier ?? 0);

  const [idConducteurSelectionne, setIdConducteurSelectionne] = useState<string>("");

  const rattachementsActifs = rattachements?.filter((r) => r.statut === "ACTIVE") ?? [];
  const idsConducteursRattaches = new Set(rattachementsActifs.map((r) => r.conducteur.idConducteur));
  const conducteursDisponibles = conducteurs?.filter((c) => !idsConducteursRattaches.has(c.idConducteur)) ?? [];

  const onAjouter = async () => {
    if (!chantier || !idConducteurSelectionne) return;
    try {
      await creer.mutateAsync({ idConducteur: Number(idConducteurSelectionne), idChantier: chantier.idChantier });
      setIdConducteurSelectionne("");
      toast.success("Conducteur rattaché au chantier");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Rattachement impossible");
    }
  };

  const onTerminer = async (idAffectationConducteurChantier: number) => {
    try {
      await terminer.mutateAsync(idAffectationConducteurChantier);
      toast.success("Rattachement terminé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onDetacher = async (idAffectationConducteurChantier: number) => {
    const motif = window.prompt("Motif de détachement du conducteur :");
    if (!motif) return;
    try {
      await annuler.mutateAsync({ id: idAffectationConducteurChantier, motifAnnulation: motif });
      toast.success("Conducteur détaché du chantier");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conducteurs rattachés {chantier ? `— ${chantier.nom}` : ""}</DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des conducteurs de ce chantier. Un conducteur peut être rattaché à plusieurs chantiers
            en même temps.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Select value={idConducteurSelectionne} onValueChange={setIdConducteurSelectionne}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sélectionner un conducteur à rattacher" />
            </SelectTrigger>
            <SelectContent>
              {conducteursDisponibles.map((conducteur) => (
                <SelectItem key={conducteur.idConducteur} value={String(conducteur.idConducteur)}>
                  {conducteur.matricule} — {conducteur.nom} {conducteur.prenom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAjouter} disabled={!idConducteurSelectionne || creer.isPending}>
            {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && rattachementsActifs.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun conducteur rattaché pour l'instant.</p>
          )}
          {rattachementsActifs.map((r) => (
            <div
              key={r.idAffectationConducteurChantier}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="default">{r.conducteur.matricule}</Badge>
                <span className="text-sm text-muted-foreground">
                  {r.conducteur.nom} {r.conducteur.prenom}
                </span>
                {r.conducteur.categorie === "ENGIN_CHANTIER" && <Badge variant="warning">Véhicule</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onTerminer(r.idAffectationConducteurChantier)}>
                  Terminer
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDetacher(r.idAffectationConducteurChantier)}>
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
