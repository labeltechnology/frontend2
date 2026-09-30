import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apercuEcheance, decrireIntervalle, uniteCompteur } from "@/features/entretien/echeance";
import type { CategorieEngin } from "@/types/engin";
import type { PosteEntretien } from "@/types/entretien";

/** Saisie d'un bloc ; chaînes brutes, converties et validées par la page au moment d'enregistrer. */
export interface ValeurEntretienInitial {
  dateDerniereIntervention: string;
  compteurDerniereIntervention: string;
  observation: string;
}

const ENTRETIEN_VIDE: ValeurEntretienInitial = {
  dateDerniereIntervention: "",
  compteurDerniereIntervention: "",
  observation: "",
};

interface SaisieEntretienInitialProps {
  postes: PosteEntretien[];
  categorie: CategorieEngin | undefined;
  valeurs: Record<number, ValeurEntretienInitial>;
  erreurs: Record<number, string>;
  onChange: (idPosteEntretien: number, valeur: ValeurEntretienInitial) => void;
  /** Convertit la saisie du compteur (« 85 000 », « 12,5 ») — fourni par la page pour une seule règle de conversion. */
  versNombre: (valeur: string) => number | undefined;
}

/**
 * Blocs « Entretien du véhicule » de la fiche papier, à la création d'un
 * engin : dernière intervention connue par poste. La prochaine échéance
 * n'est pas saisie : elle est calculée (choix validé avec l'utilisateur) —
 * un aperçu s'affiche sous chaque bloc.
 */
export function SaisieEntretienInitial({ postes, categorie, valeurs, erreurs, onChange, versNombre }: SaisieEntretienInitialProps) {
  if (postes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun poste d'entretien ne s'applique à ce type de véhicule (voir l'écran « Listes de la fiche »).
      </p>
    );
  }
  const unite = uniteCompteur(categorie);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {postes.map((poste) => {
        const valeur = valeurs[poste.idPosteEntretien] ?? ENTRETIEN_VIDE;
        const maj = (champ: keyof ValeurEntretienInitial, v: string) =>
          onChange(poste.idPosteEntretien, { ...valeur, [champ]: v });
        const apercu = apercuEcheance(
          poste,
          categorie,
          valeur.dateDerniereIntervention || undefined,
          versNombre(valeur.compteurDerniereIntervention),
        );
        const id = `entretien-${poste.idPosteEntretien}`;
        return (
          <div key={poste.idPosteEntretien} className="space-y-3 rounded-md border p-4">
            <div>
              <p className="font-medium">{poste.libelle}</p>
              <p className="text-xs text-muted-foreground">{decrireIntervalle(poste, categorie)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-date`}>Dernière intervention</Label>
                <Input
                  id={`${id}-date`}
                  type="date"
                  value={valeur.dateDerniereIntervention}
                  onChange={(e) => maj("dateDerniereIntervention", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${id}-compteur`}>{unite === "h" ? "Heures moteur" : "Kilométrage"} à l'intervention</Label>
                <Input
                  id={`${id}-compteur`}
                  inputMode="decimal"
                  value={valeur.compteurDerniereIntervention}
                  onChange={(e) => maj("compteurDerniereIntervention", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-observation`}>Observations sur l'entretien</Label>
              <Input
                id={`${id}-observation`}
                maxLength={500}
                value={valeur.observation}
                onChange={(e) => maj("observation", e.target.value)}
              />
            </div>
            {erreurs[poste.idPosteEntretien] ? (
              <p className="text-sm text-destructive">{erreurs[poste.idPosteEntretien]}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Prochaine échéance : {apercu ?? "calculée dès qu'une date ou un compteur est saisi"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
