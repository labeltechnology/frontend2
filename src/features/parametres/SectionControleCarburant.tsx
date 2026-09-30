import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Fuel, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMettreAJourParametresCarburant, useParametresCarburant } from "@/features/parametres/api-carburant";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const schema = z.object({
  seuilDepassementPourcent: z.coerce.number().int("Nombre entier").min(5, "5 % minimum").max(200, "200 % maximum"),
  toleranceLitres: z.coerce.number().min(0, "Doit être positif").max(50, "50 L maximum"),
});

type Valeurs = z.infer<typeof schema>;

/**
 * Paramètres → « Contrôle de consommation » (2026-09-28). Chaque saisie
 * carburant (plein, appoint, bidon) est comparée, en L/100 km, à la
 * consommation de référence du véhicule (fiche technique) ou à défaut à sa
 * moyenne habituelle. Règle serveur : carburant/ControleConsommation.
 */
export function SectionControleCarburant() {
  const { data, isLoading } = useParametresCarburant();
  const mettreAJour = useMettreAJourParametresCarburant();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Valeurs>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const onSubmit = async (valeurs: Valeurs) => {
    try {
      await mettreAJour.mutateAsync(valeurs);
      toast.success("Contrôle de consommation enregistré");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  const seuil = Number(watch("seuilDepassementPourcent")) || 0;
  const exemple = (8 * (1 + seuil / 100)).toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" aria-hidden />
            Contrôle de consommation carburant
          </CardTitle>
          <CardDescription>
            Chaque plein, appoint ou bidon est comparé en L/100 km à la consommation de référence du véhicule (fiche
            technique), ou à défaut à sa moyenne habituelle. Au-delà du seuil, une alerte « consommation anormale » est
            créée. Exemple : pour une référence de 8 L/100 km, alerte au-delà de {exemple} L/100 km.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seuilDepassementPourcent">Dépassement toléré (%)</Label>
            <Input id="seuilDepassementPourcent" type="number" min={5} max={200} step={1} {...register("seuilDepassementPourcent")} />
            {errors.seuilDepassementPourcent && (
              <p className="text-sm text-destructive">{errors.seuilDepassementPourcent.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="toleranceLitres">Tolérance (litres)</Label>
            <Input id="toleranceLitres" type="number" min={0} max={50} step={0.5} {...register("toleranceLitres")} />
            <p className="text-xs text-muted-foreground">
              Litres ignorés : complément après l'arrêt automatique de la pompe.
            </p>
            {errors.toleranceLitres && <p className="text-sm text-destructive">{errors.toleranceLitres.message}</p>}
          </div>
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
