import { useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmer } from "@/components/confirmation/ConfirmationProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgetCarburant, useSupprimerBudgetCarburant } from "@/features/couts/api";
import { BudgetsPostesCarte } from "@/features/couts/budget-postes/BudgetsPostesCarte";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { classeEcart, effetsEcart, texteEcartMontant, texteMontant } from "@/features/couts/couts";
import { BudgetCarburantDialog } from "@/features/couts/onglets/BudgetCarburantDialog";
import { GrapheBudgetMensuel } from "@/features/couts/onglets/GrapheBudgetMensuel";
import { nombreFr } from "@/features/performance/performance";
import { ApiError } from "@/lib/api-client";
import { cn, formatDate } from "@/lib/utils";
import type { LigneBudgetCarburant } from "@/types/couts";
import type { TypeEngin } from "@/types/engin";

/**
 * Onglet « Budget carburant » : budget annuel par type, réparti par mois,
 * comparé au réel ; écart expliqué (km, consommation, prix) et projection de
 * fin d'année. Saisie des budgets : capacité GERER_PARC.
 * En tête (2026-09-30) : les budgets des autres postes de coût.
 */
export function OngletBudget({ actif, types, peutModifier }: { actif: boolean; types: TypeEngin[]; peutModifier: boolean }) {
  const anneeCourante = new Date().getFullYear();
  const [annee, setAnnee] = useState(anneeCourante);
  const [dialogue, setDialogue] = useState<{ ligne: LigneBudgetCarburant | null } | null>(null);
  const requete = useBudgetCarburant(annee, actif);
  const supprimer = useSupprimerBudgetCarburant();
  const donnees = requete.data;
  const typesLibres = types.filter((t) => !donnees?.lignes.some((l) => l.idTypeEngin === t.idTypeEngin));

  const confirmer = useConfirmer();
  const retirer = async (l: LigneBudgetCarburant) => {
    const ok = await confirmer({
      titre: `Supprimer le budget « ${l.libelle} » ?`,
      message: `Le budget carburant ${annee} de ce type sera supprimé ; la dépense réelle restera comptée.`,
      libelleConfirmer: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await supprimer.mutateAsync(l.idBudgetCarburant);
      toast.success(`Budget « ${l.libelle} » supprimé`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Suppression impossible");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={String(annee)} onValueChange={(v) => setAnnee(Number(v))}>
          <SelectTrigger className="h-9 w-32" aria-label="Année">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[anneeCourante + 1, anneeCourante, anneeCourante - 1, anneeCourante - 2].map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {peutModifier && (
          <Button onClick={() => setDialogue({ ligne: null })} disabled={typesLibres.length === 0}>
            <Plus className="h-4 w-4" />
            Nouveau budget
          </Button>
        )}
      </div>

      <BudgetsPostesCarte annee={annee} actif={actif} peutModifier={peutModifier} />

      {requete.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calcul en cours…
        </p>
      )}
      {requete.isError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {requete.error instanceof ApiError ? requete.error.message : "Calcul impossible pour le moment."}
        </p>
      )}

      {donnees && donnees.lignes.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aucun budget carburant pour {annee}.{peutModifier ? " Cliquez sur « Nouveau budget » pour en fixer un par type de véhicule." : ""}
        </p>
      )}

      {donnees && donnees.lignes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <CarteChiffre titre={`Budget ${annee}`} valeur={texteMontant(donnees.montantAnnuel)} />
            <CarteChiffre titre="Budget à date" valeur={texteMontant(donnees.budgetADate)} precision={`Au ${formatDate(donnees.dateReference)}`} />
            <CarteChiffre titre="Dépense réelle à date" valeur={texteMontant(donnees.reelADate)} />
            <CarteChiffre
              titre="Écart"
              valeur={texteEcartMontant(donnees.ecart)}
              classeValeur={classeEcart(donnees.ecart)}
              precision={
                donnees.ecartPourcent === null ? undefined : `${donnees.ecart > 0 ? "Dépassement" : "Économie"} de ${nombreFr(Math.abs(donnees.ecartPourcent), 1)} %`
              }
            />
            <CarteChiffre
              titre="Projection de fin d'année"
              valeur={texteMontant(donnees.projectionFinAnnee)}
              classeValeur={donnees.projectionFinAnnee !== null ? classeEcart(donnees.projectionFinAnnee - donnees.montantAnnuel) : undefined}
              precision="Au rythme actuel, saisonnalité comprise"
            />
          </div>

          {donnees.typesSansBudget.length > 0 && (
            <p className="rounded-md border border-badge-warningFg/40 bg-badge-warningBg px-3 py-2 text-sm text-badge-warningFg">
              Dépense sans budget : {texteMontant(donnees.reelSansBudget)} ({donnees.typesSansBudget.join(", ")}).
            </p>
          )}

          <GrapheBudgetMensuel mois={donnees.mois} />

          <section className="space-y-2" aria-labelledby="titre-budget-types">
            <h2 id="titre-budget-types" className="font-display text-lg font-semibold">Par type : écart et causes</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {donnees.lignes.map((l) => (
                <article key={l.idBudgetCarburant} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{l.libelle}</h3>
                      <p className="text-xs text-muted-foreground">
                        {nombreFr(l.usagePrevu)} {l.uniteUsage}/an · {nombreFr(l.consommationPrevue, 1)} {l.uniteUsage === "h" ? "L/h" : "L/100 km"} ·{" "}
                        {nombreFr(l.prixLitrePrevu)} Ar/L → {texteMontant(l.montantAnnuel)}
                      </p>
                    </div>
                    {peutModifier && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" aria-label={`Actions du budget ${l.libelle}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDialogue({ ligne: l })}>
                            <Pencil className="h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => retirer(l)}>
                            <Trash2 className="h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Budget à date</dt>
                      <dd className="tabular-nums">{texteMontant(l.budgetADate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Réel</dt>
                      <dd className="tabular-nums">{texteMontant(l.reelADate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Écart</dt>
                      <dd className={cn("font-semibold tabular-nums", classeEcart(l.ecart))}>{texteEcartMontant(l.ecart)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">Cause principale : {l.libelleCause}</p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {effetsEcart(l).map((e) => (
                      <li key={e.cle} className="flex justify-between gap-2">
                        <span>{e.libelle}</span>
                        <span className={cn("tabular-nums", classeEcart(e.montant))}>{texteEcartMontant(e.montant)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Réel : {nombreFr(l.usageReel)} {l.uniteUsage}
                    {l.consommationReelle !== null && ` · ${nombreFr(l.consommationReelle, 1)} ${l.uniteUsage === "h" ? "L/h" : "L/100 km"}`}
                    {l.prixLitreReel !== null && ` · ${nombreFr(l.prixLitreReel)} Ar/L`}
                    {l.projectionFinAnnee !== null && ` · projection ${texteMontant(l.projectionFinAnnee)}`}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <BudgetCarburantDialog
        open={dialogue !== null}
        onOpenChange={(open) => !open && setDialogue(null)}
        annee={annee}
        types={dialogue?.ligne ? types : typesLibres}
        ligne={dialogue?.ligne ?? null}
      />
    </div>
  );
}
