import { useMemo, useState } from "react";
import { useConfirmer } from "@/components/confirmation/ConfirmationProvider";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import {
  useAjouterPhotoMouvement,
  useEnregistrerMouvement,
  useRetirerPhotoMouvement,
  useSupprimerMouvement,
} from "@/features/chantiers/terrain/terrain-api";
import {
  LIBELLES_ETAT,
  MAX_PHOTOS_MOUVEMENT,
  problemeMouvement,
  requeteMouvement,
  saisieMouvement,
  type SaisieMouvement,
} from "@/features/chantiers/terrain/terrain";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { EtatMateriel, MouvementsVehicule, TypeMouvement } from "@/types/chantier";

const ETATS: EtatMateriel[] = ["BON", "RESERVES", "ENDOMMAGE"];
const SANS_NOTE = "aucune";

/**
 * État des lieux de sortie vers le chantier ou de retour (V64, 2026-09-29) :
 * compteurs, carburant, état, éléments de bord manquants, observations ; au
 * retour, note du véhicule et suites (incident « Dégâts », maintenance). Les
 * photos s'ajoutent une fois l'état des lieux enregistré. Lecture seule sans
 * droit d'écriture.
 */
export function MouvementDialog({
  idChantier,
  vehicule,
  type,
  modifiable,
  onClose,
}: {
  idChantier: number;
  vehicule: MouvementsVehicule;
  type: TypeMouvement;
  modifiable: boolean;
  onClose: () => void;
}) {
  const existant = type === "SORTIE" ? vehicule.sortie : vehicule.retour;
  const autre = type === "SORTIE" ? vehicule.retour : vehicule.sortie;
  const [saisie, setSaisie] = useState<SaisieMouvement>(() => saisieMouvement(existant, new Date()));
  const [autreManquant, setAutreManquant] = useState("");
  const enregistrer = useEnregistrerMouvement(idChantier);
  const supprimer = useSupprimerMouvement(idChantier);
  const ajouterPhoto = useAjouterPhotoMouvement(idChantier);
  const retirerPhoto = useRetirerPhotoMouvement(idChantier);

  const maj = (modif: Partial<SaisieMouvement>) => setSaisie((s) => ({ ...s, ...modif }));
  const probleme = problemeMouvement(saisie, type, { debut: vehicule.debut, fin: vehicule.fin }, autre, new Date());
  const elements = useMemo(
    () => Array.from(new Set([...vehicule.elementsBord, ...saisie.manquants])).sort((a, b) => a.localeCompare(b, "fr")),
    [vehicule.elementsBord, saisie.manquants],
  );
  const basculer = (element: string) =>
    maj({ manquants: saisie.manquants.includes(element) ? saisie.manquants.filter((m) => m !== element) : [...saisie.manquants, element] });

  const valider = async () => {
    if (probleme) return;
    try {
      await enregistrer.mutateAsync({ idAffectation: vehicule.idAffectation, type, requete: requeteMouvement(saisie, type) });
      toast.success(type === "SORTIE" ? "Sortie enregistrée" : "Retour enregistré");
      // Première fois : le formulaire reste ouvert pour ajouter les photos.
      if (existant) onClose();
      else maj({ declarerDegats: false, creerMaintenance: false });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const confirmer = useConfirmer();
  const surSupprimer = async () => {
    if (!existant) return;
    const ok = await confirmer({
      titre: "Supprimer cet état des lieux ?",
      message: "L'état des lieux et ses photos seront supprimés définitivement.",
      libelleConfirmer: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await supprimer.mutateAsync(existant.idMouvement);
      toast.success("État des lieux supprimé");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Suppression impossible");
    }
  };

  const surPhoto = async (fichier: File | null) => {
    if (!fichier || !existant) return;
    try {
      await ajouterPhoto.mutateAsync({ idMouvement: existant.idMouvement, fichier });
      toast.success("Photo ajoutée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Photo refusée");
    }
  };

  const titre = type === "SORTIE" ? "Sortie vers le chantier" : "Retour du chantier";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>
            {vehicule.vehicule} — période du {formatDate(vehicule.debut)} au {formatDate(vehicule.fin)}
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={!modifiable} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mvt-date">Date et heure</Label>
              <Input id="mvt-date" type="datetime-local" value={saisie.dateHeure} onChange={(e) => maj({ dateHeure: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>État constaté</Label>
              <Select value={saisie.etat} onValueChange={(v) => maj({ etat: v as EtatMateriel })}>
                <SelectTrigger aria-label="État constaté">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ETATS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {LIBELLES_ETAT[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="mvt-km">Kilométrage</Label>
              <Input id="mvt-km" inputMode="decimal" value={saisie.kilometrage} onChange={(e) => maj({ kilometrage: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mvt-h">Compteur horaire (h)</Label>
              <Input id="mvt-h" inputMode="decimal" value={saisie.compteurHoraire} onChange={(e) => maj({ compteurHoraire: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mvt-carb">Carburant (%)</Label>
              <Input id="mvt-carb" inputMode="numeric" value={saisie.niveauCarburant} onChange={(e) => maj({ niveauCarburant: e.target.value })} />
            </div>
          </div>

          <section aria-label="Éléments de bord manquants" className="space-y-2">
            <h3 className="text-sm font-medium">Éléments de bord manquants</h3>
            {elements.length === 0 && <p className="text-xs text-muted-foreground">Aucun élément de bord enregistré pour ce véhicule.</p>}
            <div className="flex flex-wrap gap-2">
              {elements.map((e) => (
                <label key={e} className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm">
                  <input type="checkbox" checked={saisie.manquants.includes(e)} onChange={() => basculer(e)} />
                  {e}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                aria-label="Autre élément manquant"
                placeholder="Autre élément manquant"
                value={autreManquant}
                maxLength={100}
                onChange={(e) => setAutreManquant(e.target.value)}
                className="h-9 max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!autreManquant.trim()}
                onClick={() => {
                  maj({ manquants: [...saisie.manquants, autreManquant.trim()] });
                  setAutreManquant("");
                }}
              >
                Ajouter
              </Button>
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="mvt-obs">Observations</Label>
            <Textarea id="mvt-obs" rows={3} maxLength={2000} value={saisie.observations} onChange={(e) => maj({ observations: e.target.value })} />
          </div>

          {type === "RETOUR" && (
            <section aria-label="Évaluation et suites" className="space-y-3 rounded-md border p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Note du véhicule</Label>
                  <Select value={saisie.note || SANS_NOTE} onValueChange={(v) => maj({ note: v === SANS_NOTE ? "" : v })}>
                    <SelectTrigger aria-label="Note du véhicule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SANS_NOTE}>Sans note</SelectItem>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {"★".repeat(n)} ({n}/5)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mvt-comm">Commentaire du chantier</Label>
                  <Input id="mvt-comm" maxLength={500} value={saisie.commentaireNote} onChange={(e) => maj({ commentaireNote: e.target.value })} />
                </div>
              </div>
              {!existant?.idIncident && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saisie.declarerDegats} disabled={saisie.etat !== "ENDOMMAGE"}
                    onChange={(e) => maj({ declarerDegats: e.target.checked })} />
                  Déclarer un incident « Dégâts » rattaché au chantier
                </label>
              )}
              {!existant?.idMaintenance && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saisie.creerMaintenance} disabled={saisie.etat === "BON"}
                    onChange={(e) => maj({ creerMaintenance: e.target.checked })} />
                  Créer une maintenance corrective (remise en état, imputée au chantier)
                </label>
              )}
              {existant?.idIncident && <p className="text-xs text-muted-foreground">Incident n° {existant.idIncident} déclaré.</p>}
              {existant?.idMaintenance && (
                <p className="text-xs text-muted-foreground">
                  Maintenance n° {existant.idMaintenance} ({existant.statutMaintenance?.toLowerCase().replace("_", " ")}).
                </p>
              )}
            </section>
          )}
          {modifiable && probleme && <p className="text-sm text-destructive">{probleme}</p>}
        </fieldset>

        {existant && (
          <section aria-label="Photos" className="space-y-2">
            <h3 className="text-sm font-medium">
              Photos ({existant.photos.length}/{MAX_PHOTOS_MOUVEMENT})
            </h3>
            {existant.photos.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {existant.photos.map((p) => (
                  <li key={p.idPhoto} className="relative">
                    <AuthenticatedImage url={p.urlFichier} alt={p.legende ?? "Photo de l'état des lieux"} className="h-20 w-full rounded-md" />
                    {modifiable && (
                      <Button type="button" variant="secondary" size="icon" className="absolute right-1 top-1 h-6 w-6"
                        aria-label="Retirer la photo"
                        onClick={() => retirerPhoto.mutate(p.idPhoto, { onError: () => toast.error("Retrait impossible") })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {modifiable && existant.photos.length < MAX_PHOTOS_MOUVEMENT && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                {ajouterPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                Ajouter une photo
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={(e) => {
                    void surPhoto(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }} />
              </label>
            )}
          </section>
        )}
        {!existant && modifiable && <p className="text-xs text-muted-foreground">Les photos peuvent être ajoutées après l'enregistrement.</p>}

        <DialogFooter className="gap-2">
          {existant && modifiable && (
            <Button type="button" variant="ghost" className="mr-auto text-destructive" onClick={surSupprimer} disabled={supprimer.isPending}>
              Supprimer
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {modifiable && (
            <Button type="button" onClick={valider} disabled={!!probleme || enregistrer.isPending}>
              {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
