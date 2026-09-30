import { useMemo, useState } from "react";
import { CalendarClock, Eye, MessagesSquare, MoreHorizontal, PackagePlus, Play, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { useAuth } from "@/features/auth/useAuth";
import { useDemarrerMaintenance, useMaintenances } from "@/features/maintenance/api";
import { peutFaireMaintenance } from "@/features/maintenance/faire-maintenance";
import { MaintenanceActionDialogs } from "@/features/maintenance/MaintenanceActionDialogs";
import { MaintenanceFormDialog } from "@/features/maintenance/MaintenanceFormDialog";
import { ReplanifierMaintenanceDialog } from "@/features/maintenance/ReplanifierMaintenanceDialog";
import { objetMaintenance } from "@/features/maintenance/objet-maintenance";
import { BarreFiltresMaintenance } from "@/features/maintenance/liste/BarreFiltresMaintenance";
import { FicheMaintenance } from "@/features/maintenance/liste/FicheMaintenance";
import { IndicateursMaintenance } from "@/features/maintenance/liste/IndicateursMaintenance";
import {
  coutAffiche,
  dureeImmobilisation,
  estEnRetard,
  FILTRES_PAR_DEFAUT,
  filtrerMaintenances,
  indicateursMaintenance,
  LIBELLES_TYPE_MAINTENANCE,
  trierMaintenances,
  type FiltresMaintenance,
} from "@/features/maintenance/liste/maintenance-liste";
import { useOuvrirDiscussion } from "@/features/messagerie/BoutonDiscussion";
import { ApiError } from "@/lib/api-client";
import { cn, formatDateTime, formatMontant } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { Maintenance } from "@/types/maintenance";
import { toast } from "sonner";

/** Date utile selon le statut : prévue, début ou fin. */
function CelluleDate({ m, aujourdhui }: { m: Maintenance; aujourdhui: Date }) {
  if (m.statut === "PLANIFIEE") {
    if (!m.datePrevue) return <span className="text-muted-foreground">Sans date</span>;
    const retard = estEnRetard(m, aujourdhui);
    return (
      <span className={cn("whitespace-nowrap", retard && "font-medium text-badge-warningFg")}>
        Prévue {formatDateTime(m.datePrevue)}
        {retard && <span className="block text-xs">en retard</span>}
      </span>
    );
  }
  if (m.statut === "EN_COURS") return <span className="whitespace-nowrap">Depuis {formatDateTime(m.dateDebut)}</span>;
  return <span className="whitespace-nowrap">Finie {formatDateTime(m.dateFin)}</span>;
}

/**
 * Onglet « Maintenances » (2026-09-28, « améliorer la page maintenance ») :
 * indicateurs cliquables, recherche et filtres, colonnes lisibles, fiche
 * détaillée au clic sur une ligne. Actions réservées au droit maintenance
 * (GERER_MAINTENANCE) — les autres profils consultent. Règles de liste :
 * maintenance-liste.ts.
 */
export function OngletMaintenances() {
  const { data: maintenances, isLoading, isError } = useMaintenances();
  const demarrer = useDemarrerMaintenance();
  const discussion = useOuvrirDiscussion();
  const { session } = useAuth();
  const peutAgir = peutFaireMaintenance(session?.role);

  const [filtres, setFiltres] = useState<FiltresMaintenance>(FILTRES_PAR_DEFAUT);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [idFiche, setIdFiche] = useState<number | null>(null);
  const [ajouterPieceCible, setAjouterPieceCible] = useState<Maintenance | null>(null);
  const [terminerCible, setTerminerCible] = useState<Maintenance | null>(null);
  const [replanifierCible, setReplanifierCible] = useState<Maintenance | null>(null);

  // Mémorisé : sans ça, `maintenances ?? []` fabrique un tableau neuf à chaque
  // rendu tant que les données chargent, ce qui invalide pour rien les deux
  // useMemo ci-dessous (indicateurs, liste triée et filtrée).
  const toutes = useMemo(() => maintenances ?? [], [maintenances]);
  // « Aujourd'hui » est délibérément réévalué à chaque rafraîchissement des
  // données : les échéances (en retard, à venir) se calculent par rapport au
  // jour courant, et une page laissée ouverte doit basculer avec elles.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dépendance à `toutes` voulue : c'est le signal de rafraîchissement, pas une valeur lue
  const aujourdhui = useMemo(() => new Date(), [toutes]);
  const indicateurs = useMemo(() => indicateursMaintenance(toutes, aujourdhui), [toutes, aujourdhui]);
  const affichees = useMemo(
    () => trierMaintenances(filtrerMaintenances(toutes, filtres, aujourdhui)),
    [toutes, filtres, aujourdhui],
  );
  // La fiche relit la maintenance dans les données à jour (après démarrage, ajout de pièce…).
  const fiche = idFiche === null ? null : (toutes.find((m) => m.idMaintenance === idFiche) ?? null);

  const onDemarrer = async (maintenance: Maintenance) => {
    try {
      await demarrer.mutateAsync(maintenance.idMaintenance);
      toast.success(`Maintenance démarrée — ${libelleVehicule(maintenance.engin)} passe en maintenance`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };
  const onDiscussion = discussion.autorise
    ? (m: Maintenance) => discussion.ouvrirDiscussion("MAINTENANCE", m.idMaintenance)
    : undefined;

  const columns: DataTableColumn<Maintenance>[] = [
    {
      key: "engin",
      header: "Véhicule",
      render: (m) => (
        <div className="min-w-0">
          <span className="font-medium">{libelleVehicule(m.engin)}</span>
          {m.engin?.typeEngin?.libelle && <p className="text-xs text-muted-foreground">{m.engin.typeEngin.libelle}</p>}
        </div>
      ),
    },
    {
      key: "objet",
      header: "Travaux",
      render: (m) => (
        <div className="max-w-xs">
          <p className="line-clamp-2 text-sm">{objetMaintenance(m) ?? "—"}</p>
          {m.libellePosteEntretien && m.travaux.length > 0 && (
            <p className="text-xs text-muted-foreground">Poste : {m.libellePosteEntretien}</p>
          )}
        </div>
      ),
    },
    { key: "type", header: "Type", render: (m) => LIBELLES_TYPE_MAINTENANCE[m.type] },
    { key: "atelier", header: "Atelier", render: (m) => m.nomGarageExterne ?? "Atelier interne" },
    { key: "date", header: "Date", render: (m) => <CelluleDate m={m} aujourdhui={aujourdhui} /> },
    {
      key: "duree",
      header: "Immobilisation",
      render: (m) => <span className="whitespace-nowrap tabular-nums">{dureeImmobilisation(m, aujourdhui) ?? "—"}</span>,
    },
    {
      key: "cout",
      header: "Coût",
      render: (m) => {
        const { montant, provisoire } = coutAffiche(m);
        if (montant === null) return "—";
        return (
          <span className="whitespace-nowrap tabular-nums" title={provisoire ? "Provisoire : figé à la clôture" : undefined}>
            {formatMontant(montant)}
            {provisoire && <span className="ml-1 text-xs text-muted-foreground">prov.</span>}
          </span>
        );
      },
    },
    { key: "statut", header: "Statut", render: (m) => <StatutBadge statut={m.statut} /> },
  ];

  return (
    <div className="space-y-4">
      <IndicateursMaintenance
        indicateurs={indicateurs}
        filtreActif={filtres.statut}
        onFiltrer={(statut) => setFiltres((f) => ({ ...f, statut }))}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <BarreFiltresMaintenance filtres={filtres} onChange={setFiltres} resultat={affichees.length} total={toutes.length} />
        </div>
        {peutAgir && (
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle maintenance
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={maintenances === undefined ? undefined : affichees}
        isLoading={isLoading}
        isError={isError}
        emptyMessage={toutes.length === 0 ? "Aucune maintenance enregistrée." : "Aucune maintenance ne correspond aux filtres."}
        getRowKey={(m) => m.idMaintenance}
        onRowClick={(m) => setIdFiche(m.idMaintenance)}
        rowActions={(m) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setIdFiche(m.idMaintenance)}>
                <Eye className="h-4 w-4" />
                Ouvrir la fiche
              </DropdownMenuItem>
              {onDiscussion && (
                <DropdownMenuItem onSelect={() => onDiscussion(m)}>
                  <MessagesSquare className="h-4 w-4" />
                  Discussion
                </DropdownMenuItem>
              )}
              {peutAgir && m.statut !== "TERMINEE" && (
                <>
                  <DropdownMenuSeparator />
                  {m.statut === "PLANIFIEE" && (
                    <>
                      <DropdownMenuItem onSelect={() => onDemarrer(m)}>
                        <Play className="h-4 w-4" />
                        Démarrer
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setReplanifierCible(m)}>
                        <CalendarClock className="h-4 w-4" />
                        Replanifier
                      </DropdownMenuItem>
                    </>
                  )}
                  {m.statut === "EN_COURS" && (
                    <>
                      <DropdownMenuItem onSelect={() => setAjouterPieceCible(m)}>
                        <PackagePlus className="h-4 w-4" />
                        Ajouter une pièce
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setTerminerCible(m)}>
                        <Square className="h-4 w-4" />
                        Terminer
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <FicheMaintenance
        maintenance={fiche}
        onFermer={() => setIdFiche(null)}
        peutAgir={peutAgir}
        onDemarrer={onDemarrer}
        onAjouterPiece={setAjouterPieceCible}
        onTerminer={setTerminerCible}
        onReplanifier={setReplanifierCible}
        onDiscussion={onDiscussion}
        demarrageEnCours={demarrer.isPending}
      />
      <MaintenanceFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <ReplanifierMaintenanceDialog maintenance={replanifierCible} onFermer={() => setReplanifierCible(null)} />
      <MaintenanceActionDialogs
        ajouterPieceCible={ajouterPieceCible}
        terminerCible={terminerCible}
        onFermer={() => {
          setAjouterPieceCible(null);
          setTerminerCible(null);
        }}
      />
    </div>
  );
}
