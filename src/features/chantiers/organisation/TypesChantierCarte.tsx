import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEnregistrerTypeChantier, useTypesChantier } from "@/features/chantiers/organisation/organisation-api";
import { ApiError } from "@/lib/api-client";
import { formatNombre } from "@/lib/utils";
import type { TypeChantier } from "@/types/chantier";

/** Référentiel des types de chantier (V64) : conditions d'entretien et heures prévues par jour. */
export function TypesChantierCarte({ modifiable }: { modifiable: boolean }) {
  const { data: types, isLoading } = useTypesChantier();
  const [edite, setEdite] = useState<TypeChantier | "nouveau" | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">Types de chantier</CardTitle>
          <CardDescription>
            Facteur d'entretien : 1 = conditions normales ; 0,75 = sévères (l'entretien arrive 25 % plus tôt). Heures
            prévues par véhicule et par jour : base du taux d'utilisation réelle.
          </CardDescription>
        </div>
        {modifiable && (
          <Button type="button" size="sm" variant="outline" onClick={() => setEdite("nouveau")}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        <ul className="divide-y">
          {(types ?? []).map((t) => (
            <li key={t.idTypeChantier} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{t.libelle}</span>
                {t.facteurEntretien < 1 && <Badge variant="warning">Sévère ×{formatNombre(t.facteurEntretien, 2)}</Badge>}
                {!t.actif && <Badge variant="outline">Désactivé</Badge>}
                <span className="text-muted-foreground">{formatNombre(t.heuresJourPrevues, 1)} h / jour</span>
              </span>
              {modifiable && (
                <Button type="button" size="icon" variant="ghost" aria-label={`Modifier ${t.libelle}`} onClick={() => setEdite(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
      {edite && <TypeChantierDialog type={edite === "nouveau" ? null : edite} onClose={() => setEdite(null)} />}
    </Card>
  );
}

function TypeChantierDialog({ type, onClose }: { type: TypeChantier | null; onClose: () => void }) {
  const enregistrer = useEnregistrerTypeChantier();
  const [libelle, setLibelle] = useState(type?.libelle ?? "");
  const [facteur, setFacteur] = useState(String(type?.facteurEntretien ?? 1));
  const [heures, setHeures] = useState(String(type?.heuresJourPrevues ?? 8));
  const [actif, setActif] = useState(type?.actif ?? true);
  const f = Number(facteur.replace(",", "."));
  const h = Number(heures.replace(",", "."));
  const probleme = !libelle.trim()
    ? "Indiquez le libellé."
    : !(f >= 0.3 && f <= 1)
      ? "Le facteur d'entretien doit être compris entre 0,3 et 1."
      : !(h >= 0.5 && h <= 24)
        ? "Le nombre d'heures par jour doit être compris entre 0,5 et 24."
        : null;

  const valider = async () => {
    if (probleme) return;
    try {
      await enregistrer.mutateAsync({
        id: type?.idTypeChantier,
        requete: { libelle: libelle.trim(), facteurEntretien: f, heuresJourPrevues: h, actif },
      });
      toast.success("Type de chantier enregistré");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? "Modifier le type de chantier" : "Nouveau type de chantier"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="type-libelle">Libellé</Label>
            <Input id="type-libelle" value={libelle} maxLength={100} onChange={(e) => setLibelle(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type-facteur">Facteur d'entretien</Label>
              <Input id="type-facteur" inputMode="decimal" value={facteur} onChange={(e) => setFacteur(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-heures">Heures prévues par jour</Label>
              <Input id="type-heures" inputMode="decimal" value={heures} onChange={(e) => setHeures(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={actif} onCheckedChange={setActif} />
            Actif (proposé sur les fiches)
          </label>
          {probleme && <p className="text-sm text-destructive">{probleme}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={valider} disabled={!!probleme || enregistrer.isPending}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
