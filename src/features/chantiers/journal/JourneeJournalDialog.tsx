import { useEffect, useMemo, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { useAffectationsChantier } from "@/features/chantiers/api";
import { useAjouterPhotoJournee, useEnregistrerJournee, useRetirerPhotoJournee } from "@/features/chantiers/journal/journal-api";
import {
  jourLocal,
  LIBELLES_METEO,
  lireHeures,
  MAX_PHOTOS,
  refusJournee,
  vehiculesDuJour,
} from "@/features/chantiers/journal/journal-chantier";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { Chantier, JournalChantier, Meteo } from "@/types/chantier";

const SANS_METEO = "aucune";

/**
 * Rédiger ou modifier une journée du journal de chantier (2026-09-29) :
 * météo, effectif, travaux, incidents, remarques, heures de chaque véhicule
 * prévu ce jour-là ; les photos s'ajoutent une fois la journée enregistrée.
 */
export function JourneeJournalDialog({
  chantier,
  journaux,
  journee,
  jourPropose,
  open,
  onOpenChange,
}: {
  chantier: Chantier;
  journaux: JournalChantier[];
  /** Journée modifiée ; null = nouvelle journée. */
  journee: JournalChantier | null;
  jourPropose: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const aujourdhui = jourLocal(new Date());
  const enregistrer = useEnregistrerJournee(chantier.idChantier);
  const ajouterPhoto = useAjouterPhotoJournee(chantier.idChantier);
  const retirerPhoto = useRetirerPhotoJournee(chantier.idChantier);
  const { data: affectations } = useAffectationsChantier(chantier.idChantier);

  const [jour, setJour] = useState("");
  const [meteo, setMeteo] = useState<string>(SANS_METEO);
  const [effectif, setEffectif] = useState("");
  const [travaux, setTravaux] = useState("");
  const [incidents, setIncidents] = useState("");
  const [remarques, setRemarques] = useState("");
  const [heures, setHeures] = useState<Record<number, string>>({});
  const [legende, setLegende] = useState("");

  // Réinitialise le formulaire à chaque ouverture (nouvelle journée ou journée modifiée).
  useEffect(() => {
    if (!open) return;
    setJour(journee?.dateJour ?? jourPropose ?? "");
    setMeteo(journee?.meteo ?? SANS_METEO);
    setEffectif(journee?.effectif != null ? String(journee.effectif) : "");
    setTravaux(journee?.travauxRealises ?? "");
    setIncidents(journee?.incidents ?? "");
    setRemarques(journee?.remarques ?? "");
    setHeures(Object.fromEntries((journee?.engins ?? []).map((e) => [e.idEngin, String(e.heures).replace(".", ",")])));
    setLegende("");
  }, [open, journee, jourPropose]);

  // La journée affichée dans la liste (photos à jour après un envoi).
  const actuelle = journee ? (journaux.find((j) => j.idJournal === journee.idJournal) ?? journee) : null;
  const vehicules = useMemo(() => (jour ? vehiculesDuJour(affectations ?? [], jour) : []), [affectations, jour]);
  const erreurJour = refusJournee(jour, chantier, journaux, aujourdhui, journee?.idJournal);
  const heuresInvalides = vehicules.some((v) => Number.isNaN(lireHeures(heures[v.engin.idEngin] ?? "")));
  const effectifNombre = effectif.trim() === "" ? null : Number(effectif);
  const effectifInvalide = effectifNombre !== null && (!Number.isInteger(effectifNombre) || effectifNombre < 0 || effectifNombre > 10000);

  const surEnregistrer = async () => {
    const engins = vehicules.flatMap((v) => {
      const h = lireHeures(heures[v.engin.idEngin] ?? "");
      return h === null || Number.isNaN(h) ? [] : [{ idEngin: v.engin.idEngin, heures: h }];
    });
    try {
      await enregistrer.mutateAsync({
        idJournal: journee?.idJournal,
        requete: {
          dateJour: jour,
          meteo: meteo === SANS_METEO ? null : (meteo as Meteo),
          effectif: effectifNombre,
          travauxRealises: travaux.trim() || undefined,
          incidents: incidents.trim() || undefined,
          remarques: remarques.trim() || undefined,
          engins,
        },
      });
      toast.success(journee ? "Journée modifiée" : "Journée enregistrée : vous pouvez y ajouter des photos en la modifiant");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const surPhoto = async (fichier: File | null) => {
    if (!fichier || !actuelle) return;
    try {
      await ajouterPhoto.mutateAsync({ idJournal: actuelle.idJournal, fichier, legende: legende.trim() || undefined });
      setLegende("");
      toast.success("Photo ajoutée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Envoi impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{journee ? `Journée du ${formatDate(journee.dateJour)}` : "Nouvelle journée"}</DialogTitle>
          <DialogDescription>Chantier « {chantier.nom} » — ce qui s'est passé sur le site ce jour-là.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="journal-jour">Date</Label>
            <Input
              id="journal-jour"
              type="date"
              value={jour}
              min={chantier.dateDebutPrevue}
              max={aujourdhui < chantier.dateFinPrevue ? aujourdhui : chantier.dateFinPrevue}
              disabled={journee !== null}
              onChange={(e) => setJour(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Météo</Label>
            <Select value={meteo} onValueChange={setMeteo}>
              <SelectTrigger aria-label="Météo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SANS_METEO}>Non renseignée</SelectItem>
                {(Object.keys(LIBELLES_METEO) as Meteo[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {LIBELLES_METEO[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journal-effectif">Personnes sur le site</Label>
            <Input id="journal-effectif" inputMode="numeric" value={effectif} onChange={(e) => setEffectif(e.target.value)} />
          </div>
        </div>
        {erreurJour && jour && <p className="text-sm text-destructive">{erreurJour}</p>}
        {effectifInvalide && <p className="text-sm text-destructive">L'effectif doit être un nombre entier compris entre 0 et 10 000.</p>}

        <div className="space-y-1.5">
          <Label htmlFor="journal-travaux">Travaux réalisés</Label>
          <Textarea id="journal-travaux" rows={3} maxLength={2000} value={travaux} onChange={(e) => setTravaux(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="journal-incidents">Incidents</Label>
            <Textarea id="journal-incidents" rows={2} maxLength={2000} value={incidents} onChange={(e) => setIncidents(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journal-remarques">Remarques</Label>
            <Textarea id="journal-remarques" rows={2} maxLength={2000} value={remarques} onChange={(e) => setRemarques(e.target.value)} />
          </div>
        </div>

        <section aria-label="Heures des véhicules" className="space-y-2">
          <h3 className="text-sm font-medium">Heures de travail des véhicules</h3>
          {!jour ? (
            <p className="text-sm text-muted-foreground">Choisissez d'abord la date.</p>
          ) : vehicules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun véhicule n'était prévu sur le chantier ce jour-là.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border">
              {vehicules.map((v) => {
                const valeur = heures[v.engin.idEngin] ?? "";
                const invalide = Number.isNaN(lireHeures(valeur));
                return (
                  <li key={v.engin.idEngin} className="flex items-center gap-3 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{libelleVehicule(v.engin)}</span>
                    <Input
                      aria-label={`Heures de ${libelleVehicule(v.engin)}`}
                      inputMode="decimal"
                      placeholder="0"
                      value={valeur}
                      onChange={(e) => setHeures((h) => ({ ...h, [v.engin.idEngin]: e.target.value }))}
                      className={invalide ? "h-8 w-20 border-destructive" : "h-8 w-20"}
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </li>
                );
              })}
            </ul>
          )}
          {heuresInvalides && <p className="text-sm text-destructive">Le nombre d'heures doit être compris entre 0 et 24 par véhicule.</p>}
        </section>

        {actuelle && (
          <section aria-label="Photos" className="space-y-2">
            <h3 className="text-sm font-medium">
              Photos ({actuelle.photos.length}/{MAX_PHOTOS})
            </h3>
            {actuelle.photos.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {actuelle.photos.map((p) => (
                  <li key={p.idPhoto} className="relative">
                    <AuthenticatedImage url={p.urlFichier} alt={p.legende ?? "Photo du chantier"} className="h-20 w-full rounded-md" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6"
                      aria-label="Retirer la photo"
                      onClick={() => retirerPhoto.mutate(p.idPhoto, { onError: () => toast.error("Retrait impossible") })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {actuelle.photos.length < MAX_PHOTOS && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Légende de la photo"
                  placeholder="Légende (facultative)"
                  value={legende}
                  maxLength={255}
                  onChange={(e) => setLegende(e.target.value)}
                  className="h-9 max-w-xs"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                  {ajouterPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
                  Ajouter une photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      void surPhoto(e.target.files?.[0] ?? null);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}
          </section>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            type="button"
            disabled={!!erreurJour || heuresInvalides || effectifInvalide || enregistrer.isPending}
            onClick={surEnregistrer}
          >
            {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer la journée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
