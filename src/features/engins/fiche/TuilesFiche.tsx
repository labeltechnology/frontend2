import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASSES_TEINTE, type TeinteRubrique } from "@/features/engins/fiche/teintes";

export interface TuileFiche {
  cle: string;
  titre: string;
  description: string;
  icone: LucideIcon;
  teinte: TeinteRubrique;
  /** Résumé court de l'avancement (ex. « 2 / 6 renseignés »). */
  resume?: string;
}

interface TuilesFicheProps {
  tuiles: TuileFiche[];
  /** Tuile mise en évidence (onglet affiché en correction). */
  active?: string;
  onDetails: (cle: string) => void;
  /** "ligne" (défaut) : 4 cartes côte à côte ; "colonne" : empilées (colonne latérale de la fiche). */
  disposition?: "ligne" | "colonne";
}

/**
 * Rangée de rubriques sous la bannière. En création, un clic fait défiler
 * jusqu'à la section ; en correction, il affiche l'onglet.
 *
 * Version compacte (2026-09-25, « réduire les espaces vides et dynamiser ») :
 * chaque rubrique est une carte cliquable en entier — pastille colorée à
 * gauche, titre et résumé à droite, description sur 2 lignes au plus. Survol :
 * la carte se soulève et la flèche avance ; la rubrique ouverte est encadrée
 * de sa couleur. Les cartes apparaissent en cascade (animations coupées si
 * l'utilisateur préfère moins de mouvement).
 */
export function TuilesFiche({ tuiles, active, onDetails, disposition = "ligne" }: TuilesFicheProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        disposition === "colonne" ? "lg:grid-cols-1" : tuiles.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {tuiles.map((tuile, index) => {
        const classes = CLASSES_TEINTE[tuile.teinte];
        const Icone = tuile.icone;
        const estActive = active === tuile.cle;
        return (
          <button
            key={tuile.cle}
            type="button"
            onClick={() => onDetails(tuile.cle)}
            aria-pressed={active !== undefined ? estActive : undefined}
            title={tuile.description}
            style={{ animationDelay: `${index * 70}ms` }}
            className={cn(
              "group flex items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-all duration-200",
              "hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500",
              estActive ? cn("border-current ring-1 ring-current", classes.texte) : "border-border",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 motion-safe:group-hover:scale-110",
                classes.pastille,
              )}
            >
              <Icone className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className={cn("font-display text-sm font-bold uppercase tracking-wide", classes.texte)}>{tuile.titre}</span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5",
                    estActive ? classes.texte : "text-muted-foreground",
                  )}
                  aria-hidden
                />
              </span>
              {tuile.resume && <span className="mt-0.5 block text-sm font-semibold text-foreground">{tuile.resume}</span>}
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{tuile.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
