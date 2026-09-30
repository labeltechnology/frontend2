import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TypeEngin } from "@/types/engin";
import {
  nouvelleLigneBesoin,
  quantiteValide,
  type CouvertureType,
  type EtatCouverture,
  type LigneBesoin,
} from "@/features/chantiers/fiche/couverture-besoins";

const CLASSES_ETAT: Record<EtatCouverture, { barre: string; texte: string }> = {
  vide: { barre: "bg-badge-neutralFg", texte: "text-muted-foreground" },
  partiel: { barre: "bg-badge-warningFg", texte: "text-badge-warningFg" },
  complet: { barre: "bg-badge-successFg", texte: "text-badge-successFg" },
  depasse: { barre: "bg-badge-infoFg", texte: "text-badge-infoFg" },
  "hors-besoin": { barre: "bg-badge-infoFg", texte: "text-badge-infoFg" },
};

const LIBELLE_ETAT: Record<EtatCouverture, string> = {
  vide: "aucun déposé",
  partiel: "incomplet",
  complet: "complet",
  depasse: "plus que demandé",
  "hors-besoin": "sans besoin exprimé",
};

/** Jauge « 2 / 3 affectés » d'un type d'engin : se remplit à chaque engin déposé. */
function Jauge({ couverture }: { couverture: CouvertureType }) {
  const { requis, affectes, etat } = couverture;
  const ratio = requis > 0 ? Math.min(affectes / requis, 1) : 1;
  return (
    <div className="min-w-[9rem] flex-1 space-y-1">
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={requis}
        aria-valuenow={affectes}
        aria-label={`${couverture.libelle} : ${affectes} affecté(s) sur ${requis}`}
      >
        <div className={cn("h-full rounded-full transition-all", CLASSES_ETAT[etat].barre)} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className={cn("text-xs", CLASSES_ETAT[etat].texte)}>
        {affectes} / {requis} affecté{affectes > 1 ? "s" : ""} — {LIBELLE_ETAT[etat]}
      </p>
    </div>
  );
}

interface BesoinsMaterielEditeurProps {
  lignes: LigneBesoin[];
  onChange: (lignes: LigneBesoin[]) => void;
  typesEngin: TypeEngin[];
  couverture: CouvertureType[];
  /** Disponibilité prévisionnelle par type, calculée par le backend au dernier enregistrement. */
  disponibilites: ReadonlyMap<number, number>;
  lectureSeule?: boolean;
}

/**
 * Rubrique « Besoins en matériel » de la fiche chantier : type d'engin ×
 * quantité, avec la jauge de couverture par les engins déposés (en direct)
 * et, pour un chantier déjà enregistré, la disponibilité prévisionnelle du
 * parc sur la période (calcul backend, BesoinMaterielChantierService).
 */
export function BesoinsMaterielEditeur({
  lignes,
  onChange,
  typesEngin,
  couverture,
  disponibilites,
  lectureSeule = false,
}: BesoinsMaterielEditeurProps) {
  const couvertureParType = new Map(couverture.map((c) => [c.idTypeEngin, c]));
  const horsBesoin = couverture.filter((c) => c.etat === "hors-besoin");
  const typesChoisis = new Set(lignes.map((l) => l.idTypeEngin).filter(Boolean));

  const modifier = (cle: string, champ: "idTypeEngin" | "quantite", valeur: string) =>
    onChange(lignes.map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l)));

  return (
    <div className="space-y-3">
      {lignes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun besoin exprimé. Indiquez les types d'engins nécessaires pour suivre la couverture et la disponibilité du parc.
        </p>
      )}
      {lignes.map((ligne) => {
        const idType = Number(ligne.idTypeEngin);
        const cov = ligne.idTypeEngin ? couvertureParType.get(idType) : undefined;
        const quantiteKo = ligne.quantite.trim() !== "" && quantiteValide(ligne.quantite) === null;
        const dispo = ligne.idTypeEngin ? disponibilites.get(idType) : undefined;
        const requis = quantiteValide(ligne.quantite);
        return (
          <div key={ligne.cle} className="flex flex-wrap items-start gap-2 rounded-md border border-border p-2">
            <Select
              value={ligne.idTypeEngin}
              onValueChange={(v) => modifier(ligne.cle, "idTypeEngin", v)}
              disabled={lectureSeule}
            >
              <SelectTrigger className="h-9 w-48" aria-label="Type de véhicule">
                <SelectValue placeholder="Type de véhicule" />
              </SelectTrigger>
              <SelectContent>
                {typesEngin
                  .filter((t) => String(t.idTypeEngin) === ligne.idTypeEngin || !typesChoisis.has(String(t.idTypeEngin)))
                  .map((t) => (
                    <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
                      {t.libelle}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div>
              <Input
                aria-label="Quantité"
                type="number"
                min={1}
                max={999}
                value={ligne.quantite}
                onChange={(e) => modifier(ligne.cle, "quantite", e.target.value)}
                disabled={lectureSeule}
                className="h-9 w-20"
                aria-invalid={quantiteKo}
              />
              {quantiteKo && <p className="mt-1 text-xs text-destructive">1 à 999</p>}
            </div>
            {cov && <Jauge couverture={cov} />}
            {dispo !== undefined && requis !== null && (
              <p
                className={cn(
                  "self-center text-xs",
                  dispo >= requis ? "text-badge-successFg" : "text-badge-dangerFg",
                )}
                title="Véhicules de ce type non réservés par un autre chantier sur la même période (au dernier enregistrement)"
              >
                {dispo} disponible{dispo > 1 ? "s" : ""} sur la période
              </p>
            )}
            {!lectureSeule && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                aria-label="Retirer ce besoin"
                onClick={() => onChange(lignes.filter((l) => l.cle !== ligne.cle))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}

      {!lectureSeule && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...lignes, nouvelleLigneBesoin()])}
          disabled={typesChoisis.size >= typesEngin.length}
        >
          <Plus className="h-4 w-4" />
          Ajouter un type d'engin
        </Button>
      )}

      {horsBesoin.length > 0 && (
        <p className="text-xs text-badge-infoFg">
          Déposés sans besoin exprimé : {horsBesoin.map((c) => `${c.libelle} × ${c.affectes}`).join(", ")}.
        </p>
      )}
    </div>
  );
}
