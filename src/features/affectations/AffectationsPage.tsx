import { useState } from "react";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn, type FiltreRapide } from "@/components/data-table/DataTable";
import { optionsStatut } from "@/components/data-table/options-statut";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { AffectationFormDialog } from "@/features/affectations/AffectationFormDialog";
import { useAffectations, useAnnulerAffectation, useTerminerAffectation } from "@/features/affectations/api";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { Affectation } from "@/types/affectation";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

/** Filtre rapide par statut (2026-09-30). */
const FILTRE_STATUT_AFFECTATION: FiltreRapide<Affectation> = {
  libelle: "Filtrer par statut",
  valeur: (a) => a.statut,
  options: optionsStatut(["ACTIVE", "TERMINEE", "ANNULEE"]),
};

export function AffectationsPage() {
  const { data: affectations, isLoading, isError } = useAffectations();
  const terminer = useTerminerAffectation();
  const annuler = useAnnulerAffectation();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [annulerCible, setAnnulerCible] = useState<Affectation | null>(null);
  const [motif, setMotif] = useState("");

  const onTerminer = async (affectation: Affectation) => {
    try {
      await terminer.mutateAsync(affectation.idAffectation);
      toast.success("Affectation terminée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onValiderAnnuler = async () => {
    if (!annulerCible) return;
    if (!motif.trim()) return toast.error("Motif requis");
    try {
      await annuler.mutateAsync({ id: annulerCible.idAffectation, motifAnnulation: motif.trim() });
      toast.success("Affectation annulée");
      setAnnulerCible(null);
      setMotif("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<Affectation>[] = [
    { key: "engin", header: "Véhicule", render: (a) => <span className="font-medium">{libelleVehicule(a.engin)}</span>, sortValue: (a) => libelleVehicule(a.engin), mobile: "titre" },
    { key: "conducteur", header: "Conducteur", render: (a) => `${a.conducteur.nom} ${a.conducteur.prenom}`, sortValue: (a) => `${a.conducteur.nom} ${a.conducteur.prenom}` },
    { key: "debut", header: "Début", render: (a) => formatDate(a.dateDebut), sortValue: (a) => a.dateDebut },
    { key: "fin", header: "Fin", render: (a) => formatDate(a.dateFin), sortValue: (a) => a.dateFin },
    { key: "statut", header: "Statut", render: (a) => <StatutBadge statut={a.statut} />, sortValue: (a) => a.statut },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affectations"
        description="Liens durables entre conducteurs et véhicules."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle affectation
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={affectations}
        cleMemoire="affectations"
        filtreRapide={FILTRE_STATUT_AFFECTATION}
        recherche={{ texte: (a) => `${libelleVehicule(a.engin)} ${a.conducteur.nom} ${a.conducteur.prenom}`, placeholder: "Véhicule, conducteur…" }}
        libelles={["affectation", "affectations"]}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(a) => a.idAffectation}
        rowActions={(affectation) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={affectation.statut !== "ACTIVE"} onSelect={() => onTerminer(affectation)}>
                Terminer
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={affectation.statut !== "ACTIVE"}
                onSelect={() => setAnnulerCible(affectation)}
                className="text-destructive focus:text-destructive"
              >
                Annuler
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <AffectationFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />

      <Dialog open={!!annulerCible} onOpenChange={(open) => !open && setAnnulerCible(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler l'affectation</DialogTitle>
            <DialogDescription>{libelleVehicule(annulerCible?.engin)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motifAnnulation">Motif d'annulation</Label>
            <Input id="motifAnnulation" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={onValiderAnnuler} disabled={annuler.isPending}>
              {annuler.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Annuler l'affectation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
