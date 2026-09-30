import { PageHeader } from "@/components/data-table/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OngletMaintenances } from "@/features/maintenance/liste/OngletMaintenances";
import { OngletPieces } from "@/features/maintenance/OngletPieces";

/**
 * Page Maintenance. Depuis le 2026-09-28 : l'onglet Maintenances vit dans
 * liste/OngletMaintenances.tsx (indicateurs, filtres, fiche détaillée) et
 * l'onglet Pièces dans OngletPieces.tsx.
 */
export function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Interventions préventives et correctives, stock de pièces." />
      <Tabs defaultValue="maintenances">
        <TabsList>
          <TabsTrigger value="maintenances">Maintenances</TabsTrigger>
          <TabsTrigger value="pieces">Pièces</TabsTrigger>
        </TabsList>
        <TabsContent value="maintenances">
          <OngletMaintenances />
        </TabsContent>
        <TabsContent value="pieces">
          <OngletPieces />
        </TabsContent>
      </Tabs>
    </div>
  );
}
