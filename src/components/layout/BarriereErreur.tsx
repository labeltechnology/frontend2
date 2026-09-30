import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Barrière d'erreur React : sans elle, la moindre exception levée pendant le
 * rendu démonte tout l'arbre et l'utilisateur ne voit qu'une PAGE BLANCHE,
 * sans le moindre indice — c'est exactement ce qui s'est produit sur la fiche
 * chantier le 2026-09-24 (« page vide quand on met la date de fin »).
 *
 * Elle affiche ici le message et la pile de l'erreur : en développement comme
 * en production, un écran qui dit ce qui ne va pas vaut toujours mieux qu'un
 * écran vide — l'utilisateur peut le recopier, et la navigation reste
 * utilisable (barre latérale intacte, bouton de réessai).
 *
 * Doit être une classe : React n'expose pas encore componentDidCatch aux
 * composants fonction.
 */
interface Props {
  children: ReactNode;
  /** Change de valeur à chaque navigation : réarme la barrière sur la nouvelle page. */
  cle?: string;
}

interface State {
  erreur: Error | null;
  pile?: string;
}

export class BarriereErreur extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    // Trace complète dans la console du navigateur pour le diagnostic.
    console.error("Erreur de rendu interceptée :", erreur, infos.componentStack);
    this.setState({ pile: infos.componentStack ?? undefined });
  }

  componentDidUpdate(precedentes: Props) {
    // Nouvelle page : on retente le rendu plutôt que de rester bloqué sur l'erreur.
    if (this.state.erreur && precedentes.cle !== this.props.cle) {
      this.setState({ erreur: null, pile: undefined });
    }
  }

  private reessayer = () => this.setState({ erreur: null, pile: undefined });

  render() {
    const { erreur, pile } = this.state;
    if (!erreur) return this.props.children;

    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-destructive/40 bg-card p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <h2 className="font-display text-lg font-semibold text-foreground">Cette page n'a pas pu s'afficher</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Une erreur s'est produite pendant l'affichage. Le reste de l'application reste utilisable — recopie le
          message ci-dessous pour signaler le problème.
        </p>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-foreground">
          {erreur.message || String(erreur)}
        </pre>
        {pile && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">Détail technique</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">{pile}</pre>
          </details>
        )}
        <Button type="button" variant="outline" onClick={this.reessayer}>
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    );
  }
}
