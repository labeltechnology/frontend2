import { Fuel } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { CarburantMois } from "@/features/dashboard/indicateurs";
import { formatMontant, formatNombre } from "@/lib/utils";

const HAUTEUR_MAX = 72; // px

/**
 * Carburant du mois : dépense, litres, nombre de pleins, et la dépense par
 * semaine du mois en barres simples (une seule série, une seule couleur ;
 * montant au survol et dans le libellé accessible de chaque barre).
 */
export function CarburantDuMois({
  donnees,
  mois,
  enChargement,
  enErreur,
}: {
  donnees: CarburantMois;
  mois: string;
  enChargement: boolean;
  enErreur: boolean;
}) {
  const max = Math.max(...donnees.semaines.map((s) => s.montant), 0);
  return (
    <CadreSection titre={`Carburant — ${mois}`} icone={Fuel} lien="/carburant">
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : enErreur ? (
        <EtatBloc erreur>Carburant indisponible.</EtatBloc>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">Dépense</dt>
              <dd className="font-display text-lg font-bold tabular-nums text-foreground">{formatMontant(donnees.montant)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Litres</dt>
              <dd className="font-display text-lg font-bold tabular-nums text-foreground">{formatNombre(donnees.litres)} L</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pleins</dt>
              <dd className="font-display text-lg font-bold tabular-nums text-foreground">{donnees.pleins}</dd>
            </div>
          </dl>
          {donnees.pleins === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun plein enregistré ce mois-ci.</p>
          ) : (
            <div>
              <div className="flex items-end gap-2" style={{ height: HAUTEUR_MAX }}>
                {donnees.semaines.map((s) => (
                  <div
                    key={s.libelle}
                    className="flex-1 rounded-t bg-primary/85 transition-colors hover:bg-primary"
                    style={{ height: max > 0 ? Math.max(2, (s.montant / max) * HAUTEUR_MAX) : 2 }}
                    title={`Du ${s.libelle} : ${formatMontant(s.montant)} — ${formatNombre(s.litres)} L`}
                    role="img"
                    aria-label={`Jours ${s.libelle} : ${formatMontant(s.montant)}`}
                  />
                ))}
              </div>
              <div className="mt-1 flex gap-2 border-t border-border pt-1">
                {donnees.semaines.map((s) => (
                  <span key={s.libelle} className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground">
                    {s.libelle}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CadreSection>
  );
}
