import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ChantierCarte } from "@/types/carte-gps";

export interface CouchesCarte {
  chantiers: boolean;
  perimetres: boolean;
  plans: boolean;
}

export const COUCHES_PAR_DEFAUT: CouchesCarte = { chantiers: true, perimetres: true, plans: false };

const LIBELLES: Record<keyof CouchesCarte, string> = {
  chantiers: "Chantiers",
  perimetres: "Périmètres de présence",
  plans: "Plans des chantiers",
};

/** Interrupteurs des couches « chantiers » et choix « centrer sur un chantier » (carte GPS, 2026-09-30). */
export function ControlesCarte({
  couches,
  onCouches,
  chantiers,
  idChantierCentre,
  onCentrer,
}: {
  couches: CouchesCarte;
  onCouches: (c: CouchesCarte) => void;
  chantiers: readonly ChantierCarte[] | undefined;
  idChantierCentre: string;
  onCentrer: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {(Object.keys(LIBELLES) as (keyof CouchesCarte)[]).map((cle) => (
        <label key={cle} className="flex items-center gap-2 text-sm">
          <Switch
            checked={couches[cle]}
            disabled={cle !== "chantiers" && !couches.chantiers}
            onCheckedChange={(v) => onCouches({ ...couches, [cle]: v })}
            aria-label={LIBELLES[cle]}
          />
          {LIBELLES[cle]}
        </label>
      ))}
      {couches.chantiers && (chantiers?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-normal text-muted-foreground">Centrer sur</Label>
          <Select value={idChantierCentre} onValueChange={onCentrer}>
            <SelectTrigger className="h-8 w-56">
              <SelectValue placeholder="Un chantier…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toute la carte</SelectItem>
              {chantiers?.map((c) => (
                <SelectItem key={c.idChantier} value={String(c.idChantier)}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
