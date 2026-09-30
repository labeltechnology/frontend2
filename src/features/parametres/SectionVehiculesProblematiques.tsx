import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMettreAJourParametresVehiculesProblematiques,
  useParametresVehiculesProblematiques,
} from "@/features/parametres/api-vehicules-problematiques";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const entier = (min: number, max: number) =>
  z.coerce.number().int("Nombre entier").min(min, `${min} minimum`).max(max, `${max} maximum`);

const schema = z
  .object({
    ecartSurveillancePourcent: entier(5, 500),
    ecartRemplacementPourcent: entier(5, 500),
    pannesSurveillance: entier(1, 50),
    pannesRemplacement: entier(1, 50),
    ageRemplacementAns: entier(1, 50),
    kilometrageRemplacement: entier(1000, 5000000),
    heuresRemplacement: entier(100, 200000),
  })
  .refine((v) => v.ecartSurveillancePourcent <= v.ecartRemplacementPourcent, {
    message: "Doit être au moins égal au seuil « à surveiller »",
    path: ["ecartRemplacementPourcent"],
  })
  .refine((v) => v.pannesSurveillance <= v.pannesRemplacement, {
    message: "Doit être au moins égal au seuil « à surveiller »",
    path: ["pannesRemplacement"],
  });

type Valeurs = z.infer<typeof schema>;

const CHAMPS: { cle: keyof Valeurs; libelle: string; aide?: string }[] = [
  { cle: "ecartSurveillancePourcent", libelle: "À surveiller : écart de maintenance (%)", aide: "Coût par km (ou h) au-dessus de la moyenne du type." },
  { cle: "ecartRemplacementPourcent", libelle: "À remplacer : écart de maintenance (%)" },
  { cle: "pannesSurveillance", libelle: "À surveiller : pannes sur 12 mois" },
  { cle: "pannesRemplacement", libelle: "À remplacer : pannes sur 12 mois" },
  { cle: "ageRemplacementAns", libelle: "À remplacer : âge (ans)", aide: "Depuis la mise en circulation." },
  { cle: "kilometrageRemplacement", libelle: "À remplacer : km au compteur" },
  { cle: "heuresRemplacement", libelle: "À remplacer : heures au compteur (engins)" },
];

/** Paramètres → « Véhicules à surveiller ou à remplacer » (2026-09-29). Règle serveur : cout/problematique/EvaluationProblemes. */
export function SectionVehiculesProblematiques() {
  const { data, isLoading } = useParametresVehiculesProblematiques();
  const mettreAJour = useMettreAJourParametresVehiculesProblematiques();
  const {
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
      toast.success("Seuils enregistrés");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" aria-hidden />
            Véhicules à surveiller ou à remplacer
          </CardTitle>
          <CardDescription>
            Évaluation sur les 12 derniers mois (page Coûts et rentabilité). Un seul critère dépassé suffit pour l'étiquette.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {CHAMPS.map((c) => (
            <div key={c.cle} className="space-y-2">
              <Label htmlFor={c.cle}>{c.libelle}</Label>
              <Input id={c.cle} type="number" step={1} {...register(c.cle)} />
              {c.aide && <p className="text-xs text-muted-foreground">{c.aide}</p>}
              {errors[c.cle] && <p className="text-sm text-destructive">{errors[c.cle]?.message}</p>}
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
