import { useState } from "react";
import { MessagesSquare, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn, type FiltreRapide } from "@/components/data-table/DataTable";
import { optionsStatut } from "@/components/data-table/options-statut";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { useAuth } from "@/features/auth/useAuth";
import { useOuvrirDiscussion } from "@/features/messagerie/BoutonDiscussion";
import { missionModifiable, motifDemarrageImpossible } from "@/features/missions/actions-mission";
import { MissionActionDialogs } from "@/features/missions/MissionActionDialogs";
import { MissionFormDialog } from "@/features/missions/MissionFormDialog";
import { useMissions } from "@/features/missions/api";
import { formatDateTime, formatNombre } from "@/lib/utils";
import type { Mission } from "@/types/mission";
import { libelleVehicule } from "@/lib/vehicule";
import { peut } from "@/lib/droits";

/** Filtre rapide par statut (2026-09-30). */
const FILTRE_STATUT_MISSION: FiltreRapide<Mission> = {
  libelle: "Filtrer par statut",
  valeur: (m) => m.statut,
  options: optionsStatut(["PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
};

export function MissionsPage() {
  const { session } = useAuth();
  const { data: missions, isLoading, isError } = useMissions();
  // Un seul dialogue pour créer et modifier (2026-09-25) : la mission reste
  // renseignée pendant l'animation de fermeture pour que le titre ne bascule
  // pas sur « Nouvelle mission ».
  const [formulaire, setFormulaire] = useState<{ ouvert: boolean; mission: Mission | null }>({ ouvert: false, mission: null });
  const [demarrerCible, setDemarrerCible] = useState<Mission | null>(null);
  const [terminerCible, setTerminerCible] = useState<Mission | null>(null);
  const [annulerCible, setAnnulerCible] = useState<Mission | null>(null);

  const peutGerer = peut(session?.role, "GERER_PARC");
  const discussion = useOuvrirDiscussion();

  const columns: DataTableColumn<Mission>[] = [
    { key: "motif", header: "Motif", render: (m) => <span className="font-medium">{m.motif}</span>, sortValue: (m) => m.motif, mobile: "titre" },
    { key: "engin", header: "Véhicule", render: (m) => libelleVehicule(m.engin), sortValue: (m) => libelleVehicule(m.engin) },
    { key: "conducteur", header: "Conducteur", render: (m) => `${m.conducteur.nom} ${m.conducteur.prenom}`, sortValue: (m) => `${m.conducteur.nom} ${m.conducteur.prenom}` },
    { key: "debutPrevu", header: "Début prévu", render: (m) => formatDateTime(m.dateDebutPrevue), sortValue: (m) => m.dateDebutPrevue },
    { key: "finPrevue", header: "Fin prévue", render: (m) => formatDateTime(m.dateFinPrevue), sortValue: (m) => m.dateFinPrevue },
    {
      key: "km",
      header: "km départ/retour",
      render: (m) => `${formatNombre(m.kilometrageDepart)} / ${formatNombre(m.kilometrageRetour)}`,
    },
    { key: "statut", header: "Statut", render: (m) => <StatutBadge statut={m.statut} />, sortValue: (m) => m.statut },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Missions"
        description="Missions planifiées, en cours et terminées."
        actions={
          peutGerer && (
            <Button onClick={() => setFormulaire({ ouvert: true, mission: null })}>
              <Plus className="h-4 w-4" />
              Nouvelle mission
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={missions}
        cleMemoire="missions"
        filtreRapide={FILTRE_STATUT_MISSION}
        recherche={{ texte: (m) => `${m.motif} ${libelleVehicule(m.engin)} ${m.conducteur.nom} ${m.conducteur.prenom}`, placeholder: "Motif, véhicule, conducteur…" }}
        libelles={["mission", "missions"]}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(m) => m.idMission}
        rowActions={(mission) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {peutGerer && (
                <DropdownMenuItem
                  disabled={!missionModifiable(mission)}
                  onSelect={() => setFormulaire({ ouvert: true, mission })}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}
              {discussion.autorise && (
                <DropdownMenuItem onSelect={() => discussion.ouvrirDiscussion("MISSION", mission.idMission)}>
                  <MessagesSquare className="h-4 w-4" />
                  Discussion
                </DropdownMenuItem>
              )}
              <ActionDemarrer mission={mission} onDemarrer={() => setDemarrerCible(mission)} />
              <DropdownMenuItem disabled={mission.statut !== "EN_COURS"} onSelect={() => setTerminerCible(mission)}>
                Terminer
              </DropdownMenuItem>
              {peutGerer && (
                <DropdownMenuItem
                  disabled={mission.statut === "TERMINEE" || mission.statut === "ANNULEE"}
                  onSelect={() => setAnnulerCible(mission)}
                  className="text-destructive focus:text-destructive"
                >
                  Annuler
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <MissionFormDialog
        open={formulaire.ouvert}
        onOpenChange={(ouvert) => setFormulaire((f) => ({ ...f, ouvert }))}
        mission={formulaire.mission}
      />
      <MissionActionDialogs
        demarrerCible={demarrerCible}
        terminerCible={terminerCible}
        annulerCible={annulerCible}
        onFermer={() => {
          setDemarrerCible(null);
          setTerminerCible(null);
          setAnnulerCible(null);
        }}
      />
    </div>
  );
}

/**
 * « Démarrer » (2026-10-01) : grisé avec son motif quand la mission ne peut
 * pas encore partir (prévue un autre jour, véhicule indisponible). Pour une
 * mission déjà en cours, terminée ou annulée, simplement grisé.
 */
function ActionDemarrer({ mission, onDemarrer }: { mission: Mission; onDemarrer: () => void }) {
  const motif = motifDemarrageImpossible(mission);
  return (
    <DropdownMenuItem disabled={motif !== null} onSelect={onDemarrer} className="flex-col items-start gap-0.5">
      <span>Démarrer</span>
      {motif !== null && mission.statut === "PLANIFIEE" && (
        <span className="max-w-[16rem] text-[11px] leading-snug text-muted-foreground">{motif}</span>
      )}
    </DropdownMenuItem>
  );
}
