import type { ReactNode } from "react";
import { Car, Cog, Fuel, Gauge, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface BanniereVehiculeProps {
  titre: string;
  sousTitre?: string;
  /** Petites étiquettes sous le titre (type, énergie, compteur...). */
  puces?: string[];
  /** Photo principale déjà rendue (AuthenticatedImage en correction, <img> d'aperçu local en création) ; absente = pictogramme. */
  photo?: ReactNode;
  /** Actions sous le texte (retour, choisir les photos...). */
  actions?: ReactNode;
  /** Clic sur le cadre photo (ex. ouvrir le sélecteur de fichiers). */
  onClicPhoto?: () => void;
  libelleClicPhoto?: string;
  /** "ligne" (défaut) : texte à gauche, photo à droite ; "colonne" : photo en haut, texte dessous (colonne latérale de la fiche). */
  disposition?: "ligne" | "colonne";
}

/**
 * Bandeau d'en-tête de la fiche véhicule : texte à gauche, photo du
 * véhicule mise en avant à droite (2026-09-24 — « mettre comme cette image
 * le formulaire, image du véhicule en haut », d'après une maquette
 * « Car Assistance »). Seule la mise en page est reprise : pas les
 * illustrations de la maquette (banque d'images), remplacées par la vraie
 * photo de l'engin et quelques pictogrammes décoratifs discrets.
 *
 * Version compacte et animée (2026-09-25, « réduire les espaces vides et
 * dynamiser ») : hauteur réduite de moitié environ, photo plus petite,
 * dégradé, apparition en fondu et léger zoom de la photo au survol
 * (animations coupées si l'utilisateur préfère moins de mouvement).
 */
export function BanniereVehicule({
  titre,
  sousTitre,
  puces,
  photo,
  actions,
  onClicPhoto,
  libelleClicPhoto,
  disposition = "ligne",
}: BanniereVehiculeProps) {
  const enColonne = disposition === "colonne";
  const cadre = (
    <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-primary-foreground/95 shadow-lg ring-2 ring-primary-foreground/30 [&_img]:transition-transform [&_img]:duration-500 motion-safe:group-hover:[&_img]:scale-105">
      {photo ?? (
        <div className="flex flex-col items-center gap-2 text-primary/60">
          <Car className="h-12 w-12" />
          <span className="text-sm font-medium">{libelleClicPhoto ?? "Aucune photo"}</span>
        </div>
      )}
    </div>
  );

  return (
    <section className="group/banniere relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/75 text-primary-foreground shadow-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500">
      {/* Pictogrammes décoratifs, purement visuels (le grand engrenage tourne lentement). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 text-primary-foreground/10">
        <Cog className="absolute -left-5 -top-5 h-24 w-24 motion-safe:animate-[spin_24s_linear_infinite]" />
        <Wrench className="absolute right-[36%] top-4 h-8 w-8 rotate-12" />
        <Gauge className="absolute bottom-3 left-[40%] h-9 w-9" />
        <Fuel className="absolute bottom-4 right-[34%] h-8 w-8 -rotate-12" />
      </div>

      <div
        className={cn(
          "relative grid items-center gap-4 p-4",
          enColonne ? "sm:grid-cols-[minmax(0,260px)_1fr] lg:grid-cols-1" : "sm:grid-cols-[1fr_minmax(0,260px)] md:gap-6 md:px-6 md:py-5",
        )}
      >
        <div className="space-y-3">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide md:text-3xl">{titre}</h1>
            {sousTitre && <p className="mt-1 text-sm text-primary-foreground/85 md:text-base">{sousTitre}</p>}
          </div>
          {puces && puces.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {puces.map((puce) => (
                <li key={puce} className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  {puce}
                </li>
              ))}
            </ul>
          )}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        {/* En colonne, la photo passe en premier (au-dessus du texte). */}
        <div className={cn(enColonne && "order-first")}>
          {onClicPhoto ? (
            <button
              type="button"
              onClick={onClicPhoto}
              className={cn("group block rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground")}
              aria-label={libelleClicPhoto ?? "Choisir la photo du véhicule"}
            >
              <div className="transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5">{cadre}</div>
            </button>
          ) : (
            cadre
          )}
        </div>
      </div>
    </section>
  );
}
