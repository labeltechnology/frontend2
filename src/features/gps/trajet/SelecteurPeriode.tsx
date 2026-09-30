import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIBELLES_PERIODE, type ChoixPeriode } from "@/features/gps/trajet/periode";

/** Choix de la période du trajet : aujourd'hui, hier, 7 jours ou dates au choix (31 jours au plus). */
export function SelecteurPeriode({
  choix,
  onChoix,
  perso,
  onPerso,
  erreur,
}: {
  choix: ChoixPeriode;
  onChoix: (c: ChoixPeriode) => void;
  perso: { debut: string; fin: string };
  onPerso: (p: { debut: string; fin: string }) => void;
  erreur: string | null;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-2">
        <Label>Période</Label>
        <Select value={choix} onValueChange={(v) => onChoix(v as ChoixPeriode)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LIBELLES_PERIODE) as ChoixPeriode[]).map((c) => (
              <SelectItem key={c} value={c}>
                {LIBELLES_PERIODE[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {choix === "PERSO" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="trajet-du">Du</Label>
            <Input id="trajet-du" type="date" className="w-40" value={perso.debut} onChange={(e) => onPerso({ ...perso, debut: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trajet-au">Au</Label>
            <Input id="trajet-au" type="date" className="w-40" value={perso.fin} onChange={(e) => onPerso({ ...perso, fin: e.target.value })} />
          </div>
        </>
      )}
      {erreur && <p className="pb-2 text-sm text-destructive">{erreur}</p>}
    </div>
  );
}
