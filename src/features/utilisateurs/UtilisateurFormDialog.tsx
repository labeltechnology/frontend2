import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useAuth } from "@/features/auth/useAuth";
import { useCreerUtilisateur } from "@/features/utilisateurs/api";
import { ApiError } from "@/lib/api-client";
import { LIBELLES_ROLE, ROLES, rolesAttribuables } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";
import { toast } from "sonner";

const schema = z.object({
  nom: z.string().min(1, "Requis"),
  prenom: z.string().min(1, "Requis"),
  email: z.string().min(1, "Requis").email("Email invalide"),
  motDePasse: z.string().min(12, "12 caractères minimum (politique de mot de passe, 2026-09-29)"),
  libelleRole: z.enum(ROLES as readonly [RoleLibelle, ...RoleLibelle[]]),
});

type FormValues = z.infer<typeof schema>;

interface UtilisateurFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UtilisateurFormDialog({ open, onOpenChange }: UtilisateurFormDialogProps) {
  const creerUtilisateur = useCreerUtilisateur();
  const { session } = useAuth();
  // DG et Administrateur ne sont proposés qu'à un DG ou un administrateur (le serveur refuse sinon).
  const rolesProposes = rolesAttribuables(session?.role);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { libelleRole: "CONDUCTEUR" } });

  useEffect(() => {
    if (!open) reset({ libelleRole: "CONDUCTEUR" });
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await creerUtilisateur.mutateAsync(values);
      toast.success("Utilisateur créé");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer l'utilisateur");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Règle 1.9 : comptes gérés par le DG, le responsable du parc et l'administrateur. Seuls le DG et
            l'administrateur attribuent les rôles DG et Administrateur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" {...register("nom")} />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" {...register("prenom")} />
              {errors.prenom && <p className="text-sm text-destructive">{errors.prenom.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <Input id="motDePasse" type="password" autoComplete="new-password" {...register("motDePasse")} />
            <p className="text-xs text-muted-foreground">
              Au moins 12 caractères, ni mot courant, ni nom, prénom ou e-mail. À changer par l'utilisateur à sa première connexion.
            </p>
            {errors.motDePasse && <p className="text-sm text-destructive">{errors.motDePasse.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={watch("libelleRole")} onValueChange={(v) => setValue("libelleRole", v as RoleLibelle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rolesProposes.map((role) => (
                  <SelectItem key={role} value={role}>
                    {LIBELLES_ROLE[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
