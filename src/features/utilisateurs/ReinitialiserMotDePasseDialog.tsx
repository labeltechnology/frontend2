import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReinitialiserMotDePasse } from "@/features/mon-compte/api";
import { ChampNouveauMotDePasse, nouveauMotDePasseValide } from "@/features/mon-compte/ChampNouveauMotDePasse";
import { ApiError } from "@/lib/api-client";
import type { Utilisateur } from "@/types/utilisateur";

/**
 * Réinitialisation du mot de passe d'un compte par l'administration
 * (2026-09-29) : à transmettre de vive voix, l'utilisateur le change ensuite
 * depuis son menu. Ses sessions de l'appli conducteur sont fermées.
 */
export function ReinitialiserMotDePasseDialog({
  utilisateur,
  onOpenChange,
}: {
  utilisateur: Utilisateur | null;
  onOpenChange: (o: boolean) => void;
}) {
  const reinitialiser = useReinitialiserMotDePasse();
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const infos = { email: utilisateur?.email, nom: utilisateur?.nom, prenom: utilisateur?.prenom };

  const fermer = (o: boolean) => {
    if (!o) {
      setNouveau("");
      setConfirmation("");
    }
    onOpenChange(o);
  };

  const valider = async () => {
    if (!utilisateur) return;
    try {
      await reinitialiser.mutateAsync({ idUtilisateur: utilisateur.idUtilisateur, nouveauMotDePasse: nouveau });
      toast.success(`Mot de passe de ${utilisateur.prenom} ${utilisateur.nom} réinitialisé`);
      fermer(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Réinitialisation impossible");
    }
  };

  return (
    <Dialog open={utilisateur !== null} onOpenChange={fermer}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>
            {utilisateur?.prenom} {utilisateur?.nom} ({utilisateur?.email}). Communiquez-le de vive voix, jamais par courriel : il le
            changera depuis son menu.
          </DialogDescription>
        </DialogHeader>
        <ChampNouveauMotDePasse valeur={nouveau} onChange={setNouveau} confirmation={confirmation} onConfirmation={setConfirmation} infos={infos} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => fermer(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={valider} disabled={!nouveauMotDePasseValide(nouveau, confirmation, infos) || reinitialiser.isPending}>
            {reinitialiser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Réinitialiser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
