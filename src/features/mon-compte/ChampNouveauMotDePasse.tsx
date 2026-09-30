import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { problemesMotDePasse } from "@/features/mon-compte/mot-de-passe";
import { cn } from "@/lib/utils";

/**
 * Nouveau mot de passe + confirmation, avec les règles affichées au fil de
 * la frappe (2026-09-29). `valide` n'est vrai que si les deux concordent et
 * qu'aucune règle vérifiable à l'écran n'est enfreinte.
 */
export function ChampNouveauMotDePasse({
  valeur,
  onChange,
  confirmation,
  onConfirmation,
  infos,
  id = "nouveauMotDePasse",
}: {
  valeur: string;
  onChange: (v: string) => void;
  confirmation: string;
  onConfirmation: (v: string) => void;
  infos: { email?: string | null; nom?: string | null; prenom?: string | null };
  id?: string;
}) {
  const [visible, setVisible] = useState(false);
  const problemes = problemesMotDePasse(valeur, infos);
  const different = confirmation.length > 0 && confirmation !== valeur;
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={id}>Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id={id}
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Au moins 12 caractères. Une phrase courte et personnelle, ex. « le zébu traverse la RN7 ».</p>
        {valeur.length > 0 && problemes.length > 0 && (
          <ul className="space-y-0.5 text-xs text-destructive">
            {problemes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-confirmation`}>Confirmer le mot de passe</Label>
        <Input
          id={`${id}-confirmation`}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => onConfirmation(e.target.value)}
          className={cn(different && "border-destructive")}
        />
        {different && <p className="text-xs text-destructive">Les deux saisies ne sont pas identiques.</p>}
      </div>
    </div>
  );
}

export function nouveauMotDePasseValide(valeur: string, confirmation: string, infos: Parameters<typeof problemesMotDePasse>[1]): boolean {
  return valeur === confirmation && problemesMotDePasse(valeur, infos).length === 0;
}
