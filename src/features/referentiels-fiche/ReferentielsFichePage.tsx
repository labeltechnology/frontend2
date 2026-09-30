import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { useChangerActivationElementBord, useElementsBord } from "@/features/equipements-bord/api";
import { useChangerActivationPosteEntretien, usePostesEntretien } from "@/features/entretien/api";
import { ElementBordFormDialog } from "@/features/referentiels-fiche/ElementBordFormDialog";
import { OngletTravauxMaintenance } from "@/features/referentiels-fiche/OngletTravauxMaintenance";
import { PosteEntretienFormDialog } from "@/features/referentiels-fiche/PosteEntretienFormDialog";
import { LIBELLES_CATEGORIE_ELEMENT, LIBELLES_PORTEE } from "@/features/referentiels-fiche/libelles";
import { ApiError } from "@/lib/api-client";
import { formatNombre } from "@/lib/utils";
import type { PosteEntretien } from "@/types/entretien";
import type { ElementBord } from "@/types/equipement-bord";
import { toast } from "sonner";

/**
 * « Listes de la fiche » (ajouté le 2026-09-24) : les référentiels
 * modifiables de la fiche véhicule — éléments de bord (sécurité, boîte à
 * outils) et postes d'entretien avec leurs intervalles, pré-remplis par la
 * migration V40 avec le contenu de la fiche papier de l'utilisateur ; et
 * depuis le 2026-09-25 les travaux de maintenance (V45) proposés par
 * « Faire la maintenance » (onglet dans OngletTravauxMaintenance.tsx).
 * Réservé à GERER_PARC — DG, responsable du parc (même niveau que Types d'engin).
 */
export function ReferentielsFichePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Listes de la fiche véhicule"
        description="Éléments de sécurité, boîte à outils, postes d'entretien et travaux de maintenance proposés pour chaque véhicule. Désactiver un élément le retire des nouvelles fiches sans effacer l'historique."
      />
      <Tabs defaultValue="elements">
        <TabsList>
          <TabsTrigger value="elements">Éléments de bord</TabsTrigger>
          <TabsTrigger value="postes">Postes d'entretien</TabsTrigger>
          <TabsTrigger value="travaux">Travaux de maintenance</TabsTrigger>
        </TabsList>
        <TabsContent value="elements" className="pt-2">
          <OngletElementsBord />
        </TabsContent>
        <TabsContent value="postes" className="pt-2">
          <OngletPostesEntretien />
        </TabsContent>
        <TabsContent value="travaux" className="pt-2">
          <OngletTravauxMaintenance />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatutActif({ actif }: { actif: boolean }) {
  return actif ? <span className="text-success">Actif</span> : <span className="text-muted-foreground">Inactif</span>;
}

function OngletElementsBord() {
  const { data, isLoading, isError } = useElementsBord();
  const changerActivation = useChangerActivationElementBord();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [edite, setEdite] = useState<ElementBord | null>(null);

  const ouvrir = (element: ElementBord | null) => {
    setEdite(element);
    setDialogOuvert(true);
  };

  const basculer = async (element: ElementBord) => {
    try {
      await changerActivation.mutateAsync({ id: element.idElementBord, actif: !element.actif });
      toast.success(element.actif ? "Élément désactivé" : "Élément réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const colonnes: DataTableColumn<ElementBord>[] = [
    { key: "libelle", header: "Libellé", render: (e) => <span className="font-medium">{e.libelle}</span> },
    {
      key: "categorie",
      header: "Rubrique",
      render: (e) => (
        <Badge variant={e.categorie === "SECURITE" ? "warning" : "secondary"}>{LIBELLES_CATEGORIE_ELEMENT[e.categorie]}</Badge>
      ),
    },
    { key: "portee", header: "S'applique à", render: (e) => LIBELLES_PORTEE[e.portee] },
    { key: "ordre", header: "Ordre", render: (e) => e.ordre },
    { key: "actif", header: "Statut", render: (e) => <StatutActif actif={e.actif} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => ouvrir(null)}>
          <Plus className="h-4 w-4" />
          Nouvel élément
        </Button>
      </div>
      <DataTable
        columns={colonnes}
        data={data}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(e) => e.idElementBord}
        rowActions={(element) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions — ${element.libelle}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => ouvrir(element)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => basculer(element)}>{element.actif ? "Désactiver" : "Activer"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <ElementBordFormDialog element={edite} open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}

function OngletPostesEntretien() {
  const { data, isLoading, isError } = usePostesEntretien();
  const changerActivation = useChangerActivationPosteEntretien();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [edite, setEdite] = useState<PosteEntretien | null>(null);

  const ouvrir = (poste: PosteEntretien | null) => {
    setEdite(poste);
    setDialogOuvert(true);
  };

  const basculer = async (poste: PosteEntretien) => {
    try {
      await changerActivation.mutateAsync({ id: poste.idPosteEntretien, actif: !poste.actif });
      toast.success(poste.actif ? "Poste désactivé" : "Poste réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const intervalle = (valeur: number | null, unite: string) => (valeur == null ? "—" : `${formatNombre(valeur)} ${unite}`);

  const colonnes: DataTableColumn<PosteEntretien>[] = [
    { key: "libelle", header: "Poste", render: (p) => <span className="font-medium">{p.libelle}</span> },
    { key: "km", header: "Tous les (km)", render: (p) => intervalle(p.intervalleKm, "km") },
    { key: "heures", header: "Toutes les (h)", render: (p) => intervalle(p.intervalleHeures, "h") },
    { key: "mois", header: "Tous les (mois)", render: (p) => intervalle(p.intervalleMois, "mois") },
    { key: "portee", header: "S'applique à", render: (p) => LIBELLES_PORTEE[p.portee] },
    { key: "actif", header: "Statut", render: (p) => <StatutActif actif={p.actif} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Intervalles pré-remplis à titre indicatif : ajustez-les selon les carnets d'entretien de vos engins.
        </p>
        <Button onClick={() => ouvrir(null)}>
          <Plus className="h-4 w-4" />
          Nouveau poste
        </Button>
      </div>
      <DataTable
        columns={colonnes}
        data={data}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(p) => p.idPosteEntretien}
        rowActions={(poste) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions — ${poste.libelle}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => ouvrir(poste)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => basculer(poste)}>{poste.actif ? "Désactiver" : "Activer"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <PosteEntretienFormDialog poste={edite} open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}
