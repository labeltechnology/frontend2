import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nouvelleCle, totalLignes, type CalculLigneStock, type LigneStockSaisie } from "@/features/maintenance/pieces-maintenance";
import { formatMontant } from "@/lib/utils";
import type { Piece } from "@/types/maintenance";

interface SaisiePiecesStockProps {
  lignes: LigneStockSaisie[];
  calculs: CalculLigneStock[];
  pieces: Piece[];
  onChange: (lignes: LigneStockSaisie[]) => void;
}

/**
 * Pièces de l'atelier INTERNE (2026-09-25) : pièce du stock + quantité ; le
 * prix unitaire vient du stock et le montant est calculé. Le stock diminue à
 * l'enregistrement (règle 9.14, côté serveur).
 */
export function SaisiePiecesStock({ lignes, calculs, pieces, onChange }: SaisiePiecesStockProps) {
  const modifier = (cle: string, champ: Partial<LigneStockSaisie>) =>
    onChange(lignes.map((l) => (l.cle === cle ? { ...l, ...champ } : l)));

  return (
    <div className="space-y-2">
      {lignes.length === 0 && <p className="text-xs text-muted-foreground">Aucune pièce du stock.</p>}
      {lignes.map((ligne, i) => {
        const calcul = calculs[i];
        return (
          <div key={ligne.cle} className="space-y-1 rounded-md border border-border p-2">
            <div className="grid grid-cols-[1fr_5rem_auto] items-end gap-2">
              <Select value={ligne.idPiece} onValueChange={(v) => modifier(ligne.cle, { idPiece: v })}>
                <SelectTrigger aria-label={`Pièce ${i + 1}`}>
                  <SelectValue placeholder="Choisir une pièce du stock" />
                </SelectTrigger>
                <SelectContent>
                  {pieces.map((p) => (
                    <SelectItem key={p.idPiece} value={String(p.idPiece)} disabled={p.quantiteStock <= 0}>
                      {p.nom} ({p.reference}) — {formatMontant(p.prixUnitaire)} — stock {p.quantiteStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label={`Quantité ${i + 1}`}
                inputMode="numeric"
                value={ligne.quantite}
                onChange={(e) => modifier(ligne.cle, { quantite: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Retirer la pièce ${i + 1}`}
                onClick={() => onChange(lignes.filter((l) => l.cle !== ligne.cle))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-destructive">{calcul?.erreur}</span>
              <span className="text-muted-foreground">
                {calcul?.piece && `${formatMontant(calcul.piece.prixUnitaire)} × ${calcul.quantite ?? "?"} = `}
                <span className="font-medium text-foreground">{formatMontant(calcul?.montant)}</span>
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => onChange([...lignes, { cle: nouvelleCle(), idPiece: "", quantite: "1" }])}>
          <Plus className="h-4 w-4" />
          Ajouter une pièce
        </Button>
        <p className="text-sm">
          Total pièces : <span className="font-semibold">{formatMontant(totalLignes(calculs))}</span>
        </p>
      </div>
    </div>
  );
}
