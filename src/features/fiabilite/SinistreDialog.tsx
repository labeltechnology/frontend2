import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { texteMontant } from "@/features/couts/couts";
import { useEnregistrerSinistre, useSinistre, useSupprimerSinistre } from "@/features/fiabilite/api";
import {
  RESPONSABILITES,
  STATUTS_DOSSIER,
  requeteSinistre,
  resteAChargePrevu,
  valeursSinistre,
  type ValeursSinistre,
} from "@/features/fiabilite/fiabilite";
import { ApiError } from "@/lib/api-client";
import type { ResponsabiliteSinistre, StatutDossierSinistre } from "@/types/fiabilite";

/** Incident dont on ouvre le volet sinistre. */
export interface CibleSinistre {
  idIncident: number;
  libelle: string;
  coutEstime: number | null;
}

/**
 * Volet « Sinistre » d'un incident (2026-09-29, choix validé) : assureur,
 * numéro de dossier, responsabilité, dommages, franchise, indemnisation
 * reçue ; le reste à charge est calculé. Lecture seule sans le droit de
 * gérer le parc.
 */
export function SinistreDialog({
  cible,
  peutModifier,
  onFermer,
}: {
  cible: CibleSinistre | null;
  peutModifier: boolean;
  onFermer: () => void;
}) {
  const requete = useSinistre(cible?.idIncident ?? null);
  const enregistrer = useEnregistrerSinistre();
  const supprimer = useSupprimerSinistre();
  const [v, setV] = useState<ValeursSinistre>(valeursSinistre(null));

  // Réinitialise le formulaire à chaque incident ouvert et à chaque lecture du volet.
  useEffect(() => {
    setV(valeursSinistre(requete.data ?? null));
  }, [requete.data, cible?.idIncident]);

  const champ = (cle: keyof ValeursSinistre) => ({
    value: v[cle],
    disabled: !peutModifier,
    onChange: (e: { target: { value: string } }) => setV({ ...v, [cle]: e.target.value }),
  });
  const reste = cible ? resteAChargePrevu(v, cible.coutEstime) : null;

  const onEnregistrer = async () => {
    if (!cible) return;
    const r = requeteSinistre(v);
    if (typeof r === "string") return toast.error(r);
    try {
      await enregistrer.mutateAsync({ idIncident: cible.idIncident, requete: r });
      toast.success("Volet sinistre enregistré");
      onFermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const onSupprimer = async () => {
    if (!cible) return;
    try {
      await supprimer.mutateAsync(cible.idIncident);
      toast.success("Volet sinistre retiré");
      onFermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Suppression impossible");
    }
  };

  return (
    <Dialog open={cible !== null} onOpenChange={(open) => !open && onFermer()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Volet sinistre</DialogTitle>
          <DialogDescription>{cible?.libelle}</DialogDescription>
        </DialogHeader>
        {requete.isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assureur">Assureur</Label>
              <Input id="assureur" maxLength={150} {...champ("assureur")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeroDossier">Numéro de dossier</Label>
              <Input id="numeroDossier" maxLength={100} {...champ("numeroDossier")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateDeclaration">Déclaré à l'assureur le</Label>
              <Input id="dateDeclaration" type="date" {...champ("dateDeclaration")} />
            </div>
            <div className="space-y-1.5">
              <Label>Responsabilité</Label>
              <Select
                value={v.responsabilite}
                disabled={!peutModifier}
                onValueChange={(x) => setV({ ...v, responsabilite: x as ResponsabiliteSinistre })}
              >
                <SelectTrigger aria-label="Responsabilité">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RESPONSABILITES) as ResponsabiliteSinistre[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESPONSABILITES[r].libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="montantDommages">Dommages (Ar)</Label>
              <Input id="montantDommages" inputMode="decimal" placeholder={cible?.coutEstime != null ? `Coût estimé : ${cible.coutEstime}` : ""} {...champ("montantDommages")} />
              <p className="text-xs text-muted-foreground">Vide = coût estimé de l'incident.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="franchise">Franchise (Ar)</Label>
              <Input id="franchise" inputMode="decimal" {...champ("franchise")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="indemnisationRecue">Indemnisation reçue (Ar)</Label>
              <Input id="indemnisationRecue" inputMode="decimal" {...champ("indemnisationRecue")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateIndemnisation">Reçue le</Label>
              <Input id="dateIndemnisation" type="date" {...champ("dateIndemnisation")} />
            </div>
            <div className="space-y-1.5">
              <Label>Dossier</Label>
              <Select
                value={v.statutDossier}
                disabled={!peutModifier}
                onValueChange={(x) => setV({ ...v, statutDossier: x as StatutDossierSinistre })}
              >
                <SelectTrigger aria-label="Dossier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUTS_DOSSIER) as StatutDossierSinistre[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUTS_DOSSIER[s].libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Reste à charge{v.statutDossier === "OUVERT" ? " (provisoire)" : ""}</p>
              <p className="font-display text-lg font-semibold tabular-nums">{reste === null ? "—" : texteMontant(reste)}</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea id="commentaire" rows={2} maxLength={1000} {...champ("commentaire")} />
            </div>
          </div>
        )}
        {peutModifier && (
          <DialogFooter className="gap-2 sm:justify-between">
            {requete.data ? (
              <Button type="button" variant="ghost" className="text-destructive" onClick={onSupprimer} disabled={supprimer.isPending}>
                <Trash2 className="h-4 w-4" /> Retirer le volet
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={onEnregistrer} disabled={enregistrer.isPending || requete.isPending}>
              {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
