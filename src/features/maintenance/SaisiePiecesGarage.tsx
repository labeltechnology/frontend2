import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nouvelleCle, totalLignes, type CalculLigneGarage, type LigneGarageSaisie } from "@/features/maintenance/pieces-maintenance";
import { formatMontant } from "@/lib/utils";

interface SaisiePiecesGarageProps {
  lignes: LigneGarageSaisie[];
  calculs: CalculLigneGarage[];
  mainOeuvre: string;
  /** Main-d'œuvre lue (null = saisie invalide). */
  mainOeuvreLue: number | null;
  onChangeLignes: (lignes: LigneGarageSaisie[]) => void;
  onChangeMainOeuvre: (valeur: string) => void;
}

/**
 * Pièces et main-d'œuvre d'un GARAGE EXTERNE (2026-09-25, V46) : lignes
 * libres facturées par le garage (sans sortie du stock interne) ; coût
 * total = pièces + main-d'œuvre.
 */
export function SaisiePiecesGarage({
  lignes,
  calculs,
  mainOeuvre,
  mainOeuvreLue,
  onChangeLignes,
  onChangeMainOeuvre,
}: SaisiePiecesGarageProps) {
  const modifier = (cle: string, champ: Partial<LigneGarageSaisie>) =>
    onChangeLignes(lignes.map((l) => (l.cle === cle ? { ...l, ...champ } : l)));
  const totalPieces = totalLignes(calculs);

  return (
    <div className="space-y-2">
      {lignes.length === 0 && <p className="text-xs text-muted-foreground">Aucune pièce facturée par le garage.</p>}
      {lignes.map((ligne, i) => {
        const calcul = calculs[i];
        return (
          <div key={ligne.cle} className="space-y-1 rounded-md border border-border p-2">
            <div className="grid grid-cols-[1fr_4.5rem_7rem_auto] items-end gap-2">
              <Input
                aria-label={`Désignation ${i + 1}`}
                placeholder="Désignation (ex. : plaquettes avant)"
                maxLength={150}
                value={ligne.designation}
                onChange={(e) => modifier(ligne.cle, { designation: e.target.value })}
              />
              <Input
                aria-label={`Quantité ${i + 1}`}
                inputMode="numeric"
                value={ligne.quantite}
                onChange={(e) => modifier(ligne.cle, { quantite: e.target.value })}
              />
              <Input
                aria-label={`Prix unitaire ${i + 1}`}
                inputMode="decimal"
                placeholder="Prix unitaire"
                value={ligne.prixUnitaire}
                onChange={(e) => modifier(ligne.cle, { prixUnitaire: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Retirer la pièce ${i + 1}`}
                onClick={() => onChangeLignes(lignes.filter((l) => l.cle !== ligne.cle))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-destructive">{calcul?.erreur}</span>
              <span className="font-medium">{formatMontant(calcul?.montant)}</span>
            </div>
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChangeLignes([...lignes, { cle: nouvelleCle(), designation: "", quantite: "1", prixUnitaire: "" }])}
      >
        <Plus className="h-4 w-4" />
        Ajouter une pièce du garage
      </Button>
      <div className="grid items-end gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="garage-main-oeuvre">Main-d'œuvre du garage</Label>
          <Input
            id="garage-main-oeuvre"
            inputMode="decimal"
            placeholder="0"
            value={mainOeuvre}
            onChange={(e) => onChangeMainOeuvre(e.target.value)}
          />
          {mainOeuvreLue === null && <p className="text-xs text-destructive">Nombre positif ou nul.</p>}
        </div>
        <div className="space-y-0.5 text-right text-sm">
          <p>
            Pièces : <span className="font-medium">{formatMontant(totalPieces)}</span>
          </p>
          <p>
            Main-d'œuvre : <span className="font-medium">{formatMontant(mainOeuvreLue ?? 0)}</span>
          </p>
          <p className="text-base">
            Coût total : <span className="font-semibold">{formatMontant(totalPieces + (mainOeuvreLue ?? 0))}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
