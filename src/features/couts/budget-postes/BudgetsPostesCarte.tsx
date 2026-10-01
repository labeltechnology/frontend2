import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmer } from "@/components/confirmation/ConfirmationProvider";
import { Button } from "@/components/ui/button";
import { BudgetPosteDialog } from "@/features/couts/budget-postes/BudgetPosteDialog";
import { partsEgales, totalBudgets } from "@/features/couts/budget-postes/budget-postes";
import { useBudgetsPostes, useSupprimerBudgetPoste } from "@/features/couts/budget-postes/budget-postes-api";
import { texteMontant } from "@/features/couts/couts";
import { ApiError } from "@/lib/api-client";
import type { LigneBudgetPoste } from "@/types/pilotage";

/**
 * « Budgets par poste » (2026-09-30) : un montant annuel par poste de coût,
 * réparti par mois, comparé au réel dans le tableau de bord de direction.
 * La ligne carburant reprend la somme des budgets par type (lecture seule).
 */
export function BudgetsPostesCarte({ annee, actif, peutModifier }: { annee: number; actif: boolean; peutModifier: boolean }) {
  const requete = useBudgetsPostes(annee, actif);
  const supprimer = useSupprimerBudgetPoste();
  const [edition, setEdition] = useState<LigneBudgetPoste | null>(null);
  const postes = requete.data?.postes ?? [];

  const confirmer = useConfirmer();
  const retirer = async (l: LigneBudgetPoste) => {
    if (l.idBudgetPoste === null) return;
    const ok = await confirmer({
      titre: `Supprimer le budget « ${l.libelle} » ?`,
      message: `Le budget ${annee} de ce poste sera supprimé : le tableau de bord l'affichera comme « sans budget ».`,
      libelleConfirmer: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await supprimer.mutateAsync(l.idBudgetPoste);
      toast.success(`Budget « ${l.libelle} » supprimé`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Suppression impossible");
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-budgets-postes">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titre-budgets-postes" className="font-display text-lg font-semibold">
          Budgets par poste {annee}
        </h2>
        {postes.length > 0 && <span className="text-sm text-muted-foreground">Total : {texteMontant(totalBudgets(postes))}</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Comparés chaque mois au réel dans le tableau de bord de direction (budget du mois, dépensé, projection).
      </p>

      {requete.isPending && actif ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : requete.isError ? (
        <p className="mt-3 text-sm text-destructive">{requete.error instanceof ApiError ? requete.error.message : "Budgets indisponibles."}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {postes.map((l) => (
            <li key={l.poste} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <span className="font-medium">{l.libelle}</span>
                <span className="block text-xs text-muted-foreground">
                  {!l.modifiable
                    ? "Somme des budgets carburant par type (saisis plus bas)"
                    : l.montantAnnuel === null
                      ? "Aucun budget"
                      : partsEgales(l.partsMensuelles)
                        ? "12 parts égales"
                        : "Réparti selon les mois"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 tabular-nums">{l.montantAnnuel === null ? "—" : texteMontant(l.montantAnnuel)}</span>
                {peutModifier && l.modifiable && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setEdition(l)} aria-label={`Budget ${l.libelle}`}>
                      {l.idBudgetPoste === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    {l.idBudgetPoste !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retirer(l)}
                        disabled={supprimer.isPending}
                        aria-label={`Supprimer le budget ${l.libelle}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <BudgetPosteDialog open={edition !== null} onOpenChange={(open) => !open && setEdition(null)} annee={annee} ligne={edition} />
    </section>
  );
}
