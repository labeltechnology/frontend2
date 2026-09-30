import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignerZoneOperation, useRetirerZoneOperation } from "@/features/engins/api";
import { useZones } from "@/features/zones/api";
import { ApiError } from "@/lib/api-client";
import type { Engin } from "@/types/engin";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface ZonesOperationDialogProps {
  engin: Engin | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Règle 7.4 : zones d'opération autorisées d'un engin — plusieurs zones
 * possibles par engin (choix confirmé avec l'utilisateur, ex. un engin
 * partagé entre plusieurs chantiers d'une même région). Seules les zones de
 * type AUTORISEE ont un sens ici : une zone INTERDITE est surveillée
 * globalement, indépendamment de tout engin (voir GpsService côté backend).
 */
export function ZonesOperationDialog({ engin, onOpenChange }: ZonesOperationDialogProps) {
  const { data: zones } = useZones();
  const assigner = useAssignerZoneOperation();
  const retirer = useRetirerZoneOperation();
  const [idZoneSelectionnee, setIdZoneSelectionnee] = useState<string>("");

  const zonesAutorisees = zones?.filter((z) => z.type === "AUTORISEE") ?? [];
  const idsAssignees = new Set(engin?.zonesOperation.map((z) => z.idZoneGeographique) ?? []);
  const zonesDisponibles = zonesAutorisees.filter((z) => !idsAssignees.has(z.idZoneGeographique));

  const onAssigner = async () => {
    if (!engin || !idZoneSelectionnee) return;
    try {
      await assigner.mutateAsync({ idEngin: engin.idEngin, idZone: Number(idZoneSelectionnee) });
      setIdZoneSelectionnee("");
      toast.success("Zone d'opération assignée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Assignation impossible");
    }
  };

  const onRetirer = async (idZone: number) => {
    if (!engin) return;
    try {
      await retirer.mutateAsync({ idEngin: engin.idEngin, idZone });
      toast.success("Zone d'opération retirée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Retrait impossible");
    }
  };

  return (
    <Dialog open={!!engin} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Zones d'opération</DialogTitle>
          <DialogDescription>
            {libelleVehicule(engin)}. Une alerte est déclenchée si l'engin sort de TOUTES ses
            zones d'opération autorisées à la fois.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Select value={idZoneSelectionnee} onValueChange={setIdZoneSelectionnee}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Choisir une zone autorisée à assigner" />
            </SelectTrigger>
            <SelectContent>
              {zonesDisponibles.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Aucune zone autorisée disponible</div>
              )}
              {zonesDisponibles.map((zone) => (
                <SelectItem key={zone.idZoneGeographique} value={String(zone.idZoneGeographique)}>
                  {zone.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAssigner} disabled={!idZoneSelectionnee || assigner.isPending}>
            Assigner
          </Button>
        </div>

        <div className="space-y-2">
          {(!engin || engin.zonesOperation.length === 0) && (
            <p className="text-sm text-muted-foreground">Aucune zone d'opération assignée — ce véhicule n'est pas surveillé sur ce plan.</p>
          )}
          {engin?.zonesOperation.map((zone) => (
            <div key={zone.idZoneGeographique} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{zone.nom}</span>
                {!zone.actif && <Badge variant="outline">Zone désactivée</Badge>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Retirer cette zone"
                disabled={retirer.isPending}
                onClick={() => onRetirer(zone.idZoneGeographique)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
