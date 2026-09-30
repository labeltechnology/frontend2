import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, format, isToday, isWeekend, max as dateMax, min as dateMin } from "date-fns";
import { fr } from "date-fns/locale";
import { useModifierMission } from "@/features/missions/api";
import { MissionFormDialog } from "@/features/missions/MissionFormDialog";
import {
  debutDePeriode,
  deplacerPeriode,
  joursDePeriode,
  libellePeriode,
  LIBELLES_VUE,
  type VuePlanning,
} from "@/features/planning/periode-planning";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { Mission } from "@/types/mission";
import type { EvenementPlanning, EvenementPlanningRessource } from "@/types/planning";
import { toast } from "sonner";

export interface RessourcePlanning {
  id: number;
  titre: string;
}

interface PlanningRessourcesProps {
  ressources: RessourcePlanning[] | undefined;
  evenements: EvenementPlanningRessource[] | undefined;
  /** Missions complètes (pas seulement les événements résolus) : nécessaire pour ouvrir l'édition et recalculer les dates lors d'un glisser-déposer. */
  missions: Mission[] | undefined;
  isLoading?: boolean;
  /** "conducteur" sur ConducteursPage, "engin" sur EnginsPage — pilote le message d'état vide, l'en-tête de colonne et la pré-affectation à la création. */
  libelleRessource: "conducteur" | "engin";
}

const COULEUR_PAR_TYPE: Record<EvenementPlanning["type"], string> = {
  CHANTIER: "bg-sky-500/85",
  MISSION: "bg-emerald-500/85",
  MAINTENANCE: "bg-red-600/90",
};

/** Largeur minimale d'une colonne de jour : large en semaine, étroite en mois (28 à 31 colonnes). */
const LARGEUR_JOUR: Record<VuePlanning, number> = { semaine: 90, mois: 34 };

const HAUTEUR_BARRE = 24; // px
const ESPACE_BARRE = 4; // px
const MARGE_HAUT_LIGNE = 8; // px

interface BarrePositionnee {
  evt: EvenementPlanningRessource;
  indexDebut: number;
  indexFin: number;
  voie: number;
}

type ModeGlisser = "deplacer" | "redimensionner-debut" | "redimensionner-fin";

interface EtatGlisser {
  idMission: number;
  mode: ModeGlisser;
  indexDebutOrigine: number;
  indexFinOrigine: number;
  indexDebutCourant: number;
  indexFinCourant: number;
  indexPointeurOrigine: number;
  rowRect: DOMRect;
  aBouge: boolean;
}

interface CreationInitiale {
  idRessource: number;
  contexte: "conducteur" | "engin";
  jour: Date;
}

function indexJourDepuisClientX(rect: DOMRect, clientX: number, nbJours: number): number {
  const ratio = (clientX - rect.left) / rect.width;
  return Math.min(nbJours - 1, Math.max(0, Math.floor(ratio * nbJours)));
}

/**
 * Vue « planning d'équipe » : toutes les ressources (conducteurs ou engins)
 * affichées ensemble, UNE LIGNE PAR RESSOURCE, avec les événements
 * positionnés sur un axe de jours commun — construite le 2026-09-23 en
 * référence à l'exemple Bryntum Calendar « shifted » cité par l'utilisateur
 * (produit commercial payant, reproduit ici avec un composant maison plutôt
 * qu'une bibliothèque tierce — voir l'historique de PlanningRessources pour
 * le détail des essais précédents).
 *
 * Depuis le 2026-09-24 (référence à l'exemple Syncfusion Scheduler, demande
 * explicite de l'utilisateur : « je veux la meme chose que l'exemple ») :
 * les missions PLANIFIEE sont interactives, dans la portée confirmée par
 * l'utilisateur (« Oui, cette portée » — pas de réaffectation par glisser
 * entre lignes) :
 *  - glisser une barre de mission dans sa ligne déplace ses dates (même
 *    durée) ;
 *  - tirer son bord gauche/droit raccourcit/allonge la mission ;
 *  - cliquer sur une case vide ouvre la création d'une mission pré-remplie
 *    (ressource + jour cliqués) ;
 *  - cliquer sur une mission planifiée ouvre son édition complète (dates,
 *    motif, ET réaffectation conducteur/engin) — réutilise le dialogue de
 *    l'écran Missions (voir MissionFormDialog, étendu d'un mode édition).
 * Les rattachements de chantier restent en lecture seule (écran dédié
 * AffectationChantierDialog/AffectationConducteurChantierDialog) ; il en va
 * de même pour les missions EN_COURS/TERMINEE/ANNULEE (une mission en cours
 * est physiquement engagée — la réagender n'aurait pas de sens métier, et
 * une mission terminée/annulée est un historique clos, cohérent avec
 * MissionService#modifier côté backend qui la refuse de toute façon).
 *
 * Le glisser-déposer est implémenté avec les Pointer Events natifs
 * (setPointerCapture) plutôt qu'avec l'API HTML5 Drag and Drop ou une
 * bibliothèque tierce : plus simple à faire cohabiter avec les poignées de
 * redimensionnement imbriquées, et sans dépendance supplémentaire.
 */
export function PlanningRessources({
  ressources,
  evenements,
  missions,
  isLoading,
  libelleRessource,
}: PlanningRessourcesProps) {
  // Vue semaine ou mois (2026-09-25) ; `debutSemaine` = premier jour de la période affichée.
  const [vue, setVue] = useState<VuePlanning>("semaine");
  const [debutSemaine, setDebutSemaine] = useState(() => debutDePeriode("semaine", new Date()));
  const [glisser, setGlisser] = useState<EtatGlisser | null>(null);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [missionEdition, setMissionEdition] = useState<Mission | null>(null);
  const [creationInitiale, setCreationInitiale] = useState<CreationInitiale | null>(null);

  const modifierMission = useModifierMission();

  const joursSemaine = useMemo(() => joursDePeriode(vue, debutSemaine), [vue, debutSemaine]);
  const largeurJour = LARGEUR_JOUR[vue];
  const changerVue = (nouvelle: VuePlanning) => {
    setVue(nouvelle);
    // On reste sur la période qui contient le premier jour affiché (ou aujourd'hui s'il y est).
    const reference = joursSemaine.some((j) => isToday(j)) ? new Date() : debutSemaine;
    setDebutSemaine(debutDePeriode(nouvelle, reference));
  };
  const finSemaine = joursSemaine[joursSemaine.length - 1];
  const nbJours = joursSemaine.length;

  const missionsParId = useMemo(() => new Map((missions ?? []).map((m) => [m.idMission, m])), [missions]);

  const barresParRessource = useMemo(() => {
    const map = new Map<number, BarrePositionnee[]>();

    for (const evt of evenements ?? []) {
      const debut = new Date(evt.debut);
      const fin = new Date(evt.fin);
      if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || fin < debutSemaine || debut > finSemaine) {
        continue;
      }
      const debutVisible = dateMax([debut, debutSemaine]);
      const finVisible = dateMin([fin, finSemaine]);
      const indexDebut = joursSemaine.findIndex((j) => j.toDateString() === debutVisible.toDateString());
      const indexFin = joursSemaine.findIndex((j) => j.toDateString() === finVisible.toDateString());
      if (indexDebut === -1 || indexFin === -1) continue;

      const liste = map.get(evt.idRessource) ?? [];
      // Attribution de « voie » (l'effet « shifted » de l'exemple Bryntum) :
      // deux événements de la même ressource qui se chevauchent dans le
      // temps sont décalés sur des voies verticales différentes au lieu de
      // se superposer.
      const finParVoie: number[] = [];
      for (const b of liste) {
        finParVoie[b.voie] = Math.max(finParVoie[b.voie] ?? -1, b.indexFin);
      }
      let voie = 0;
      while (finParVoie[voie] !== undefined && finParVoie[voie] >= indexDebut) voie++;

      liste.push({ evt, indexDebut, indexFin, voie });
      map.set(evt.idRessource, liste);
    }

    return map;
  }, [evenements, debutSemaine, finSemaine, joursSemaine]);

  const estInteractif = (evt: EvenementPlanningRessource): evt is EvenementPlanningRessource & { idMission: number } =>
    evt.type === "MISSION" && evt.statut === "PLANIFIEE" && evt.idMission != null;

  const demarrerGlisser = (
    e: ReactPointerEvent<HTMLDivElement>,
    barre: BarrePositionnee,
    mode: ModeGlisser,
  ) => {
    if (mode !== "deplacer") e.stopPropagation();
    if (!estInteractif(barre.evt)) return;
    const ligne = (e.currentTarget as HTMLElement).closest<HTMLDivElement>("[data-planning-ligne]");
    if (!ligne) return;
    const rect = ligne.getBoundingClientRect();
    const indexPointeur = indexJourDepuisClientX(rect, e.clientX, nbJours);
    e.currentTarget.setPointerCapture(e.pointerId);
    setGlisser({
      idMission: barre.evt.idMission,
      mode,
      indexDebutOrigine: barre.indexDebut,
      indexFinOrigine: barre.indexFin,
      indexDebutCourant: barre.indexDebut,
      indexFinCourant: barre.indexFin,
      indexPointeurOrigine: indexPointeur,
      rowRect: rect,
      aBouge: false,
    });
  };

  const surDeplacementPointeur = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!glisser) return;
    const indexActuel = indexJourDepuisClientX(glisser.rowRect, e.clientX, nbJours);
    setGlisser((g) => {
      if (!g) return g;
      const duree = g.indexFinOrigine - g.indexDebutOrigine;
      let indexDebutCourant = g.indexDebutOrigine;
      let indexFinCourant = g.indexFinOrigine;
      if (g.mode === "deplacer") {
        const delta = indexActuel - g.indexPointeurOrigine;
        indexDebutCourant = Math.min(Math.max(0, g.indexDebutOrigine + delta), nbJours - 1 - duree);
        indexFinCourant = indexDebutCourant + duree;
      } else if (g.mode === "redimensionner-debut") {
        indexDebutCourant = Math.min(Math.max(0, indexActuel), g.indexFinOrigine);
      } else {
        indexFinCourant = Math.max(Math.min(nbJours - 1, indexActuel), g.indexDebutOrigine);
      }
      // Un déplacement n'est « réel » que s'il fait franchir une frontière
      // de jour (sinon rien à enregistrer) : sous ce seuil, le relâchement
      // est traité comme un simple clic (voir terminerGlisser).
      const aBouge = g.aBouge || indexDebutCourant !== g.indexDebutOrigine || indexFinCourant !== g.indexFinOrigine;
      return { ...g, indexDebutCourant, indexFinCourant, aBouge };
    });
  };

  const terminerGlisser = () => {
    if (!glisser) return;
    const g = glisser;
    setGlisser(null);

    const mission = missionsParId.get(g.idMission);
    if (!mission) return;

    if (!g.aBouge) {
      // Pas de déplacement réel : un simple clic, on ouvre l'édition.
      setCreationInitiale(null);
      setMissionEdition(mission);
      setDialogOuvert(true);
      return;
    }

    const deltaDebut = g.indexDebutCourant - g.indexDebutOrigine;
    const deltaFin = g.indexFinCourant - g.indexFinOrigine;
    if (deltaDebut === 0 && deltaFin === 0) return;

    const nouvelleDateDebut = addDays(new Date(mission.dateDebutPrevue), deltaDebut);
    const nouvelleDateFin = addDays(new Date(mission.dateFinPrevue), deltaFin);
    modifierMission.mutate(
      {
        id: mission.idMission,
        requete: {
          motif: mission.motif,
          dateDebutPrevue: format(nouvelleDateDebut, "yyyy-MM-dd'T'HH:mm:ss"),
          dateFinPrevue: format(nouvelleDateFin, "yyyy-MM-dd'T'HH:mm:ss"),
          idEngin: mission.engin.idEngin,
          idConducteur: mission.conducteur.idConducteur,
        },
      },
      {
        onSuccess: () => toast.success("Mission déplacée"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Déplacement impossible"),
      },
    );
  };

  const ouvrirCreation = (idRessource: number, jour: Date) => {
    if (glisser) return;
    setMissionEdition(null);
    setCreationInitiale({ idRessource, contexte: libelleRessource, jour });
    setDialogOuvert(true);
  };

  const libelleColonne = libelleRessource.charAt(0).toUpperCase() + libelleRessource.slice(1);

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!ressources || ressources.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aucun {libelleRessource} à afficher.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDebutSemaine(debutDePeriode(vue, new Date()))}>
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={vue === "mois" ? "Mois précédent" : "Semaine précédente"}
            onClick={() => setDebutSemaine((d) => deplacerPeriode(vue, d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={vue === "mois" ? "Mois suivant" : "Semaine suivante"}
            onClick={() => setDebutSemaine((d) => deplacerPeriode(vue, d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2 inline-flex rounded-md border p-0.5" role="group" aria-label="Affichage du planning">
            {(Object.keys(LIBELLES_VUE) as VuePlanning[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => changerVue(v)}
                aria-pressed={vue === v}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  vue === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {LIBELLES_VUE[v]}
              </button>
            ))}
          </div>
        </div>
        <span className="font-medium capitalize">{libellePeriode(vue, joursSemaine)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-500/85" /> Chantier
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/85" /> Mission
        </span>
        {libelleRessource === "engin" && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-600/90" /> Maintenance
          </span>
        )}
        <span>
          Cliquez sur une case vide pour planifier une mission · glissez ou redimensionnez une mission planifiée pour
          changer ses dates · cliquez sur une mission planifiée pour la modifier.
        </span>
      </div>

      <div className="max-h-[560px] overflow-auto rounded-md border">
        <div style={{ minWidth: 220 + nbJours * largeurJour }}>
          <div
            className="sticky top-0 z-10 grid border-b bg-background"
            style={{ gridTemplateColumns: `minmax(160px, 220px) repeat(${nbJours}, minmax(${largeurJour}px, 1fr))` }}
          >
            <div className="border-r px-2 py-1.5 text-xs font-medium text-muted-foreground">{libelleColonne}</div>
            {joursSemaine.map((jour) => (
              <div
                key={jour.toISOString()}
                title={format(jour, "EEEE d MMMM", { locale: fr })}
                className={cn(
                  "border-r px-1 py-1.5 text-center text-xs font-medium capitalize last:border-r-0",
                  isToday(jour) ? "bg-accent/50" : vue === "mois" && isWeekend(jour) && "bg-muted/40",
                )}
              >
                {vue === "mois" ? (
                  <>
                    <span className="block text-[10px] text-muted-foreground">{format(jour, "EEEEE", { locale: fr })}</span>
                    {format(jour, "d")}
                  </>
                ) : (
                  format(jour, "EEE d", { locale: fr })
                )}
              </div>
            ))}
          </div>

          {ressources.map((ressource) => {
            const barres = barresParRessource.get(ressource.id) ?? [];
            const nbVoies = Math.max(1, ...barres.map((b) => b.voie + 1));
            const hauteurZone = nbVoies * HAUTEUR_BARRE + (nbVoies - 1) * ESPACE_BARRE + MARGE_HAUT_LIGNE * 2;

            return (
              <div
                key={ressource.id}
                className="grid border-b last:border-b-0"
                style={{ gridTemplateColumns: `minmax(160px, 220px) repeat(${nbJours}, minmax(${largeurJour}px, 1fr))` }}
              >
                <div className="flex items-center border-r bg-background px-2 py-1.5 text-sm font-medium">
                  {ressource.titre}
                </div>

                <div
                  data-planning-ligne
                  className="relative"
                  style={{ gridColumn: `2 / span ${nbJours}`, minHeight: hauteurZone }}
                >
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${nbJours}, 1fr)` }}>
                    {joursSemaine.map((jour) => (
                      <div
                        key={jour.toISOString()}
                        onClick={() => ouvrirCreation(ressource.id, jour)}
                        className={cn(
                          "cursor-pointer border-r transition-colors last:border-r-0 hover:bg-accent/20",
                          isToday(jour) ? "bg-accent/30" : vue === "mois" && isWeekend(jour) && "bg-muted/30",
                        )}
                      />
                    ))}
                  </div>

                  {barres.map((barre) => {
                    const interactif = estInteractif(barre.evt);
                    // Un événement non déplaçable (maintenance, rattachement chantier...)
                    // n'a pas d'idMission. Sans glissement en cours, `glisser?.idMission`
                    // vaut undefined des deux côtés : la comparaison était vraie et on
                    // déréférençait `glisser!`, pourtant null. On exige donc explicitement
                    // qu'un glissement soit en cours, et on garde la référence non nulle.
                    const glisserDeCetteBarre =
                      glisser !== null && glisser.idMission === barre.evt.idMission ? glisser : null;
                    const enCoursDeGlisser = glisserDeCetteBarre !== null;
                    const indexDebut = glisserDeCetteBarre ? glisserDeCetteBarre.indexDebutCourant : barre.indexDebut;
                    const indexFin = glisserDeCetteBarre ? glisserDeCetteBarre.indexFinCourant : barre.indexFin;

                    return (
                      <div
                        key={barre.evt.id}
                        onPointerDown={interactif ? (e) => demarrerGlisser(e, barre, "deplacer") : undefined}
                        onPointerMove={interactif ? surDeplacementPointeur : undefined}
                        onPointerUp={interactif ? terminerGlisser : undefined}
                        onPointerCancel={interactif ? () => setGlisser(null) : undefined}
                        className={`absolute flex select-none items-center gap-1.5 truncate rounded px-1.5 text-[11px] text-white ${COULEUR_PAR_TYPE[barre.evt.type]} ${
                          interactif ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-default"
                        } ${enCoursDeGlisser ? "z-10 opacity-90 shadow-lg ring-2 ring-white/70" : ""}`}
                        style={{
                          left: `calc(${(indexDebut / nbJours) * 100}% + 2px)`,
                          width: `calc(${((indexFin - indexDebut + 1) / nbJours) * 100}% - 4px)`,
                          top: MARGE_HAUT_LIGNE + barre.voie * (HAUTEUR_BARRE + ESPACE_BARRE),
                          height: HAUTEUR_BARRE,
                        }}
                        title={`${barre.evt.libelle}${barre.evt.sousLibelle ? " — " + barre.evt.sousLibelle : ""} (${barre.evt.statut})`}
                      >
                        {interactif && (
                          <div
                            onPointerDown={(e) => demarrerGlisser(e, barre, "redimensionner-debut")}
                            onPointerMove={surDeplacementPointeur}
                            onPointerUp={terminerGlisser}
                            onPointerCancel={() => setGlisser(null)}
                            className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize touch-none"
                          />
                        )}
                        <span className="truncate">
                          {barre.evt.libelle}
                          {barre.evt.sousLibelle ? ` — ${barre.evt.sousLibelle}` : ""}
                        </span>
                        {interactif && (
                          <div
                            onPointerDown={(e) => demarrerGlisser(e, barre, "redimensionner-fin")}
                            onPointerMove={surDeplacementPointeur}
                            onPointerUp={terminerGlisser}
                            onPointerCancel={() => setGlisser(null)}
                            className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize touch-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MissionFormDialog
        open={dialogOuvert}
        onOpenChange={setDialogOuvert}
        mission={missionEdition}
        creationInitiale={creationInitiale}
      />
    </div>
  );
}
