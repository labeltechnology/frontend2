import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CarteBlocRapport } from "@/features/rapport-engin/CarteBlocRapport";
import { connecteur, type Point, type Rect } from "@/features/rapport-engin/geometrie";
import type { BlocRapport, NiveauRapport } from "@/features/rapport-engin/niveaux";
import { CLASSES_NIVEAU } from "@/features/rapport-engin/presentation";
import { cn } from "@/lib/utils";

/** Blocs disposés autour de la photo (4 en haut, 1 de chaque côté, 4 en bas) ; les suivants vont dessous. */
const BLOCS_AUTOUR = 10;

interface Trait {
  cle: string;
  niveau: NiveauRapport;
  de: Point;
  vers: Point;
}

interface SchemaVehiculeProps {
  blocs: BlocRapport[];
  /** Contenu central : photo du véhicule et identité. */
  centre: ReactNode;
  /** Lien « Voir détail » de chaque carte (page historique de la rubrique) ; omis = pas de bouton. */
  lienDetail?: (bloc: BlocRapport) => string;
  /** Action propre à une carte (bouton en pied de carte) ; undefined = aucune. */
  actionCarte?: (bloc: BlocRapport) => ReactNode;
  /** Contenu complémentaire d'une carte (ex. carte GPS de « Localisation ») ; undefined = aucun. */
  contenuCarte?: (bloc: BlocRapport) => ReactNode;
}

/**
 * Disposition « infographie » du rapport véhicule (2026-09-24, d'après une
 * maquette fournie par l'utilisateur) : la photo au centre, les rubriques
 * autour, reliées à la photo par des pointillés à la couleur de leur état.
 *
 * Grand écran : grille 4 colonnes — rangée du haut (4 blocs), rangée du
 * milieu (bloc | photo sur 2 colonnes | bloc — blocs latéraux centrés
 * verticalement sur la photo), rangée du bas (4 blocs ; un
 * bloc seul y est centré sous la photo, sur 2 colonnes ; deux blocs
 * occupent les 2 colonnes centrales ; vide depuis les fusions du 2026-09-28,
 * le rapport ayant 6 cartes).
 * Toutes les cartes ont la hauteur de leur contenu (pas d'étirement à la
 * hauteur de la rangée). Les connecteurs sont tracés en SVG à partir des positions réelles des
 * cartes (ResizeObserver), donc justes quelle que soit leur hauteur.
 * Petit écran : photo en premier, blocs empilés, pas de connecteurs.
 */
export function SchemaVehicule({ blocs, centre, lienDetail, actionCarte, contenuCarte }: SchemaVehiculeProps) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const centreRef = useRef<HTMLDivElement>(null);
  const cartesRef = useRef(new Map<string, HTMLDivElement>());
  const [traits, setTraits] = useState<Trait[]>([]);

  const relies = useMemo(() => blocs.slice(0, BLOCS_AUTOUR), [blocs]);
  const haut = relies.slice(0, 4);
  const gauche = relies[4];
  const droite = relies[5];
  const bas = relies.slice(6, BLOCS_AUTOUR);
  const surplus = blocs.slice(BLOCS_AUTOUR);

  useLayoutEffect(() => {
    const conteneur = conteneurRef.current;
    const photo = centreRef.current;
    if (!conteneur || !photo) return;

    const mesurer = () => {
      const origine = conteneur.getBoundingClientRect();
      const relatif = (element: Element): Rect => {
        const r = element.getBoundingClientRect();
        return { x: r.left - origine.left, y: r.top - origine.top, largeur: r.width, hauteur: r.height };
      };
      const rectPhoto = relatif(photo);
      const nouveaux: Trait[] = [];
      for (const bloc of relies) {
        const carte = cartesRef.current.get(bloc.cle);
        if (!carte) continue;
        const segment = connecteur(rectPhoto, relatif(carte));
        if (segment) nouveaux.push({ cle: bloc.cle, niveau: bloc.niveau, ...segment });
      }
      setTraits(nouveaux);
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(conteneur);
    observateur.observe(photo);
    cartesRef.current.forEach((carte) => observateur.observe(carte));
    return () => observateur.disconnect();
  }, [relies]);

  // `self-start` : chaque carte garde la hauteur de SON contenu (demande du
  // 2026-09-25 « adapter au contenu la taille des cartes ») au lieu de
  // s'étirer à la hauteur de la plus grande carte de la rangée.
  const carte = (bloc: BlocRapport, className?: string) => (
    <CarteBlocRapport
      key={bloc.cle}
      bloc={bloc}
      className={cn("self-start", className)}
      lienDetail={lienDetail?.(bloc)}
      action={actionCarte?.(bloc)}
      contenu={contenuCarte?.(bloc)}
      ref={(element) => {
        if (element) cartesRef.current.set(bloc.cle, element);
        else cartesRef.current.delete(bloc.cle);
      }}
    />
  );
  // Case vide qui garde la photo au centre quand il y a moins de 6 blocs.
  const vide = (cle: string) => <div key={cle} aria-hidden="true" className="hidden lg:block" />;

  return (
    <div ref={conteneurRef} className="relative">
      <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" aria-hidden="true">
        {traits.map((trait) => (
          <g key={trait.cle}>
            <line
              x1={trait.de.x}
              y1={trait.de.y}
              x2={trait.vers.x}
              y2={trait.vers.y}
              className={CLASSES_NIVEAU[trait.niveau].trait}
              strokeWidth={2}
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            <circle cx={trait.de.x} cy={trait.de.y} r={5} className={CLASSES_NIVEAU[trait.niveau].point} />
            <circle cx={trait.vers.x} cy={trait.vers.y} r={5} className={CLASSES_NIVEAU[trait.niveau].point} />
          </g>
        ))}
      </svg>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12 lg:gap-y-14">
        {haut.map((bloc) => carte(bloc))}
        {Array.from({ length: 4 - haut.length }, (_, i) => vide(`vide-haut-${i}`))}

        {gauche ? carte(gauche, "lg:self-center") : vide("vide-gauche")}
        <div ref={centreRef} className="order-first self-center sm:col-span-2 lg:order-none lg:col-span-2">
          {centre}
        </div>
        {droite ? carte(droite, "lg:self-center") : vide("vide-droite")}

        {bas.length === 1
          ? carte(bas[0], "sm:col-span-2 lg:col-start-2")
          : bas.map((bloc, i) => carte(bloc, bas.length === 2 && i === 0 ? "lg:col-start-2" : undefined))}
        {surplus.map((bloc) => carte(bloc))}
      </div>
    </div>
  );
}
