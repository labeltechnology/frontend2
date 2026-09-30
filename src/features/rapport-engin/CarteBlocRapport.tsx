import { forwardRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trierParGravite, type BlocRapport, type LigneRapport } from "@/features/rapport-engin/niveaux";
import { CLASSES_NIVEAU, ICONES_FAMILLE, ICONES_NIVEAU, LIBELLES_NIVEAU } from "@/features/rapport-engin/presentation";

/** Au-delà, les lignes les moins graves sont repliées (« Voir les N autres »). */
const LIGNES_VISIBLES = 4;

interface CarteBlocRapportProps {
  bloc: BlocRapport;
  className?: string;
  /** Page historique de la rubrique (bouton « Voir détail ») ; omis = pas de bouton. */
  lienDetail?: string;
  /** Action propre à la rubrique (ex. « Faire la maintenance » sur « Alertes et maintenance »), en pied de carte. */
  action?: ReactNode;
  /** Contenu complémentaire sous les points contrôlés (ex. carte GPS de « Localisation », 2026-09-28). */
  contenu?: ReactNode;
}

/**
 * Un bloc du rapport véhicule (une rubrique autour de la photo) : titre et
 * pastille à la couleur du niveau le plus grave, synthèse, puis les points
 * contrôlés du plus grave au moins grave, et le bouton « Voir détail »
 * vers la page historique de la rubrique (2026-09-25). `forwardRef` : SchemaVehicule
 * mesure la carte pour tracer le connecteur pointillé.
 */
export const CarteBlocRapport = forwardRef<HTMLDivElement, CarteBlocRapportProps>(({ bloc, className, lienDetail, action, contenu }, ref) => {
  const classes = CLASSES_NIVEAU[bloc.niveau];
  const IconeFamille = ICONES_FAMILLE[bloc.famille];
  const IconeNiveau = ICONES_NIVEAU[bloc.niveau];
  const lignes = trierParGravite(bloc.lignes);
  const idTitre = `rapport-bloc-${bloc.cle}`;

  return (
    <Card ref={ref} className={cn("flex flex-col border-2 p-4", classes.bordure, className)}>
      <section aria-labelledby={idTitre} className="flex flex-1 flex-col gap-3">
        <header className="flex items-start gap-3">
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", classes.pastille)}>
            <IconeFamille className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={idTitre} className={cn("font-display text-base font-semibold leading-tight", classes.texte)}>
              {bloc.titre}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{bloc.resume}</p>
          </div>
          <span
            className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", classes.pastille)}
          >
            <IconeNiveau className="h-3.5 w-3.5" aria-hidden="true" />
            {LIBELLES_NIVEAU[bloc.niveau]}
          </span>
        </header>

        <ListeLignes lignes={lignes} nombreVisibles={LIGNES_VISIBLES} />
        {contenu}
        {bloc.note && <p className="mt-auto text-xs italic text-muted-foreground">{bloc.note}</p>}
        {(action || lienDetail) && (
          <div className={cn("flex flex-wrap items-center justify-end gap-2", !bloc.note && "mt-auto")}>
            {action}
            {lienDetail && (
              <Button asChild variant="ghost" size="sm">
                <Link to={lienDetail} aria-label={`Voir détail — ${bloc.titre}`}>
                  Voir détail
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </Card>
  );
});
CarteBlocRapport.displayName = "CarteBlocRapport";

/** Les `nombreVisibles` lignes les plus graves, le reste replié dans « Voir les N autres points ». */
function ListeLignes({ lignes, nombreVisibles }: { lignes: LigneRapport[]; nombreVisibles: number }) {
  const visibles = lignes.slice(0, nombreVisibles);
  const repliees = lignes.slice(nombreVisibles);
  return (
    <>
      {visibles.length > 0 && (
        <ul className="space-y-1.5">
          {visibles.map((ligne) => (
            <LigneBloc key={ligne.cle} ligne={ligne} />
          ))}
        </ul>
      )}
      {repliees.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
            Voir {repliees.length === 1 ? "l'autre point" : `les ${repliees.length} autres points`}
          </summary>
          <ul className="mt-1.5 space-y-1.5">
            {repliees.map((ligne) => (
              <LigneBloc key={ligne.cle} ligne={ligne} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function LigneBloc({ ligne }: { ligne: LigneRapport }) {
  const Icone = ICONES_NIVEAU[ligne.niveau];
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icone className={cn("mt-0.5 h-4 w-4 shrink-0", CLASSES_NIVEAU[ligne.niveau].texte)} aria-hidden="true" />
      <span className="min-w-0">
        <span className="sr-only">{LIBELLES_NIVEAU[ligne.niveau]} : </span>
        <span className="font-medium">{ligne.libelle}</span>
        <span className="block text-xs text-muted-foreground">{ligne.detail}</span>
      </span>
    </li>
  );
}
