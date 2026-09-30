import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTypesEngin } from "@/features/engins/api";
import { useCreerDemande } from "@/features/chantiers/demandes/demandes-api";
import { problemeDemande, requeteDemande, saisieDemande, type SaisieDemande } from "@/features/chantiers/demandes/demandes";
import { LIBELLES_PRIORITE } from "@/features/chantiers/organisation/organisation";
import { jourLocal } from "@/features/chantiers/journal/journal-chantier";
import { ApiError } from "@/lib/api-client";
import type { Chantier, PrioriteChantier } from "@/types/chantier";

const PRIORITES: PrioriteChantier[] = ["NORMALE", "HAUTE", "CRITIQUE"];

/** Nouvelle demande de matériel pour un chantier (V64) : type, quantité, période, priorité, motif. */
export function DemandeDialog({
  chantier,
  prioriteChantier,
  onClose,
}: {
  chantier: Chantier;
  prioriteChantier: PrioriteChantier;
  onClose: () => void;
}) {
  const aujourdhui = jourLocal(new Date());
  const [saisie, setSaisie] = useState<SaisieDemande>(() => saisieDemande(chantier, prioriteChantier, aujourdhui));
  const { data: types } = useTypesEngin();
  const creer = useCreerDemande();
  const maj = (m: Partial<SaisieDemande>) => setSaisie((s) => ({ ...s, ...m }));
  const probleme = problemeDemande(saisie, chantier, aujourdhui);

  const valider = async () => {
    if (probleme) return;
    try {
      await creer.mutateAsync(requeteDemande(saisie, chantier.idChantier));
      toast.success("Demande envoyée à la gestion du parc");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Demande impossible");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander du matériel</DialogTitle>
          <DialogDescription>{chantier.nom} — la gestion du parc accepte ou refuse ; vous êtes prévenu par message.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label>Type de véhicule</Label>
              <Select value={saisie.idTypeEngin == null ? "" : String(saisie.idTypeEngin)} onValueChange={(v) => maj({ idTypeEngin: Number(v) })}>
                <SelectTrigger aria-label="Type de véhicule">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {(types ?? []).filter((t) => t.actif).map((t) => (
                    <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dem-quantite">Quantité</Label>
              <Input id="dem-quantite" inputMode="numeric" value={saisie.quantite} onChange={(e) => maj({ quantite: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dem-debut">Du</Label>
              <Input id="dem-debut" type="date" value={saisie.dateDebut} onChange={(e) => maj({ dateDebut: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dem-fin">Au</Label>
              <Input id="dem-fin" type="date" value={saisie.dateFin} onChange={(e) => maj({ dateFin: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={saisie.priorite} onValueChange={(v) => maj({ priorite: v as PrioriteChantier })}>
                <SelectTrigger aria-label="Priorité">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {LIBELLES_PRIORITE[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dem-motif">Motif (travaux prévus, contraintes)</Label>
            <Textarea id="dem-motif" rows={3} maxLength={1000} value={saisie.motif} onChange={(e) => maj({ motif: e.target.value })} />
          </div>
          {probleme && <p className="text-sm text-destructive">{probleme}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={valider} disabled={!!probleme || creer.isPending}>
            Envoyer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
