import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProformaChantier, useRentabiliteChantier } from "@/features/chantiers/rentabilite/rentabilite-api";
import {
  classeEcartBudget,
  LIBELLES_POSTE,
  LIBELLES_VERDICT,
  VARIANT_VERDICT,
  verdict,
} from "@/features/chantiers/rentabilite/rentabilite";
import { ApiError } from "@/lib/api-client";
import { formatMontant } from "@/lib/utils";

/**
 * Rentabilité matériel du chantier (V64) dans l'onglet Coûts : budget,
 * refacturable d'après les tarifs par type, marge et proforma pour le client.
 */
export function CarteRentabilite({ idChantier, peutGerer }: { idChantier: number; peutGerer: boolean }) {
  const navigate = useNavigate();
  const { data: r } = useRentabiliteChantier(idChantier);
  const proforma = useProformaChantier(idChantier);
  if (!r) return null;
  const v = verdict(r);

  const surProforma = async () => {
    try {
      const cree = await proforma.mutateAsync();
      toast.success(`Proforma n° ${cree.idFactureProforma} établie pour ${r.clientNom}`);
      navigate("/factures-proforma");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Proforma impossible");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          Rentabilité matériel
          <Badge variant={VARIANT_VERDICT[v]}>{LIBELLES_VERDICT[v]}</Badge>
        </CardTitle>
        {peutGerer && (
          <Button type="button" size="sm" variant="outline" onClick={surProforma}
            disabled={proforma.isPending || r.refacturable <= 0 || !r.clientNom}
            title={!r.clientNom ? "Indiquez le client dans l'organisation du chantier" : undefined}>
            <FileText className="h-4 w-4" />
            Établir la proforma
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Refacturable (HT)</p>
            <p className="font-semibold">{formatMontant(r.refacturable)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Marge</p>
            <p className={r.marge < 0 ? "font-semibold text-destructive" : "font-semibold"}>
              {formatMontant(r.marge)} {r.tauxMarge != null && <span className="text-xs">({r.tauxMarge} %)</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget matériel</p>
            <p className="font-semibold">{formatMontant(r.budgetMateriel)}</p>
            {r.consommationBudget != null && <p className="text-xs text-muted-foreground">{r.consommationBudget} % consommé</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Écart au budget</p>
            <p className={`font-semibold ${classeEcartBudget(r.ecartBudget)}`}>{formatMontant(r.ecartBudget)}</p>
            {r.posteDominant && <p className="text-xs text-muted-foreground">Poste principal : {LIBELLES_POSTE[r.posteDominant]}</p>}
          </div>
        </div>
        {r.typesSansTarif.length > 0 && (
          <p className="text-xs text-badge-warningFg">Sans tarif de refacturation : {r.typesSansTarif.join(", ")} (page Chantiers, onglet Rentabilité).</p>
        )}
        {!r.clientNom && <p className="text-xs text-muted-foreground">Client non renseigné (fiche, rubrique Organisation).</p>}
      </CardContent>
    </Card>
  );
}
