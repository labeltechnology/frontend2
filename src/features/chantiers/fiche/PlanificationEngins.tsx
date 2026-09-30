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
import { GripVertical, Plus, Search, Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDate, libelleEnum } from "@/lib/utils";
import type { EnginCandidatChantier } from "@/types/chantier";
import type { TypeEngin } from "@/types/engin";
import {
  filtrerCandidats,
  grouperParType,
  libelleOccupation,
  occupationsSur,
  peutEtreDepose,
  plusLonguePeriodeLibre,
  problemePeriode,
  vehiculeDepose,
  type PeriodeChantier,
  type VehiculeFiche,
} from "@/features/chantiers/fiche/engins-chantier";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";

const ZONE_PARC = "zone-parc";
const ZONE_CHANTIER = "zone-chantier";
const TOUS_TYPES = "tous";

type Origine = "parc" | "chantier";

interface DonneesGlisse {
  idEngin: number;
  libelle: string;
  origine: Origine;
}

function codeGlisse(donnees: unknown): string {
  return (donnees as DonneesGlisse | undefined)?.libelle ?? "";
}

/** Textes lus par les lecteurs d'écran pendant un glisser-déposer (dnd-kit les fournit en anglais par défaut). */
const ANNONCES: Announcements = {
  onDragStart: ({ active }) => `Véhicule ${codeGlisse(active.data.current)} saisi.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${codeGlisse(active.data.current)} au-dessus de ${over.id === ZONE_CHANTIER ? "« Véhicules du chantier »" : "« Parc »"}.`
      : `${codeGlisse(active.data.current)} hors des zones de dépôt.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${codeGlisse(active.data.current)} déposé dans ${over.id === ZONE_CHANTIER ? "« Véhicules du chantier »" : "« Parc »"}.`
      : "Déplacement annulé.",
  onDragCancel: ({ active }) => `Déplacement de ${codeGlisse(active.data.current)} annulé.`,
};

const INSTRUCTIONS =
  "Appuyez sur Espace ou Entrée pour saisir le véhicule, déplacez-le avec les flèches, puis Espace ou Entrée pour le déposer. " +
  "Échap annule. Les boutons Ajouter et Retirer font la même chose sans glisser.";

/**
 * Motif affiché sur la carte d'un véhicule du parc, pour la période du
 * chantier : en panne, pris sur toute la période, ou partiellement occupé
 * (il reste déposable : sa période sera la plus longue période libre).
 */
function motifParc(candidat: EnginCandidatChantier, periode: PeriodeChantier, chantierCritique: boolean): string | null {
  if (candidat.situation === "INDISPONIBLE") return libelleEnum(candidat.engin.statut);
  if (!peutEtreDepose(candidat, chantierCritique)) return "Réservé aux chantiers critiques";
  const prises = occupationsSur(periode, candidat.occupations);
  if (prises.length === 0) return null;
  if (!plusLonguePeriodeLibre(periode, candidat.occupations)) return "Occupé sur toute la période";
  const [premiere] = prises;
  const autres = prises.length > 1 ? ` (+${prises.length - 1})` : "";
  return `Occupé du ${formatDate(premiere.dateDebut)} au ${formatDate(premiere.dateFin)} (${libelleOccupation(premiere)})${autres}`;
}

/** Déposable sur la période : pas en panne, et au moins un jour libre. */
function deposable(candidat: EnginCandidatChantier, periode: PeriodeChantier, chantierCritique: boolean): boolean {
  return peutEtreDepose(candidat, chantierCritique) && plusLonguePeriodeLibre(periode, candidat.occupations) !== null;
}

/** Empêche qu'un clic ou une frappe sur un bouton de la carte ne démarre un glisser-déposer. */
const isolerDuGlisser = {
  onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onKeyDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
};

/** Idem pour un champ de saisie ; Entrée n'envoie pas non plus toute la fiche (le champ est dans le formulaire de la page). */
const isolerChamp = {
  onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onKeyDown: (e: { key: string; stopPropagation: () => void; preventDefault: () => void }) => {
    e.stopPropagation();
    if (e.key === "Enter") e.preventDefault();
  },
};

interface CarteEnginProps {
  candidat: EnginCandidatChantier;
  origine: Origine;
  lectureSeule: boolean;
  deplacable: boolean;
  motif?: string | null;
  onAjouter?: () => void;
  onRetirer?: () => void;
  /** Colonne « Véhicules du chantier » : période du véhicule et son éventuel problème. */
  vehicule?: VehiculeFiche;
  periodeChantier?: PeriodeChantier;
  probleme?: string | null;
  onPeriode?: (champ: "dateDebut" | "dateFin", valeur: string) => void;
}

function ContenuCarte({ candidat, motif }: { candidat: EnginCandidatChantier; motif?: string | null }) {
  const { engin } = candidat;
  return (
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 truncate text-sm font-medium">
        {identifiantVehicule(engin)}
        {motif && <Badge variant="outline" className="truncate text-[11px] font-normal">{motif}</Badge>}
      </p>
      <p className="truncate text-xs text-muted-foreground">
        {engin.typeEngin.libelle} · {engin.marque} {engin.modele}
      </p>
    </div>
  );
}

function CarteEngin({
  candidat,
  origine,
  lectureSeule,
  deplacable,
  motif,
  onAjouter,
  onRetirer,
  vehicule,
  periodeChantier,
  probleme,
  onPeriode,
}: CarteEnginProps) {
  const donnees: DonneesGlisse = { idEngin: candidat.engin.idEngin, libelle: libelleVehicule(candidat.engin), origine };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `engin-${candidat.engin.idEngin}`,
    data: donnees,
    disabled: !deplacable,
  });
  const code = libelleVehicule(candidat.engin);

  return (
    <li
      ref={setNodeRef}
      {...(deplacable ? { ...attributes, ...listeners } : {})}
      aria-roledescription={deplacable ? "véhicule déplaçable" : undefined}
      className={cn(
        "rounded-md border bg-card px-2 py-1.5",
        probleme ? "border-destructive" : "border-border",
        deplacable ? "cursor-grab touch-none active:cursor-grabbing" : origine === "parc" && "opacity-60",
        isDragging && "opacity-30",
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className={cn("h-4 w-4 shrink-0 text-muted-foreground", !deplacable && "invisible")} aria-hidden="true" />
        <ContenuCarte candidat={candidat} motif={motif} />
        {!lectureSeule && origine === "parc" && deplacable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label={`Ajouter ${code} au chantier`}
            onClick={onAjouter}
            {...isolerDuGlisser}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {!lectureSeule && origine === "chantier" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label={`Retirer ${code} du chantier`}
            onClick={onRetirer}
            {...isolerDuGlisser}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {vehicule && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-6 text-xs">
          <span className="text-muted-foreground">Du</span>
          <Input
            type="date"
            aria-label={`Début de la période de ${code}`}
            value={vehicule.dateDebut}
            min={periodeChantier?.debut}
            max={periodeChantier?.fin}
            disabled={lectureSeule}
            onChange={(e) => onPeriode?.("dateDebut", e.target.value)}
            className="h-7 w-[9.5rem] px-2 text-xs"
            {...isolerChamp}
          />
          <span className="text-muted-foreground">au</span>
          <Input
            type="date"
            aria-label={`Fin de la période de ${code}`}
            value={vehicule.dateFin}
            min={periodeChantier?.debut}
            max={periodeChantier?.fin}
            disabled={lectureSeule}
            onChange={(e) => onPeriode?.("dateFin", e.target.value)}
            className="h-7 w-[9.5rem] px-2 text-xs"
            {...isolerChamp}
          />
          {vehicule.suitChantier && !probleme && <span className="text-muted-foreground">(toute la période)</span>}
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
      className={cn(
        "flex min-h-[18rem] flex-col rounded-lg border-2 border-dashed p-3 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <header className="mb-2">
        <h3 className="font-display text-base font-semibold">{titre}</h3>
        <p className="text-xs text-muted-foreground">{sousTitre}</p>
      </header>
      {children}
    </section>
  );
}

interface PlanificationEnginsProps {
  candidats: EnginCandidatChantier[];
  /** Véhicules déposés sur le chantier, chacun avec sa période. */
  selection: VehiculeFiche[];
  onChange: (selection: VehiculeFiche[]) => void;
  /** Période du chantier saisie sur la fiche : bornes de la période de chaque véhicule. */
  periode: PeriodeChantier;
  typesEngin: TypeEngin[];
  lectureSeule?: boolean;
  /** Chantier de priorité critique (V64) : les véhicules réservés y sont déposables. */
  chantierCritique?: boolean;
}

/**
 * Glisser-déposer des engins de la fiche chantier (2026-09-24, @dnd-kit) :
 * à gauche le parc (recherche + filtre par type ; engins occupés ou
 * indisponibles grisés avec leur motif), à droite les engins du chantier,
 * groupés par type. Souris, doigt (appui long) et clavier ; les boutons
 * « + » / « × » font la même chose sans glisser. Rien n'est enregistré ici :
 * la page envoie la sélection au bouton « Enregistrer la fiche ».
 *
 * Depuis le 2026-09-24, chaque véhicule déposé a SA période (« date de
 * mission du véhicule »), modifiable sur sa carte : par défaut toute la
 * période du chantier, ou sa plus longue période libre s'il est déjà pris
 * ailleurs une partie du temps. Les conflits s'affichent en rouge sous la
 * carte ; le backend revérifie tout à l'enregistrement.
 */
export function PlanificationEngins({
  candidats,
  selection,
  onChange,
  periode,
  typesEngin,
  lectureSeule = false,
  chantierCritique = false,
}: PlanificationEnginsProps) {
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState(TOUS_TYPES);
  const [enCours, setEnCours] = useState<EnginCandidatChantier | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Appui long sur écran tactile : un simple glissement du doigt continue de faire défiler la page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const selectionSet = useMemo(() => new Set(selection.map((v) => v.idEngin)), [selection]);
  const parId = useMemo(() => new Map(candidats.map((c) => [c.engin.idEngin, c])), [candidats]);
  const vehiculeParId = useMemo(() => new Map(selection.map((v) => [v.idEngin, v])), [selection]);
  const surChantier = useMemo(
    () => selection.map((v) => parId.get(v.idEngin)).filter((c): c is EnginCandidatChantier => c !== undefined),
    [selection, parId],
  );
  const parc = useMemo(
    () =>
      filtrerCandidats(
        candidats.filter((c) => !selectionSet.has(c.engin.idEngin)),
        recherche,
        filtreType === TOUS_TYPES ? null : Number(filtreType),
      ).sort((a, b) => Number(deposable(b, periode, chantierCritique)) - Number(deposable(a, periode, chantierCritique))),
    [candidats, selectionSet, recherche, filtreType, periode, chantierCritique],
  );
  const groupes = useMemo(() => grouperParType(surChantier.map((c) => c.engin)), [surChantier]);

  const ajouter = (idEngin: number) => {
    const candidat = parId.get(idEngin);
    if (selectionSet.has(idEngin) || !candidat || !deposable(candidat, periode, chantierCritique)) return;
    const vehicule = vehiculeDepose(idEngin, periode, candidat.occupations);
    if (vehicule) onChange([...selection, vehicule]);
  };
  const retirer = (idEngin: number) => onChange(selection.filter((v) => v.idEngin !== idEngin));
  const changerPeriode = (idEngin: number, champ: "dateDebut" | "dateFin", valeur: string) =>
    onChange(selection.map((v) => (v.idEngin === idEngin ? { ...v, [champ]: valeur, suitChantier: false } : v)));
  const problemeDe = (idEngin: number): string | null => {
    const vehicule = vehiculeParId.get(idEngin);
    const candidat = parId.get(idEngin);
    return vehicule && candidat ? problemePeriode(vehicule, periode, candidat.occupations) : null;
  };

  const surDebut = (e: DragStartEvent) => {
    const donnees = e.active.data.current as DonneesGlisse | undefined;
    setEnCours(donnees ? (parId.get(donnees.idEngin) ?? null) : null);
  };
  const surFin = (e: DragEndEvent) => {
    setEnCours(null);
    const donnees = e.active.data.current as DonneesGlisse | undefined;
    if (!donnees || !e.over) return;
    if (e.over.id === ZONE_CHANTIER && donnees.origine === "parc") ajouter(donnees.idEngin);
    if (e.over.id === ZONE_PARC && donnees.origine === "chantier") retirer(donnees.idEngin);
  };

  const nbDisponibles = parc.filter((c) => deposable(c, periode, chantierCritique)).length;
  // Véhicules déposés dont la période pose problème : l'enregistrement serait refusé.
  const enConflit = surChantier.filter((c) => problemeDe(c.engin.idEngin) !== null);

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
          id={ZONE_PARC}
          titre="Parc"
          sousTitre={`${nbDisponibles} véhicule${nbDisponibles > 1 ? "s" : ""} disponible${nbDisponibles > 1 ? "s" : ""} — glissez vers « Véhicules du chantier »`}
        >
          <div className="mb-2 flex flex-wrap gap-2">
            <div className="relative min-w-[10rem] flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Rechercher un véhicule"
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                placeholder="Immatriculation, n° de série, marque…"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
            <Select value={filtreType} onValueChange={setFiltreType}>
              <SelectTrigger className="h-9 w-44" aria-label="Filtrer par type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOUS_TYPES}>Tous les types</SelectItem>
                {typesEngin.map((t) => (
                  <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
                    {t.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
            {parc.map((c) => (
              <CarteEngin
                key={c.engin.idEngin}
                candidat={c}
                origine="parc"
                lectureSeule={lectureSeule}
                deplacable={!lectureSeule && deposable(c, periode, chantierCritique)}
                motif={motifParc(c, periode, chantierCritique)}
                onAjouter={() => ajouter(c.engin.idEngin)}
              />
            ))}
            {parc.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Aucun véhicule ne correspond.</li>}
          </ul>
        </ZoneDepot>

        <ZoneDepot
          id={ZONE_CHANTIER}
          titre="Véhicules du chantier"
          sousTitre={`${selection.length} véhicule${selection.length > 1 ? "s" : ""} — enregistrés avec la fiche`}
        >
          {enConflit.length > 0 && (
            <p className="mb-2 rounded-md bg-badge-dangerBg px-2 py-1.5 text-xs text-badge-dangerFg" role="alert">
              Période à corriger pour {enConflit.map((c) => identifiantVehicule(c.engin)).join(", ")} (voir en rouge ci-dessous) :
              ajustez les dates du véhicule ou retirez-le.
            </p>
          )}
          {groupes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Truck className="h-8 w-8" aria-hidden="true" />
              {lectureSeule ? "Aucun véhicule rattaché." : "Déposez ici les véhicules à employer sur ce chantier."}
            </div>
          ) : (
            <div className="space-y-3">
              {groupes.map((groupe) => {
                return (
                  <div key={groupe.idTypeEngin}>
                    <p className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{groupe.libelle}</span>
                      <span>{groupe.engins.length}</span>
                    </p>
                    <ul className="space-y-1.5">
                      {groupe.engins.map((engin) => (
                        <CarteEngin
                          key={engin.idEngin}
                          candidat={parId.get(engin.idEngin)!}
                          origine="chantier"
                          lectureSeule={lectureSeule}
                          deplacable={!lectureSeule}
                          motif={engin.statut === "EN_PANNE" ? libelleEnum(engin.statut) : null}
                          onRetirer={() => retirer(engin.idEngin)}
                          vehicule={vehiculeParId.get(engin.idEngin)}
                          periodeChantier={periode}
                          probleme={problemeDe(engin.idEngin)}
                          onPeriode={(champ, valeur) => changerPeriode(engin.idEngin, champ, valeur)}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </ZoneDepot>
      </div>

      <DragOverlay>
        {enCours && (
          <div className="flex items-center gap-2 rounded-md border border-primary bg-card px-2 py-1.5 shadow-lg">
            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <ContenuCarte candidat={enCours} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
