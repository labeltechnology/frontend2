import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MoreHorizontal, Plus, Search, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { AffectationChantierDialog } from "@/features/chantiers/AffectationChantierDialog";
import { AffectationConducteurChantierDialog } from "@/features/chantiers/AffectationConducteurChantierDialog";
import { AnnulerChantierDialog } from "@/features/chantiers/AnnulerChantierDialog";
import { AnalyseChantiersTab } from "@/features/chantiers/analyse/AnalyseChantiersTab";
import { DemandesChantiersTab } from "@/features/chantiers/demandes/DemandesChantiersTab";
import { LIBELLES_PRIORITE, VARIANT_PRIORITE } from "@/features/chantiers/organisation/organisation";
import { RentabiliteChantiersTab } from "@/features/chantiers/rentabilite/RentabiliteChantiersTab";
import { useAuth } from "@/features/auth/useAuth";
import { peut } from "@/lib/droits";
import { ChantiersMap } from "@/features/chantiers/ChantiersMap";
import { useDemarrerChantier, useTerminerChantier } from "@/features/chantiers/api";
import { useRafraichirApresStatut, useSyntheseChantiers } from "@/features/chantiers/suivi-api";
import {
  filtrerChantiers,
  indicateurs,
  libelleJoursRestants,
  LIBELLES_ETAT,
  LIBELLES_FILTRE,
  VARIANT_ETAT,
  type FiltreChantiers,
} from "@/features/chantiers/suivi/synthese-chantiers";
import { cn, formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { Chantier, ChantierResume, StatutChantier } from "@/types/chantier";
import { toast } from "sonner";

/** Exportés pour être réutilisés tels quels par ChantiersMap.tsx (popups des marqueurs). */
export const LIBELLE_STATUT: Record<StatutChantier, string> = {
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const VARIANT_STATUT: Record<StatutChantier, "default" | "success" | "warning" | "destructive"> = {
  PLANIFIE: "default",
  EN_COURS: "warning",
  TERMINE: "success",
  ANNULE: "destructive",
};

const FILTRES: FiltreChantiers[] = ["ACTIFS", "EN_COURS", "A_SURVEILLER", "TOUS", "A_VENIR", "NON_DEMARRE", "DANS_LES_TEMPS", "EN_RETARD", "TERMINE", "ANNULE"];

/** Barre d'avancement : part du temps prévu écoulée (rouge si en retard). */
function Avancement({ resume }: { resume: ChantierResume }) {
  if (resume.avancement === null) return <span className="text-muted-foreground">—</span>;
  const retard = resume.etat === "EN_RETARD";
  return (
    <div className="min-w-24 space-y-1">
      <div className="h-1.5 rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-1.5 rounded-full", retard ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.min(100, Math.max(0, resume.avancement))}%` }}
        />
      </div>
      <p className={cn("text-xs", retard ? "text-destructive" : "text-muted-foreground")}>
        {resume.avancement} % · {libelleJoursRestants(resume.joursRestants)}
      </p>
    </div>
  );
}

/**
 * Liste des chantiers — enrichie le 2026-09-29 (V63) : indicateurs cliquables,
 * recherche, filtre par état du jour (calculé par le serveur), véhicules,
 * conducteurs, avancement et alertes ouvertes. Démarrer / terminer / annuler
 * rechargent aussi les rattachements libérés par le serveur ; l'annulation
 * passe par AnnulerChantierDialog (motif obligatoire, 255 caractères).
 *
 * V64 (2026-09-29) : organisation (priorité, type, chef de chantier),
 * demandes de matériel en attente, onglets Demandes, Rentabilité et Analyse ;
 * création et changements de statut réservés à la gestion du parc ; le chef
 * de chantier voit d'abord ses chantiers (« Mes chantiers »).
 */
export function ChantiersPage() {
  const navigate = useNavigate();
  const { data: resumes, isLoading, isError } = useSyntheseChantiers();
  const demarrer = useDemarrerChantier();
  const terminer = useTerminerChantier();
  const rafraichir = useRafraichirApresStatut();

  const { session } = useAuth();
  const gestion = peut(session?.role, "GERER_PARC");
  const consultation = peut(session?.role, "CONSULTER_GESTION");
  const suivi = peut(session?.role, "SUIVI_CHANTIER");
  const chefDeChantier = session?.role === "CHEF_CHANTIER";
  const [mesChantiers, setMesChantiers] = useState(chefDeChantier);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<FiltreChantiers>("ACTIFS");
  const [chantierEngins, setChantierEngins] = useState<Chantier | null>(null);
  const [chantierConducteurs, setChantierConducteurs] = useState<Chantier | null>(null);
  const [chantierAnnule, setChantierAnnule] = useState<Chantier | null>(null);

  // Chef de chantier (V64) : ses chantiers d'abord (ceux dont il est responsable).
  const perimetre = useMemo(
    () => (resumes && mesChantiers ? resumes.filter((r) => r.idResponsable === session?.idUtilisateur) : resumes),
    [resumes, mesChantiers, session?.idUtilisateur],
  );
  const chiffres = useMemo(() => indicateurs(perimetre ?? []), [perimetre]);
  const visibles = useMemo(() => (perimetre ? filtrerChantiers(perimetre, recherche, filtre) : undefined), [perimetre, recherche, filtre]);

  // Reprend la version la plus fraîche du chantier dans la liste : les mutations
  // invalident la liste, mais l'objet capturé à l'ouverture du dialogue ne
  // se met pas à jour tout seul.
  const actuel = (c: Chantier | null) => (c ? resumes?.find((r) => r.chantier.idChantier === c.idChantier)?.chantier ?? c : null);

  const changerStatut = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      rafraichir();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<ChantierResume>[] = [
    {
      key: "nom",
      header: "Chantier",
      render: ({ chantier }) => (
        <div>
          <span className="font-medium">{chantier.nom}</span>
          {chantier.lieu && <div className="text-xs text-muted-foreground">{chantier.lieu}</div>}
        </div>
      ),
    },
    {
      key: "organisation",
      header: "Organisation",
      render: (r) => (
        <div className="flex flex-col items-start gap-1 text-xs">
          {r.priorite && r.priorite !== "NORMALE" && <Badge variant={VARIANT_PRIORITE[r.priorite]}>{LIBELLES_PRIORITE[r.priorite]}</Badge>}
          <span className="text-muted-foreground">{r.typeChantier ?? "Type non précisé"}</span>
          {r.nomResponsable && <span>Chef : {r.nomResponsable}</span>}
        </div>
      ),
    },
    {
      key: "periode",
      header: "Période prévue",
      className: "whitespace-nowrap",
      render: ({ chantier }) => `${formatDate(chantier.dateDebutPrevue)} → ${formatDate(chantier.dateFinPrevue)}`,
    },
    {
      key: "etat",
      header: "État",
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={VARIANT_ETAT[r.etat]}>{LIBELLES_ETAT[r.etat]}</Badge>
          {r.alertesOuvertes > 0 && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              {r.alertesOuvertes} alerte{r.alertesOuvertes > 1 ? "s" : ""}
            </span>
          )}
          {(r.demandesEnAttente ?? 0) > 0 && (
            <span className="text-xs text-badge-warningFg">{r.demandesEnAttente} demande(s) de matériel en attente</span>
          )}
        </div>
      ),
    },
    {
      key: "ressources",
      header: "Ressources",
      render: (r) => (
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1" title="Véhicules">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            {r.vehicules}
          </span>
          <span className="flex items-center gap-1" title="Conducteurs">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {r.conducteurs}
          </span>
        </div>
      ),
    },
    { key: "avancement", header: "Avancement", render: (r) => <Avancement resume={r} /> },
  ];

  const carte = (titre: string, valeur: number, cible: FiltreChantiers, alerte = false, precision?: string) => (
    <button
      type="button"
      onClick={() => setFiltre(cible)}
      className={cn("rounded-xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        filtre === cible && "ring-2 ring-primary")}
      aria-pressed={filtre === cible}
    >
      <CarteChiffre titre={titre} valeur={valeur} precision={precision} classeValeur={alerte && valeur > 0 ? "text-destructive" : undefined} />
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chantiers"
        description="Suivi des chantiers : état du jour, ressources, avancement et alertes."
        actions={
          // Fiche chantier (2026-09-24) : création et modification sur une page dédiée (gestion du parc).
          gestion ? (
            <Button onClick={() => navigate("/chantiers/nouveau")}>
              <Plus className="h-4 w-4" />
              Nouveau chantier
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {carte("En cours", chiffres.enCours, "EN_COURS")}
        {carte("À venir", chiffres.aVenir, "A_VENIR")}
        {carte("Non démarrés", chiffres.nonDemarres, "NON_DEMARRE", true, "Date de début passée")}
        {carte("En retard", chiffres.enRetard, "EN_RETARD", true, `${chiffres.alertesOuvertes} alerte(s) ouverte(s)`)}
      </div>

      <Tabs defaultValue="liste">
        <TabsList>
          <TabsTrigger value="liste">Liste</TabsTrigger>
          <TabsTrigger value="carte">Carte</TabsTrigger>
          {suivi && <TabsTrigger value="demandes">Demandes</TabsTrigger>}
          {consultation && <TabsTrigger value="rentabilite">Rentabilité</TabsTrigger>}
          {consultation && <TabsTrigger value="analyse">Analyse</TabsTrigger>}
        </TabsList>

        <TabsContent value="liste" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {chefDeChantier && (
              <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                <Switch checked={mesChantiers} onCheckedChange={setMesChantiers} />
                Mes chantiers
              </label>
            )}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un chantier (nom, lieu, description)"
                className="pl-8"
                aria-label="Rechercher un chantier"
              />
            </div>
            <Select value={filtre} onValueChange={(v) => setFiltre(v as FiltreChantiers)}>
              <SelectTrigger className="sm:w-56" aria-label="Filtrer par état">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTRES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {LIBELLES_FILTRE[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={visibles}
            isLoading={isLoading}
            isError={isError}
            emptyMessage="Aucun chantier ne correspond."
            getRowKey={(r) => r.chantier.idChantier}
            onRowClick={(r) => navigate(`/chantiers/${r.chantier.idChantier}/fiche`)}
            rowActions={({ chantier }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions sur ${chantier.nom}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => navigate(`/chantiers/${chantier.idChantier}/fiche`)}>
                    {gestion ? "Voir / modifier la fiche" : "Voir la fiche"}
                  </DropdownMenuItem>
                  {gestion && <DropdownMenuSeparator />}
                  {gestion && <DropdownMenuItem onSelect={() => setChantierEngins(chantier)}>Véhicules rattachés</DropdownMenuItem>}
                  {gestion && (
                    <DropdownMenuItem onSelect={() => setChantierConducteurs(chantier)}>
                      Conducteurs rattachés
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => navigate(`/chantiers/${chantier.idChantier}/plan`)}>
                    Plan du chantier
                  </DropdownMenuItem>
                  {gestion && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className={gestion ? undefined : "hidden"}
                    disabled={chantier.statut !== "PLANIFIE"}
                    onSelect={() => changerStatut(() => demarrer.mutateAsync(chantier.idChantier), "Chantier démarré")}
                  >
                    Démarrer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={gestion ? undefined : "hidden"}
                    disabled={chantier.statut !== "EN_COURS"}
                    onSelect={() =>
                      changerStatut(
                        () => terminer.mutateAsync(chantier.idChantier),
                        "Chantier terminé — ses véhicules et conducteurs sont libérés",
                      )
                    }
                  >
                    Terminer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={gestion ? undefined : "hidden"}
                    disabled={chantier.statut === "TERMINE" || chantier.statut === "ANNULE"}
                    onSelect={() => setChantierAnnule(chantier)}
                  >
                    Annuler…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </TabsContent>

        <TabsContent value="carte">
          <ChantiersMap />
        </TabsContent>

        {suivi && (
          <TabsContent value="demandes">
            <DemandesChantiersTab gestion={gestion} idUtilisateur={session?.idUtilisateur} />
          </TabsContent>
        )}
        {consultation && (
          <TabsContent value="rentabilite">
            <RentabiliteChantiersTab gestion={gestion} />
          </TabsContent>
        )}
        {consultation && (
          <TabsContent value="analyse">
            <AnalyseChantiersTab gestion={gestion} />
          </TabsContent>
        )}
      </Tabs>

      <AffectationChantierDialog chantier={actuel(chantierEngins)} onOpenChange={(open) => !open && setChantierEngins(null)} />
      <AffectationConducteurChantierDialog
        chantier={actuel(chantierConducteurs)}
        onOpenChange={(open) => !open && setChantierConducteurs(null)}
      />
      <AnnulerChantierDialog chantier={chantierAnnule} onOpenChange={(open) => !open && setChantierAnnule(null)} />
      {/* « Besoins en matériel » retiré le 2026-09-24 : les besoins sont désormais la liste des
          véhicules de la fiche chantier (voir fiche/engins-chantier.ts). */}
    </div>
  );
}
