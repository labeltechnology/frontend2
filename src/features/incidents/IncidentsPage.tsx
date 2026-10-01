import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
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
import { SinistreDialog, type CibleSinistre } from "@/features/fiabilite/SinistreDialog";
import { IncidentActionDialogs } from "@/features/incidents/IncidentActionDialogs";
import { IncidentFormDialog } from "@/features/incidents/IncidentFormDialog";
import { useIncidents } from "@/features/incidents/api";
import { formatDateTime, formatMontant } from "@/lib/utils";
import type { Incident } from "@/types/incident";
import { libelleVehicule } from "@/lib/vehicule";
import { peut } from "@/lib/droits";

/** Filtre rapide par statut et ordre de gravité pour le tri (2026-09-30). */
const FILTRE_STATUT_INCIDENT: FiltreRapide<Incident> = {
  libelle: "Filtrer par statut",
  valeur: (i) => i.statut,
  options: optionsStatut(["DECLARE", "EN_TRAITEMENT", "CLOTURE"]),
};
const RANG_GRAVITE: Record<string, number> = { FAIBLE: 1, MOYENNE: 2, ELEVEE: 3, CRITIQUE: 4 };

export function IncidentsPage() {
  const { data: incidents, isLoading, isError } = useIncidents();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [assignerCible, setAssignerCible] = useState<Incident | null>(null);
  const [cloturerCible, setCloturerCible] = useState<Incident | null>(null);
  // Volet « Sinistre » (2026-09-29) : dossier assureur, franchise, indemnisation — gestion uniquement.
  const [sinistreCible, setSinistreCible] = useState<CibleSinistre | null>(null);
  const { session } = useAuth();
  const voitSinistres = peut(session?.role, "CONSULTER_GESTION");

  const columns: DataTableColumn<Incident>[] = [
    { key: "engin", header: "Véhicule", render: (i) => <span className="font-medium">{libelleVehicule(i.engin)}</span>, sortValue: (i) => libelleVehicule(i.engin), mobile: "titre" },
    { key: "type", header: "Type", render: (i) => i.type, sortValue: (i) => i.type },
    { key: "gravite", header: "Gravité", render: (i) => <StatutBadge statut={i.gravite} />, sortValue: (i) => RANG_GRAVITE[i.gravite] ?? null },
    { key: "survenue", header: "Survenu le", render: (i) => formatDateTime(i.dateSurvenue), sortValue: (i) => i.dateSurvenue },
    { key: "cout", header: "Coût estimé", render: (i) => formatMontant(i.coutEstime), sortValue: (i) => i.coutEstime },
    { key: "statut", header: "Statut", render: (i) => <StatutBadge statut={i.statut} />, sortValue: (i) => i.statut },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Accidents, pannes, vols et autres événements affectant le parc."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Déclarer un incident
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={incidents}
        cleMemoire="incidents"
        filtreRapide={FILTRE_STATUT_INCIDENT}
        recherche={{ texte: (i) => `${libelleVehicule(i.engin)} ${i.type} ${i.description ?? ""}`, placeholder: "Véhicule, type, description…" }}
        libelles={["incident", "incidents"]}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(i) => i.idIncident}
        rowActions={(incident) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={incident.statut === "CLOTURE"}
                onSelect={() => setAssignerCible(incident)}
              >
                Affecter un responsable
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={incident.statut === "CLOTURE"}
                onSelect={() => setCloturerCible(incident)}
              >
                Clôturer
              </DropdownMenuItem>
              {voitSinistres && incident.type !== "PANNE" && (
                <DropdownMenuItem
                  onSelect={() =>
                    setSinistreCible({
                      idIncident: incident.idIncident,
                      libelle: `${libelleVehicule(incident.engin)} — ${formatDateTime(incident.dateSurvenue)}`,
                      coutEstime: incident.coutEstime,
                    })
                  }
                >
                  Volet sinistre (assurance)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <IncidentFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <SinistreDialog cible={sinistreCible} peutModifier={peut(session?.role, "GERER_PARC")} onFermer={() => setSinistreCible(null)} />
      <IncidentActionDialogs
        assignerCible={assignerCible}
        cloturerCible={cloturerCible}
        onFermer={() => {
          setAssignerCible(null);
          setCloturerCible(null);
        }}
      />
    </div>
  );
}
