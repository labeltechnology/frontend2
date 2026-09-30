import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { texteMontant } from "@/features/couts/couts";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { useFinDeVie } from "@/features/renouvellement/api";
import { CessionDialog } from "@/features/renouvellement/CessionDialog";
import { MOTIFS_CESSION, texteResultatCession } from "@/features/renouvellement/renouvellement";
import { cn, formatDate } from "@/lib/utils";
import type { FinDeVieVehicule } from "@/types/renouvellement";

/**
 * Onglet « Fin de vie » (2026-09-29) : véhicules sortis du parc (réformés ou
 * vendus), date, motif, prix, valeur nette comptable à la date de cession et
 * plus ou moins-value.
 */
export function OngletFinDeVie({ actif, peutModifier }: { actif: boolean; peutModifier: boolean }) {
  const requete = useFinDeVie(actif);
  const [dialogue, setDialogue] = useState<{ cible: FinDeVieVehicule | null } | null>(null);
  const d = requete.data;
  if (!d) return <EtatChargement enCours={requete.isPending} erreur={requete.error} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
          <CarteChiffre titre="Véhicules sortis du parc" valeur={d.nombreSortis} precision={d.nombreACompleter > 0 ? `${d.nombreACompleter} cession(s) à compléter` : undefined} />
          <CarteChiffre titre="Produit des cessions" valeur={texteMontant(d.montantCessions)} />
          <CarteChiffre titre="Plus-values" valeur={texteMontant(d.montantPlusValues)} classeValeur={d.montantPlusValues > 0 ? "text-badge-successFg" : undefined} />
          <CarteChiffre titre="Moins-values" valeur={texteMontant(d.montantMoinsValues)} classeValeur={d.montantMoinsValues > 0 ? "text-badge-dangerFg" : undefined} />
        </div>
        {peutModifier && (
          <Button onClick={() => setDialogue({ cible: null })}>
            <LogOut className="h-4 w-4" /> Sortir un véhicule du parc
          </Button>
        )}
      </div>

      {d.vehicules.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Aucun véhicule réformé ou vendu.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Véhicule</th>
                <th className="px-3 py-2">Sortie</th>
                <th className="px-3 py-2 text-right">Prix d'achat</th>
                <th className="px-3 py-2 text-right">Valeur nette</th>
                <th className="px-3 py-2 text-right">Prix de cession</th>
                <th className="px-3 py-2 text-right">Plus / moins-value</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.vehicules.map((v) => {
                const res = texteResultatCession(v);
                return (
                  <tr key={v.idEngin}>
                    <td className="px-3 py-2">
                      <span className="font-medium">{v.libelleVehicule}</span>
                      <span className="block text-xs text-muted-foreground">{v.libelleType}</span>
                    </td>
                    <td className="px-3 py-2">
                      {v.cessionRenseignee ? (
                        <>
                          {v.motif && MOTIFS_CESSION[v.motif]} le {formatDate(v.dateCession)}
                          {v.acquereur && <span className="block text-xs text-muted-foreground">{v.acquereur}</span>}
                        </>
                      ) : (
                        <Pastille libelle={`${v.statut === "VENDU" ? "Vendu" : "Réformé"} · à compléter`} classes="bg-badge-warningBg text-badge-warningFg" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.prixAchat)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.valeurNette)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.prixCession)}</td>
                    <td className={cn("px-3 py-2 text-right font-medium tabular-nums", res.classe)}>{res.texte}</td>
                    <td className="px-3 py-2 text-right">
                      {peutModifier && (
                        <Button variant="ghost" size="sm" onClick={() => setDialogue({ cible: v })}>
                          {v.cessionRenseignee ? "Modifier" : "Compléter"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CessionDialog open={dialogue !== null} cible={dialogue?.cible ?? null} onOpenChange={(o) => !o && setDialogue(null)} />
    </div>
  );
}
