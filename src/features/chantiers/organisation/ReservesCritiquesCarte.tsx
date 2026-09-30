import { useMemo, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEngins } from "@/features/engins/api";
import { useReservesCritiques, useReserverEngin } from "@/features/chantiers/organisation/organisation-api";
import { ApiError } from "@/lib/api-client";
import { libelleVehicule } from "@/lib/vehicule";

/**
 * Matériel prioritaire (V64) : véhicules réservés aux chantiers de priorité
 * critique — ils ne se déposent sur aucun autre chantier.
 */
export function ReservesCritiquesCarte({ modifiable }: { modifiable: boolean }) {
  const { data: reserves } = useReservesCritiques();
  const { data: engins } = useEngins();
  const { reserver, liberer } = useReserverEngin();
  const [idEngin, setIdEngin] = useState("");
  const [motif, setMotif] = useState("");
  const dejaReserves = useMemo(() => new Set((reserves ?? []).map((r) => r.idEngin)), [reserves]);
  const proposes = (engins ?? []).filter(
    (e) => !dejaReserves.has(e.idEngin) && e.statut !== "REFORME" && e.statut !== "VENDU",
  );

  const ajouter = async () => {
    if (!idEngin) return;
    try {
      await reserver.mutateAsync({ idEngin: Number(idEngin), motif: motif.trim() || undefined });
      setIdEngin("");
      setMotif("");
      toast.success("Véhicule réservé aux chantiers critiques");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Réservation impossible");
    }
  };

  const retirer = async (id: number) => {
    try {
      await liberer.mutateAsync(id);
      toast.success("Réservation levée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Matériel réservé aux chantiers critiques
        </CardTitle>
        <CardDescription>Ces véhicules ne peuvent être prévus que sur un chantier de priorité « Critique ».</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(reserves ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aucun véhicule réservé.</p>}
        <ul className="divide-y">
          {(reserves ?? []).map((r) => (
            <li key={r.idEngin} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-medium">{r.vehicule}</span>
                {r.typeEngin && <span className="text-muted-foreground"> · {r.typeEngin}</span>}
                {r.motif && <span className="block text-xs text-muted-foreground">{r.motif}</span>}
              </span>
              {modifiable && (
                <Button type="button" size="icon" variant="ghost" aria-label={`Lever la réservation de ${r.vehicule}`}
                  onClick={() => retirer(r.idEngin)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {modifiable && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={idEngin} onValueChange={setIdEngin}>
              <SelectTrigger className="sm:w-64" aria-label="Véhicule à réserver">
                <SelectValue placeholder="Choisir un véhicule" />
              </SelectTrigger>
              <SelectContent>
                {proposes.map((e) => (
                  <SelectItem key={e.idEngin} value={String(e.idEngin)}>
                    {libelleVehicule(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Motif (facultatif)" value={motif} maxLength={255} onChange={(e) => setMotif(e.target.value)} />
            <Button type="button" variant="outline" onClick={ajouter} disabled={!idEngin || reserver.isPending}>
              Réserver
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
