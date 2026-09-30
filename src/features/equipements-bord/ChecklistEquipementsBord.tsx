import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CategorieElementBord } from "@/types/equipement-bord";

/** Valeur saisie pour une ligne ; `present` absent = pas encore renseigné (la ligne n'est pas envoyée). */
export interface ValeurEquipementBord {
  present?: boolean;
  observation: string;
}

export interface LigneChecklist {
  idElementBord: number;
  libelle: string;
  categorie: CategorieElementBord;
}

const TITRES: Record<CategorieElementBord, string> = {
  SECURITE: "Éléments de sécurité",
  OUTIL: "Outils du chauffeur / boîte à outils",
};

interface ChecklistEquipementsBordProps {
  lignes: LigneChecklist[];
  valeurs: Record<number, ValeurEquipementBord>;
  onChange: (idElementBord: number, valeur: ValeurEquipementBord) => void;
  disabled?: boolean;
}

/**
 * Tableaux « OUI/NON + observation » de la fiche véhicule (reprend les
 * rubriques de la fiche papier de l'utilisateur). Composant de saisie pur,
 * sans appel réseau : utilisé à la création (FicheEnginPage) et au contrôle
 * d'un engin existant (EquipementsBordEngin).
 */
export function ChecklistEquipementsBord({ lignes, valeurs, onChange, disabled }: ChecklistEquipementsBordProps) {
  if (lignes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun élément de bord ne s'applique à ce type d'engin (voir l'écran « Listes de la fiche »).
      </p>
    );
  }

  const categories: CategorieElementBord[] = ["SECURITE", "OUTIL"];
  return (
    <div className="space-y-6">
      {categories.map((categorie) => {
        const lignesCategorie = lignes.filter((l) => l.categorie === categorie);
        if (lignesCategorie.length === 0) return null;
        return (
          <div key={categorie} className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">{TITRES[categorie]}</th>
                  <th className="w-36 px-3 py-2 text-center font-medium">Oui / Non</th>
                  <th className="px-3 py-2 font-medium">Observation</th>
                </tr>
              </thead>
              <tbody>
                {lignesCategorie.map((ligne) => {
                  const valeur = valeurs[ligne.idElementBord] ?? { observation: "" };
                  const choisir = (present: boolean) =>
                    onChange(ligne.idElementBord, {
                      ...valeur,
                      // Recliquer sur le choix actif l'efface (retour à « non renseigné »).
                      present: valeur.present === present ? undefined : present,
                    });
                  return (
                    <tr key={ligne.idElementBord} className="border-t">
                      <td className="px-3 py-2">{ligne.libelle}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1" role="group" aria-label={`${ligne.libelle} : présent ?`}>
                          <BoutonChoix actif={valeur.present === true} teinte="oui" disabled={disabled} onClick={() => choisir(true)}>
                            Oui
                          </BoutonChoix>
                          <BoutonChoix actif={valeur.present === false} teinte="non" disabled={disabled} onClick={() => choisir(false)}>
                            Non
                          </BoutonChoix>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`Observation — ${ligne.libelle}`}
                          value={valeur.observation}
                          maxLength={500}
                          disabled={disabled}
                          onChange={(e) => onChange(ligne.idElementBord, { ...valeur, observation: e.target.value })}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function BoutonChoix({
  actif,
  teinte,
  disabled,
  onClick,
  children,
}: {
  actif: boolean;
  teinte: "oui" | "non";
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 min-w-12 rounded-md border px-2 text-xs font-medium transition-colors disabled:opacity-50",
        !actif && "bg-background text-muted-foreground hover:bg-accent",
        actif && teinte === "oui" && "border-transparent bg-badge-successBg text-badge-successFg",
        actif && teinte === "non" && "border-transparent bg-badge-dangerBg text-badge-dangerFg",
      )}
    >
      {children}
    </button>
  );
}

