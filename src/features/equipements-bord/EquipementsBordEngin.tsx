import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/useAuth";
import { ChecklistEquipementsBord, type ValeurEquipementBord } from "@/features/equipements-bord/ChecklistEquipementsBord";
import { useEquipementsBord, useMettreAJourEquipementsBord } from "@/features/equipements-bord/api";
import { saisiesRenseignees, valeursDepuisEtat } from "@/features/equipements-bord/saisies";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { peut } from "@/lib/droits";

/**
 * Contrôle des éléments de bord d'un engin existant (onglet de la fiche
 * véhicule). Enregistrement séparé de la fiche principale — même principe
 * que la carte Logo de l'écran Paramètres. Réservé à GERER_MAINTENANCE (DG,
 * responsable du parc, chef de maintenance — lib/droits.ts), comme côté
 * backend (confort : le backend refuse de toute façon).
 */
export function EquipementsBordEngin({ idEngin }: { idEngin: number }) {
  const { session } = useAuth();
  const peutModifier = peut(session?.role, "GERER_MAINTENANCE");
  const { data: etat, isLoading, isError } = useEquipementsBord(idEngin);
  const mettreAJour = useMettreAJourEquipementsBord(idEngin);
  const [valeurs, setValeurs] = useState<Record<number, ValeurEquipementBord>>({});

  useEffect(() => {
    if (etat) setValeurs(valeursDepuisEtat(etat));
  }, [etat]);

  const dernierControle = useMemo(
    () => etat?.map((l) => l.dateControle).filter((d): d is string => d != null).sort().pop() ?? null,
    [etat],
  );

  const enregistrer = async () => {
    try {
      await mettreAJour.mutateAsync(saisiesRenseignees(valeurs));
      toast.success("Contrôle des éléments de bord enregistré");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Éléments de sécurité et boîte à outils</CardTitle>
          <p className="text-sm text-muted-foreground">
            {dernierControle ? `Dernier contrôle le ${formatDate(dernierControle)}.` : "Jamais contrôlé."}
          </p>
        </div>
        {peutModifier && (
          <Button onClick={enregistrer} disabled={mettreAJour.isPending || isLoading}>
            {mettreAJour.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer le contrôle
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {isError && <p className="text-sm text-destructive">Impossible de charger les éléments de bord.</p>}
        {etat && (
          <ChecklistEquipementsBord
            lignes={etat}
            valeurs={valeurs}
            disabled={!peutModifier}
            onChange={(id, valeur) => setValeurs((v) => ({ ...v, [id]: valeur }))}
          />
        )}
      </CardContent>
    </Card>
  );
}
