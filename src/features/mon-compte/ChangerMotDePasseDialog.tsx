import { useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { useChangerMonMotDePasse } from "@/features/mon-compte/api";
import { ChampNouveauMotDePasse, nouveauMotDePasseValide } from "@/features/mon-compte/ChampNouveauMotDePasse";
import { ApiError } from "@/lib/api-client";

/** « Changer mon mot de passe » (menu utilisateur, 2026-09-29). */
export function ChangerMotDePasseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { session } = useAuth();
  const changer = useChangerMonMotDePasse();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const infos = { email: session?.email };
  const valide = ancien.length > 0 && nouveauMotDePasseValide(nouveau, confirmation, infos);

  const fermer = (o: boolean) => {
    if (!o) {
      setAncien("");
      setNouveau("");
      setConfirmation("");
    }
    onOpenChange(o);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await changer.mutateAsync({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      toast.success("Mot de passe changé");
      fermer(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Changement impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={fermer}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            Changer mon mot de passe
          </DialogTitle>
          <DialogDescription>Les sessions de l'appli conducteur de ce compte seront fermées.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ancienMotDePasse">Mot de passe actuel</Label>
            <Input id="ancienMotDePasse" type="password" autoComplete="current-password" value={ancien} onChange={(e) => setAncien(e.target.value)} />
          </div>
          <ChampNouveauMotDePasse valeur={nouveau} onChange={setNouveau} confirmation={confirmation} onConfirmation={setConfirmation} infos={infos} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => fermer(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!valide || changer.isPending}>
              {changer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
