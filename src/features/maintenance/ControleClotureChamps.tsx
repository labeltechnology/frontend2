import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { SaisieControle } from "@/features/maintenance/controle-cloture";

/**
 * Champs « Contrôle qualité » de la fenêtre Terminer la maintenance
 * (2026-09-29). Une réserve crée une alerte « Réserve au contrôle qualité ».
 */
export function ControleClotureChamps({
  valeur,
  onChange,
}: {
  valeur: SaisieControle;
  onChange: (v: SaisieControle) => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-md border px-3 py-3">
      <legend className="px-1 text-sm font-medium">Contrôle qualité</legend>
      <div className="space-y-1.5">
        <Label htmlFor="controlePar">Contrôlé par</Label>
        <Input
          id="controlePar"
          maxLength={100}
          placeholder="Nom du chef d'atelier ou du contrôleur"
          value={valeur.controlePar}
          onChange={(e) => onChange({ ...valeur, controlePar: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="essaiOk" className="leading-snug">
          Essai concluant
          <span className="block text-xs font-normal text-muted-foreground">
            Véhicule essayé après réparation. Sinon, la maintenance reste en cours.
          </span>
        </Label>
        <Switch id="essaiOk" checked={valeur.essaiOk} onCheckedChange={(v) => onChange({ ...valeur, essaiOk: v })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reserve">Réserve (facultatif)</Label>
        <Textarea
          id="reserve"
          rows={2}
          maxLength={500}
          placeholder="Ex. : bruit au freinage à revoir à la prochaine vidange"
          value={valeur.reserve}
          onChange={(e) => onChange({ ...valeur, reserve: e.target.value })}
        />
        {valeur.reserve.trim() && (
          <p className="text-xs text-badge-warningFg">Une alerte « Réserve au contrôle qualité » sera créée.</p>
        )}
      </div>
    </fieldset>
  );
}
