import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { useJournalAudit, type RechercheAuditParams } from "@/features/audit/api";
import { formatInstant } from "@/lib/utils";
import type { JournalAudit } from "@/types/audit";

/** Règle 14.5 : consultation du journal d'audit, réservée aux rôles habilités (voir garde de route). */
export function AuditPage() {
  const [entite, setEntite] = useState("");
  const [idUtilisateur, setIdUtilisateur] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [filtres, setFiltres] = useState<RechercheAuditParams>({});

  const { data: entrees, isLoading, isError } = useJournalAudit(filtres);

  const onRechercher = () => {
    setFiltres({
      entite: entite || undefined,
      idUtilisateur: idUtilisateur ? Number(idUtilisateur) : undefined,
      dateDebut: dateDebut ? new Date(dateDebut).toISOString() : undefined,
      dateFin: dateFin ? new Date(dateFin).toISOString() : undefined,
    });
  };

  const columns: DataTableColumn<JournalAudit>[] = [
    { key: "entite", header: "Entité", render: (j) => <span className="font-medium">{j.entite}</span> },
    { key: "idEntite", header: "Identifiant", render: (j) => j.idEntite },
    { key: "action", header: "Action", render: (j) => <StatutBadge statut={j.action} /> },
    { key: "utilisateur", header: "Utilisateur", render: (j) => j.idUtilisateur ?? "—" },
    { key: "date", header: "Date", render: (j) => formatInstant(j.dateAction) },
    { key: "details", header: "Détails", render: (j) => j.details ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Journal d'audit" description="Historique des opérations sensibles du système." />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="entite">Entité</Label>
            <Input id="entite" placeholder="Véhicule, mission…" value={entite} onChange={(e) => setEntite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idUtilisateur">Identifiant de l'utilisateur</Label>
            <Input
              id="idUtilisateur"
              type="number"
              value={idUtilisateur}
              onChange={(e) => setIdUtilisateur(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateDebut">Depuis</Label>
            <Input id="dateDebut" type="datetime-local" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFin">Jusqu'à</Label>
            <Input id="dateFin" type="datetime-local" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={onRechercher} className="w-full">
              <Search className="h-4 w-4" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={entrees} isLoading={isLoading} isError={isError} getRowKey={(j) => j.idJournalAudit} />
    </div>
  );
}
