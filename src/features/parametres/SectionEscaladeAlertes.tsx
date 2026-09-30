import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { BellRing, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useMettreAJourParametresEscaladeAlertes, useParametresEscaladeAlertes } from "@/features/parametres/api-escalade";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const jours = z.coerce.number().int("Nombre entier de jours").min(0, "0 minimum").max(365, "365 maximum");
const schema = z.object({
  actif: z.boolean(),
  joursFaibleVersMoyenne: jours,
  joursMoyenneVersElevee: jours,
  joursEleveeVersCritique: jours,
});
type Valeurs = z.infer<typeof schema>;

const PALIERS: { champ: "joursFaibleVersMoyenne" | "joursMoyenneVersElevee" | "joursEleveeVersCritique"; libelle: string }[] = [
  { champ: "joursFaibleVersMoyenne", libelle: "Faible → Moyenne" },
  { champ: "joursMoyenneVersElevee", libelle: "Moyenne → Élevée" },
  { champ: "joursEleveeVersCritique", libelle: "Élevée → Critique" },
];

/**
 * Paramètres → « Escalade des alertes non traitées » (2026-09-28). Une alerte
 * non traitée monte d'un niveau après le délai de son niveau, compté depuis
 * sa création puis depuis le dernier palier, jusqu'à Critique (notification
 * immédiate). Règle serveur : alerte/escalade/RegleEscalade, contrôle horaire.
 */
export function SectionEscaladeAlertes() {
  const { data, isLoading } = useParametresEscaladeAlertes();
  const mettreAJour = useMettreAJourParametresEscaladeAlertes();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Valeurs>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const onSubmit = async (valeurs: Valeurs) => {
    try {
      await mettreAJour.mutateAsync(valeurs);
      toast.success("Escalade des alertes enregistrée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" aria-hidden />
            Escalade des alertes non traitées
          </CardTitle>
          <CardDescription>
            Une alerte non traitée monte d'un niveau après le délai indiqué, compté depuis sa création puis depuis le
            palier précédent, jusqu'à Critique (notification immédiate). Contrôle toutes les heures. 0 jour = ce niveau
            ne monte pas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 sm:col-span-3">
            <Controller
              control={control}
              name="actif"
              render={({ field }) => <Switch id="escaladeActive" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="escaladeActive">Activer l'escalade</Label>
          </div>
          {PALIERS.map(({ champ, libelle }) => (
            <div key={champ} className="space-y-2">
              <Label htmlFor={champ}>{libelle} (jours)</Label>
              <Input id={champ} type="number" min={0} max={365} step={1} {...register(champ)} />
              {errors[champ] && <p className="text-sm text-destructive">{errors[champ]?.message}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
