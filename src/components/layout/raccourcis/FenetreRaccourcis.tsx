import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PAGES_RACCOURCIES } from "@/components/layout/raccourcis/raccourcis";

function Touche({ children }: { children: string }) {
  return <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-b-2 bg-muted px-1.5 font-sans text-xs text-foreground">{children}</kbd>;
}

const GROUPES: { titre: string; lignes: { touches: string[]; texte: string }[] }[] = [
  {
    titre: "Partout",
    lignes: [
      { touches: ["Ctrl", "K"], texte: "Rechercher un véhicule, une personne, une page, une action" },
      { touches: ["?"], texte: "Afficher cette fenêtre" },
      { touches: ["Échap"], texte: "Fermer la fenêtre ouverte" },
      { touches: ["Alt", "←"], texte: "Page précédente (la liste garde ses filtres)" },
    ],
  },
  {
    titre: "Dans une liste",
    lignes: [
      { touches: ["/"], texte: "Chercher dans la liste" },
      { touches: ["N"], texte: "Nouvel élément (véhicule, plein, mission…)" },
      { touches: ["Tab"], texte: "Aller d'une ligne à l'autre" },
      { touches: ["Entrée"], texte: "Ouvrir la ligne choisie" },
    ],
  },
  {
    titre: "Dans un formulaire",
    lignes: [
      { touches: ["Ctrl", "S"], texte: "Enregistrer" },
      { touches: ["Échap"], texte: "Fermer la fenêtre sans enregistrer" },
    ],
  },
];

/** Fenêtre « ? » : tous les raccourcis clavier (2026-09-30). */
export function FenetreRaccourcis({ ouverte, surChangement }: { ouverte: boolean; surChangement: (v: boolean) => void }) {
  return (
    <Dialog open={ouverte} onOpenChange={surChangement}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription>Les raccourcis à une seule touche sont inactifs pendant la saisie dans un champ.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-3">
          {GROUPES.map((g) => (
            <section key={g.titre} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.titre}</h3>
              <dl className="space-y-2 text-sm">
                {g.lignes.map((l) => (
                  <div key={l.texte} className="flex items-start gap-3">
                    <dt className="flex min-w-[5.5rem] gap-1">{l.touches.map((t) => <Touche key={t}>{t}</Touche>)}</dt>
                    <dd>{l.texte}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aller à une page : G puis…</h3>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {PAGES_RACCOURCIES.map((p) => (
              <div key={p.touche} className="flex items-center gap-2">
                <dt><Touche>{p.touche.toUpperCase()}</Touche></dt>
                <dd>{p.libelle}</dd>
              </div>
            ))}
          </dl>
        </section>
      </DialogContent>
    </Dialog>
  );
}
