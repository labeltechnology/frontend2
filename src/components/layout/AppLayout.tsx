import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BarreNavigation } from "@/components/layout/barre-navigation/BarreNavigation";
import { BarriereErreur } from "@/components/layout/BarriereErreur";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationProvider } from "@/components/confirmation/ConfirmationProvider";
import { FilAriane } from "@/components/layout/fil-ariane/FilAriane";
import { FilArianeProvider } from "@/components/layout/fil-ariane/ContexteFilAriane";
import { FenetreRaccourcis } from "@/components/layout/raccourcis/FenetreRaccourcis";
import { useRaccourcis } from "@/components/layout/raccourcis/useRaccourcis";
import { useTempsReelMessagerie } from "@/features/messagerie/useTempsReelMessagerie";
import { useTempsReel } from "@/features/temps-reel/useTempsReel";

/**
 * Coquille de l'application. Hauteur verrouillée à l'écran (h-screen +
 * overflow-hidden) : la barre de navigation flottante en bas (2026-09-25,
 * remplace la barre latérale puis la barre du haut — le thème y est
 * passé, chaque page affiche déjà son propre titre) reste immobile, seul
 * <main> défile ; sa marge basse (pb-28) évite que la fin d'une page reste
 * cachée sous la barre. `min-h-0` sur la colonne de droite est
 * nécessaire pour qu'un enfant flex puisse effectivement scroller au lieu
 * d'étirer son parent.
 *
 * Le contenu de page est enveloppé dans une BarriereErreur : une exception de
 * rendu y affiche un message au lieu de vider tout l'écran, et la navigation
 * reste utilisable.
 *
 * Temps réel (2026-09-29) : la connexion unique de l'onglet est ouverte ici
 * (synchronisation instantanée de tous les écrans) ; la messagerie l'écoute.
 *
 * Ergonomie (2026-09-30) : fenêtre de confirmation commune, fil d'Ariane en
 * tête de page, raccourcis clavier (fenêtre « ? »).
 */
export function AppLayout() {
  const { pathname } = useLocation();
  useTempsReel();
  useTempsReelMessagerie();
  const { aideOuverte, setAideOuverte } = useRaccourcis();

  return (
    <ConfirmationProvider>
      <FilArianeProvider>
        <div className="flex h-screen flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 md:p-6 md:pb-28">
            <FilAriane />
            <BarriereErreur cle={pathname}>
              {/* Les pages sont chargées à la demande (voir App.tsx) : cette
                  frontière couvre le court instant où le fichier de la page
                  arrive. L'ossature imite une page type plutôt qu'un sablier,
                  pour que la mise en page ne saute pas à l'arrivée. */}
              <Suspense fallback={<SquelettePage />}>
                <Outlet />
              </Suspense>
            </BarriereErreur>
          </main>
          <BarreNavigation />
        </div>
        <FenetreRaccourcis ouverte={aideOuverte} surChangement={setAideOuverte} />
      </FilArianeProvider>
    </ConfirmationProvider>
  );
}

function SquelettePage() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement de la page">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
