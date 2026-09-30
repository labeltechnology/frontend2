import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Save, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { texteMinutes } from "@/features/fiabilite/fiabilite";
import { useMettreAJourParametresFatigue, useParametresFatigue } from "@/features/parametres/api-fatigue";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const entier = (min: number, max: number) =>
  z.coerce.number().int("Nombre entier").min(min, `${min} minimum`).max(max, `${max} maximum`);

const schema = z
  .object({
    actif: z.boolean(),
    conduiteContinueMaxMinutes: entier(60, 720),
    pauseMinimaleMinutes: entier(10, 240),
    conduiteJournaliereMaxMinutes: entier(120, 1080),
  })
  .refine((v) => v.conduiteContinueMaxMinutes <= v.conduiteJournaliereMaxMinutes, {
    message: "Doit être au moins égale à la conduite continue",
    path: ["conduiteJournaliereMaxMinutes"],
  });

type Valeurs = z.infer<typeof schema>;

const CHAMPS: { cle: Exclude<keyof Valeurs, "actif">; libelle: string; aide: string }[] = [
  { cle: "conduiteContinueMaxMinutes", libelle: "Conduite continue maximale (minutes)", aide: "Par défaut 270 (4 h 30)." },
  { cle: "pauseMinimaleMinutes", libelle: "Pause minimale (minutes)", aide: "Un arrêt au moins aussi long remet la conduite continue à zéro. Par défaut 45." },
  { cle: "conduiteJournaliereMaxMinutes", libelle: "Conduite maximale par jour (minutes)", aide: "Par défaut 540 (9 h)." },
];

/** Paramètres → « Fatigue au volant » (2026-09-29). Règle serveur : conformite/fatigue/CalculFatigue. */
export function SectionFatigue() {
  const { data, isLoading } = useParametresFatigue();
  const mettreAJour = useMettreAJourParametresFatigue();
  const {
    register,
    control,
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
      toast.success("Seuils de fatigue enregistrés");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  if (isLoading) return <Skeleton className="h-56 w-full" />;
  const continue_ = Number(watch("conduiteContinueMaxMinutes"));
  const jour = Number(watch("conduiteJournaliereMaxMinutes"));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" aria-hidden />
            Fatigue au volant
          </CardTitle>
          <CardDescription>
            Calculée toutes les 15 minutes sur les positions GPS en mouvement. Un dépassement crée une alerte « Temps de conduite dépassé »
            pour le conducteur de la mission (ou de l'affectation).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="actif"
              render={({ field }) => <Switch id="fatigueActive" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="fatigueActive">Surveillance active</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {CHAMPS.map((c) => (
              <div key={c.cle} className="space-y-2">
                <Label htmlFor={c.cle}>{c.libelle}</Label>
                <Input id={c.cle} type="number" step={5} {...register(c.cle)} />
                <p className="text-xs text-muted-foreground">{c.aide}</p>
                {errors[c.cle] && <p className="text-sm text-destructive">{errors[c.cle]?.message}</p>}
              </div>
            ))}
          </div>
          {Number.isFinite(continue_) && Number.isFinite(jour) && continue_ > 0 && jour > 0 && (
            <p className="text-sm text-muted-foreground">
              Soit {texteMinutes(continue_)} sans pause et {texteMinutes(jour)} par jour.
            </p>
          )}
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
