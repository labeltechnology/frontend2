import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssignerResponsable, useCloturerIncident } from "@/features/incidents/api";
import { useUtilisateurs } from "@/features/utilisateurs/api";
import type { Incident } from "@/types/incident";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface IncidentActionDialogsProps {
  assignerCible: Incident | null;
  cloturerCible: Incident | null;
  onFermer: () => void;
}

export function IncidentActionDialogs({ assignerCible, cloturerCible, onFermer }: IncidentActionDialogsProps) {
  const { data: utilisateurs } = useUtilisateurs();
  const [idUtilisateur, setIdUtilisateur] = useState("");
  const [compteRendu, setCompteRendu] = useState("");
  const [coutEstime, setCoutEstime] = useState("");
  const assigner = useAssignerResponsable();
  const cloturer = useCloturerIncident();

  const fermer = () => {
    setIdUtilisateur("");
    setCompteRendu("");
    setCoutEstime("");
    onFermer();
  };

  const onAssigner = async () => {
    if (!assignerCible) return;
    const id = Number(idUtilisateur);
    if (!id) return toast.error("Sélectionnez un responsable");
    try {
      await assigner.mutateAsync({ id: assignerCible.idIncident, idUtilisateur: id });
      toast.success("Responsable affecté");
      fermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onCloturer = async () => {
    if (!cloturerCible) return;
    if (!compteRendu.trim()) return toast.error("Compte rendu requis");
    try {
      await cloturer.mutateAsync({
        id: cloturerCible.idIncident,
        requete: {
          compteRendu: compteRendu.trim(),
          coutEstime: coutEstime ? Number(coutEstime) : undefined,
        },
      });
      toast.success("Incident clôturé");
      fermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <>
      <Dialog open={!!assignerCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Affecter un responsable</DialogTitle>
            <DialogDescription>{libelleVehicule(assignerCible?.engin)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Responsable du traitement</Label>
            <Select value={idUtilisateur} onValueChange={setIdUtilisateur}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {utilisateurs?.map((u) => (
                  <SelectItem key={u.idUtilisateur} value={String(u.idUtilisateur)}>
                    {u.nom} {u.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={onAssigner} disabled={assigner.isPending}>
              {assigner.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Affecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cloturerCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer l'incident</DialogTitle>
            <DialogDescription>{libelleVehicule(cloturerCible?.engin)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="compteRendu">Compte rendu</Label>
              <Textarea id="compteRendu" value={compteRendu} onChange={(e) => setCompteRendu(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coutEstime">Coût estimé (facultatif)</Label>
              <Input
                id="coutEstime"
                type="number"
                step="0.01"
                min={0}
                value={coutEstime}
                onChange={(e) => setCoutEstime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onCloturer} disabled={cloturer.isPending}>
              {cloturer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
