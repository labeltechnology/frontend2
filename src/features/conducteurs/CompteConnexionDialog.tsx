import { useEffect, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComptesDisponibles, useLierCompte } from "@/features/conducteurs/api-compte";
import { ApiError } from "@/lib/api-client";
import type { Conducteur } from "@/types/conducteur";
import { toast } from "sonner";

/** Radix Select n'accepte pas de valeur vide : sentinelle pour « aucun compte ». */
const AUCUN = "aucun";

interface CompteConnexionDialogProps {
  conducteur: Conducteur | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * « Compte de connexion » d'une fiche conducteur (2026-09-28) : le compte
 * utilisé dans l'appli mobile. Seuls les comptes actifs de rôle Conducteur
 * non encore reliés sont proposés (règle vérifiée aussi par le serveur).
 * Retirer le compte coupe l'appli de ce conducteur.
 */
export function CompteConnexionDialog({ conducteur, onOpenChange }: CompteConnexionDialogProps) {
  const ouvert = conducteur !== null;
  const { data: comptes, isLoading, isError } = useComptesDisponibles(conducteur?.idConducteur ?? null);
  const lier = useLierCompte();
  const [choix, setChoix] = useState<string>(AUCUN);

  useEffect(() => {
    if (conducteur) {
      setChoix(conducteur.idUtilisateur != null ? String(conducteur.idUtilisateur) : AUCUN);
    }
  }, [conducteur]);

  if (!conducteur) {
    return null;
  }

  const actuel = conducteur.idUtilisateur != null ? String(conducteur.idUtilisateur) : AUCUN;
  const inchange = choix === actuel;

  const enregistrer = async () => {
    try {
      await lier.mutateAsync({
        idConducteur: conducteur.idConducteur,
        idUtilisateur: choix === AUCUN ? null : Number(choix),
      });
      toast.success(choix === AUCUN ? "Compte retiré : l'appli mobile est coupée pour ce conducteur" : "Compte relié");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" aria-hidden />
            Compte de connexion
          </DialogTitle>
          <DialogDescription>
            {conducteur.matricule} — {conducteur.nom} {conducteur.prenom}. Le compte choisi ouvre l'appli mobile : missions,
            véhicule, pleins, incidents et messagerie de ce conducteur uniquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Compte</Label>
          <Select value={choix} onValueChange={setChoix} disabled={isLoading || isError}>
            <SelectTrigger aria-label="Compte de connexion">
              <SelectValue placeholder={isLoading ? "Chargement…" : "Choisir un compte"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUCUN}>Aucun compte (pas d'accès à l'appli)</SelectItem>
              {(comptes ?? []).map((c) => (
                <SelectItem key={c.idUtilisateur} value={String(c.idUtilisateur)}>
                  {c.nomComplet} — {c.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isError && <p className="text-sm text-destructive">Liste des comptes indisponible.</p>}
          {!isLoading && !isError && (comptes ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun compte libre : créez d'abord un utilisateur de rôle « Conducteur » (menu Utilisateurs).
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={enregistrer} disabled={inchange || lier.isPending}>
            {lier.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
