import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, Plus, Search, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDate, initiales, libelleEnum } from "@/lib/utils";
import type { ConducteurCandidatChantier } from "@/types/chantier";
import {
  libelleOccupation,
  occupationsBloquantes,
  occupationsSur,
  plusLonguePeriodeLibre,
  type PeriodeChantier,
} from "@/features/chantiers/fiche/engins-chantier";
import {
  conducteurDepose,
  filtrerConducteurs,
  libelleConducteur,
  peutEtreDeposeConducteur,
  problemePeriodeConducteur,
  type ConducteurFiche,
} from "@/features/chantiers/fiche/conducteurs-chantier";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import { accord, pluriel } from "@/lib/pluriel";

const ZONE_EQUIPE = "zone-equipe";
const ZONE_CHANTIER = "zone-conducteurs-chantier";

type Origine = "equipe" | "chantier";

interface DonneesGlisse {
  idConducteur: number;
  libelle: string;
  origine: Origine;
}

function libelleGlisse(donnees: unknown): string {
  return (donnees as DonneesGlisse | undefined)?.libelle ?? "";
}

const ANNONCES: Announcements = {
  onDragStart: ({ active }) => `Conducteur ${libelleGlisse(active.data.current)} saisi.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${libelleGlisse(active.data.current)} au-dessus de ${over.id === ZONE_CHANTIER ? "« Conducteurs du chantier »" : "« Équipe »"}.`
      : `${libelleGlisse(active.data.current)} hors des zones de dépôt.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${libelleGlisse(active.data.current)} déposé dans ${over.id === ZONE_CHANTIER ? "« Conducteurs du chantier »" : "« Équipe »"}.`
      : "Déplacement annulé.",
  onDragCancel: ({ active }) => `Déplacement de ${libelleGlisse(active.data.current)} annulé.`,
};

const INSTRUCTIONS =
  "Appuyez sur Espace ou Entrée pour saisir le conducteur, déplacez-le avec les flèches, puis appuyez de nouveau sur Espace ou Entrée pour le déposer. " +
  "La touche Échap annule le déplacement. Les boutons « Ajouter » et « Retirer » permettent la même opération sans glisser-déposer.";

/** Empêche qu'un clic ou une frappe dans un bouton ou un champ de la carte ne démarre un glisser-déposer. */
const isoler = {
  onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onKeyDown: (e: { key: string; stopPropagation: () => void; preventDefault: () => void }) => {
    e.stopPropagation();
    if (e.key === "Enter") e.preventDefault();
  },
};

function motifEquipe(candidat: ConducteurCandidatChantier, periode: PeriodeChantier): string | null {
  if (candidat.situation === "INDISPONIBLE") return libelleEnum(candidat.conducteur.statut);
  const prises = occupationsSur(periode, candidat.occupations);
  if (prises.length === 0) return null;
  if (!plusLonguePeriodeLibre(periode, occupationsBloquantes(candidat.occupations, true))) return "Occupé sur toute la période";
  const [premiere] = prises;
  const autres = prises.length > 1 ? ` (+${prises.length - 1})` : "";
  return `Occupé du ${formatDate(premiere.dateDebut)} au ${formatDate(premiere.dateFin)} (${libelleOccupation(premiere)})${autres}`;
}

/** Déposable : en service et au moins un jour libre (en comptant le partage multi-sites possible). */
function deposable(candidat: ConducteurCandidatChantier, periode: PeriodeChantier): boolean {
  return (
    peutEtreDeposeConducteur(candidat) && plusLonguePeriodeLibre(periode, occupationsBloquantes(candidat.occupations, true)) !== null
  );
}

function Identite({ candidat, motif }: { candidat: ConducteurCandidatChantier; motif?: string | null }) {
  const { conducteur } = candidat;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <AvatarPersonne
        urlPhoto={conducteur.urlPhoto}
        initiales={initiales(conducteur.nom, conducteur.prenom)}
        nom={`${conducteur.prenom} ${conducteur.nom}`}
        className="h-7 w-7 text-[10px]"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {libelleConducteur(conducteur)}
          {motif && <Badge variant="outline" className="truncate text-[11px] font-normal">{motif}</Badge>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {conducteur.categorie === "ENGIN_CHANTIER" ? "Conducteur d'engin (CACES)" : "Conducteur de véhicule"}
        </p>
      </div>
    </div>
  );
}

interface CarteProps {
  candidat: ConducteurCandidatChantier;
  origine: Origine;
  lectureSeule: boolean;
  deplacable: boolean;
  motif?: string | null;
  onAjouter?: () => void;
  onRetirer?: () => void;
  fiche?: ConducteurFiche;
  periodeChantier?: PeriodeChantier;
  probleme?: string | null;
  onChange?: (modif: Partial<ConducteurFiche>) => void;
}

function CarteConducteur({
  candidat,
  origine,
  lectureSeule,
  deplacable,
  motif,
  onAjouter,
  onRetirer,
  fiche,
  periodeChantier,
  probleme,
  onChange,
}: CarteProps) {
  const libelle = libelleConducteur(candidat.conducteur);
  const donnees: DonneesGlisse = { idConducteur: candidat.conducteur.idConducteur, libelle, origine };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `conducteur-${candidat.conducteur.idConducteur}`,
    data: donnees,
    disabled: !deplacable,
  });
  return (
    <li
      ref={setNodeRef}
      {...(deplacable ? { ...attributes, ...listeners } : {})}
      aria-roledescription={deplacable ? "conducteur déplaçable" : undefined}
      className={cn(
        "rounded-md border bg-card px-2 py-1.5",
        probleme ? "border-destructive" : "border-border",
        deplacable ? "cursor-grab touch-none active:cursor-grabbing" : origine === "equipe" && "opacity-60",
        isDragging && "opacity-30",
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className={cn("h-4 w-4 shrink-0 text-muted-foreground", !deplacable && "invisible")} aria-hidden="true" />
        <Identite candidat={candidat} motif={motif} />
        {!lectureSeule && origine === "equipe" && deplacable && (
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`Ajouter ${libelle} au chantier`} onClick={onAjouter} {...isoler}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {!lectureSeule && origine === "chantier" && (
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`Retirer ${libelle} du chantier`} onClick={onRetirer} {...isoler}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {fiche && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-6 text-xs">
          <span className="text-muted-foreground">Du</span>
          <Input
            type="date"
            aria-label={`Début de la période de ${libelle}`}
            value={fiche.dateDebut}
            min={periodeChantier?.debut}
            max={periodeChantier?.fin}
            disabled={lectureSeule}
            onChange={(e) => onChange?.({ dateDebut: e.target.value, suitChantier: false })}
            className="h-7 w-[9.5rem] px-2 text-xs"
            {...isoler}
          />
          <span className="text-muted-foreground">au</span>
          <Input
            type="date"
            aria-label={`Fin de la période de ${libelle}`}
            value={fiche.dateFin}
            min={periodeChantier?.debut}
            max={periodeChantier?.fin}
            disabled={lectureSeule}
            onChange={(e) => onChange?.({ dateFin: e.target.value, suitChantier: false })}
            className="h-7 w-[9.5rem] px-2 text-xs"
            {...isoler}
          />
          <label className="ml-1 inline-flex items-center gap-1 text-muted-foreground" title="Conducteur partagé avec d'autres chantiers : le chevauchement est accepté si l'autre chantier l'indique aussi">
            <input
              type="checkbox"
              checked={fiche.multiSites}
              disabled={lectureSeule}
              onChange={(e) => onChange?.({ multiSites: e.target.checked })}
              className="accent-primary"
              {...isoler}
            />
            Multi-sites
          </label>
        </div>
      )}
      {probleme && (
        <p className="mt-1 pl-6 text-xs text-destructive" role="alert">
          {probleme}
        </p>
      )}
    </li>
  );
}

function ZoneDepot({ id, titre, sousTitre, children }: { id: string; titre: string; sousTitre: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={titre}
      className={cn("flex min-h-[14rem] flex-col rounded-lg border-2 border-dashed p-3 transition-colors", isOver ? "border-primary bg-primary/5" : "border-border")}
    >
      <header className="mb-2">
        <h3 className="font-display text-base font-semibold">{titre}</h3>
        <p className="text-xs text-muted-foreground">{sousTitre}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * Conducteurs de la fiche chantier (2026-09-29) : même glisser-déposer que
 * les véhicules (PlanificationEngins) — à gauche l'équipe (recherche ;
 * indisponibles et occupés grisés avec leur motif), à droite les
 * conducteurs du chantier, chacun avec sa période et la case « Multi-sites ».
 * Rien n'est enregistré ici : la page envoie la sélection avec la fiche.
 */
export function PlanificationConducteurs({
  candidats,
  selection,
  onChange,
  periode,
  lectureSeule = false,
}: {
  candidats: ConducteurCandidatChantier[];
  selection: ConducteurFiche[];
  onChange: (selection: ConducteurFiche[]) => void;
  periode: PeriodeChantier;
  lectureSeule?: boolean;
}) {
  const [recherche, setRecherche] = useState("");
  const [enCours, setEnCours] = useState<ConducteurCandidatChantier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const choisis = useMemo(() => new Set(selection.map((c) => c.idConducteur)), [selection]);
  const parId = useMemo(() => new Map(candidats.map((c) => [c.conducteur.idConducteur, c])), [candidats]);
  const equipe = useMemo(
    () =>
      filtrerConducteurs(candidats.filter((c) => !choisis.has(c.conducteur.idConducteur)), recherche).sort(
        (a, b) => Number(deposable(b, periode)) - Number(deposable(a, periode)),
      ),
    [candidats, choisis, recherche, periode],
  );

  const ajouter = (id: number) => {
    const candidat = parId.get(id);
    if (choisis.has(id) || !candidat) return;
    // D'abord sans partage ; s'il n'y a de place qu'en partageant avec un chantier multi-sites, on le coche.
    const fiche = conducteurDepose(id, periode, candidat.occupations) ?? conducteurDepose(id, periode, candidat.occupations, true);
    if (fiche) onChange([...selection, fiche]);
  };
  const retirer = (id: number) => onChange(selection.filter((c) => c.idConducteur !== id));
  const modifier = (id: number, modif: Partial<ConducteurFiche>) =>
    onChange(selection.map((c) => (c.idConducteur === id ? { ...c, ...modif } : c)));
  const probleme = (fiche: ConducteurFiche) => {
    const candidat = parId.get(fiche.idConducteur);
    return candidat ? problemePeriodeConducteur(fiche, periode, candidat.occupations) : null;
  };

  const surDebut = (e: DragStartEvent) => {
    const d = e.active.data.current as DonneesGlisse | undefined;
    setEnCours(d ? (parId.get(d.idConducteur) ?? null) : null);
  };
  const surFin = (e: DragEndEvent) => {
    setEnCours(null);
    const d = e.active.data.current as DonneesGlisse | undefined;
    if (!d || !e.over) return;
    if (e.over.id === ZONE_CHANTIER && d.origine === "equipe") ajouter(d.idConducteur);
    if (e.over.id === ZONE_EQUIPE && d.origine === "chantier") retirer(d.idConducteur);
  };

  const enConflit = selection.filter((c) => probleme(c) !== null);
  const nbDisponibles = equipe.filter((c) => deposable(c, periode)).length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={surDebut}
      onDragEnd={surFin}
      onDragCancel={() => setEnCours(null)}
      accessibility={{ announcements: ANNONCES, screenReaderInstructions: { draggable: INSTRUCTIONS } }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ZoneDepot
          id={ZONE_EQUIPE}
          titre="Équipe"
          sousTitre={`${nbDisponibles} conducteur${nbDisponibles > 1 ? "s" : ""} disponible${nbDisponibles > 1 ? "s" : ""} — glissez vers « Conducteurs du chantier »`}
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Rechercher un conducteur"
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              placeholder="Nom, matricule, téléphone…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
          <ul className="max-h-[24rem] space-y-1.5 overflow-y-auto pr-1">
            {equipe.map((c) => (
              <CarteConducteur
                key={c.conducteur.idConducteur}
                candidat={c}
                origine="equipe"
                lectureSeule={lectureSeule}
                deplacable={!lectureSeule && deposable(c, periode)}
                motif={motifEquipe(c, periode)}
                onAjouter={() => ajouter(c.conducteur.idConducteur)}
              />
            ))}
            {equipe.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Aucun conducteur ne correspond à votre recherche.</li>}
          </ul>
        </ZoneDepot>

        <ZoneDepot
          id={ZONE_CHANTIER}
          titre="Conducteurs du chantier"
          sousTitre={`${pluriel(selection.length, "conducteur")} — ${accord(selection.length, "enregistré")} avec la fiche`}
        >
          {enConflit.length > 0 && (
            <p className="mb-2 rounded-md bg-badge-dangerBg px-2 py-1.5 text-xs text-badge-dangerFg" role="alert">
              Période à corriger pour {enConflit.length} conducteur{enConflit.length > 1 ? "s" : ""} (voir en rouge) : ajustez ses
              dates, cochez « Multi-sites » s'il est partagé, ou retirez-le.
            </p>
          )}
          {selection.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <UserRound className="h-8 w-8" aria-hidden="true" />
              {lectureSeule ? "Aucun conducteur rattaché." : "Déposez ici les conducteurs du chantier."}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {selection.map((fiche) => {
                const candidat = parId.get(fiche.idConducteur);
                if (!candidat) return null;
                return (
                  <CarteConducteur
                    key={fiche.idConducteur}
                    candidat={candidat}
                    origine="chantier"
                    lectureSeule={lectureSeule}
                    deplacable={!lectureSeule}
                    motif={candidat.situation === "INDISPONIBLE" ? libelleEnum(candidat.conducteur.statut) : null}
                    onRetirer={() => retirer(fiche.idConducteur)}
                    fiche={fiche}
                    periodeChantier={periode}
                    probleme={probleme(fiche)}
                    onChange={(modif) => modifier(fiche.idConducteur, modif)}
                  />
                );
              })}
            </ul>
          )}
        </ZoneDepot>
      </div>
      <DragOverlay>
        {enCours && (
          <div className="flex items-center gap-2 rounded-md border border-primary bg-card px-2 py-1.5 shadow-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Identite candidat={enCours} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
