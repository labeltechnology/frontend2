import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  motDePasse: z.string().min(1, "Le mot de passe est requis"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { seConnecter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [erreur, setErreur] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setErreur(null);
    try {
      await seConnecter(values);
      const destination = (location.state as { depuis?: Location })?.depuis?.pathname ?? "/";
      navigate(destination, { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        setErreur(e.message);
      } else {
        setErreur("Connexion impossible — vérifie ton email et ton mot de passe.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <CardTitle>ParcAuto</CardTitle>
          <CardDescription>Connecte-toi pour accéder à la gestion du parc</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <Input id="motDePasse" type="password" autoComplete="current-password" {...register("motDePasse")} />
              {errors.motDePasse && <p className="text-sm text-destructive">{errors.motDePasse.message}</p>}
            </div>
            {erreur && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erreur}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
