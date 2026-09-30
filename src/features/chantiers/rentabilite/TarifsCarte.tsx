import { useState } from "react";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnregistrerTarif, useTarifsRefacturation } from "@/features/chantiers/rentabilite/rentabilite-api";
import { LIBELLES_UNITE } from "@/features/chantiers/rentabilite/rentabilite";
import { ApiError } from "@/lib/api-client";
import { formatMontant, normaliserNombre } from "@/lib/utils";
import type { TarifRefacturation, UniteTarif } from "@/types/chantier";

/** Tarifs de refacturation au client par type de véhicule (V64), en Ar HT par jour ou par heure. */
export function TarifsCarte({ modifiable }: { modifiable: boolean }) {
  const { data: tarifs } = useTarifsRefacturation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tarifs de refacturation</CardTitle>
        <CardDescription>
          Par jour de présence prévue, ou par heure de travail saisie au journal. Servent au montant refacturable, à la marge et à
          la proforma d'un chantier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {(tarifs ?? []).map((t) => (
            <LigneTarif key={t.idTypeEngin} tarif={t} modifiable={modifiable} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LigneTarif({ tarif, modifiable }: { tarif: TarifRefacturation; modifiable: boolean }) {
  const { enregistrer, supprimer } = useEnregistrerTarif();
  const [unite, setUnite] = useState<UniteTarif>(tarif.unite ?? "JOUR");
  const [montant, setMontant] = useState(tarif.tarif == null ? "" : String(tarif.tarif));
  const valeur = Number(normaliserNombre(montant));
  const valide = montant.trim() !== "" && Number.isFinite(valeur) && valeur >= 0;
  const change = unite !== (tarif.unite ?? "JOUR") || montant !== (tarif.tarif == null ? "" : String(tarif.tarif));

  const sauver = async () => {
    try {
      await enregistrer.mutateAsync({ idTypeEngin: tarif.idTypeEngin, unite, tarif: valeur });
      toast.success(`Tarif « ${tarif.typeEngin} » enregistré`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span className="font-medium">{tarif.typeEngin}</span>
      {modifiable ? (
        <span className="flex items-center gap-2">
          <Input className="h-8 w-32" inputMode="decimal" placeholder="Ar HT" aria-label={`Tarif ${tarif.typeEngin}`}
            value={montant} onChange={(e) => setMontant(e.target.value)} />
          <Select value={unite} onValueChange={(v) => setUnite(v as UniteTarif)}>
            <SelectTrigger className="h-8 w-32" aria-label="Unité">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOUR">{LIBELLES_UNITE.JOUR}</SelectItem>
              <SelectItem value="HEURE">{LIBELLES_UNITE.HEURE}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="icon" variant="ghost" aria-label="Enregistrer le tarif" disabled={!valide || !change || enregistrer.isPending}
            onClick={sauver}>
            <Save className="h-4 w-4" />
          </Button>
          {tarif.tarif != null && (
            <Button type="button" size="icon" variant="ghost" aria-label="Retirer le tarif"
              onClick={() => supprimer.mutate(tarif.idTypeEngin, { onError: () => toast.error("Retrait impossible") })}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">
          {tarif.tarif == null || !tarif.unite ? "Pas de tarif" : `${formatMontant(tarif.tarif)} ${LIBELLES_UNITE[tarif.unite]}`}
        </span>
      )}
    </li>
  );
}
