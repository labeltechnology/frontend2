import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMettreAJourParametresComptables, useParametresComptables } from "@/features/comptabilite/api";
import { CHAMPS_PLAN } from "@/features/comptabilite/comptabilite";
import { ApiError } from "@/lib/api-client";

/** Même règle que ParametresComptablesDto.CODE côté serveur. */
const code = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Obligatoire")
    .max(max, `${max} caractères maximum`)
    .regex(/^[A-Za-z0-9._-]+$/, "Lettres, chiffres, point, tiret ou souligné");

const schema = z.object({
  separateur: z.enum([";", ","]),
  journalVentes: code(10),
  journalAchats: code(10),
  journalOperationsDiverses: code(10),
  compteClients: code(20),
  compteFournisseurs: code(20),
  compteVentesLocation: code(20),
  compteTvaCollectee: code(20),
  compteCarburant: code(20),
  compteContrepartieCarburant: code(20),
  compteEntretienGarage: code(20),
  compteLocationEntrante: code(20),
  compteMaintenanceInterne: code(20),
  compteContrepartieMaintenanceInterne: code(20),
});

type Valeurs = z.infer<typeof schema>;

/**
 * Paramètres → « Export comptable » (2026-09-29) : journaux, comptes et
 * séparateur du CSV. Valeurs par défaut proches du PCG 2005, à valider avec
 * le comptable. Serveur : comptabilite/ParametresComptablesService.
 */
export function SectionComptabilite() {
  const { data, isLoading } = useParametresComptables();
  const mettreAJour = useMettreAJourParametresComptables();
  const {
    register,
    control,
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
      toast.success("Plan comptable enregistré");
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
            <Calculator className="h-5 w-5" aria-hidden />
            Export comptable
          </CardTitle>
          <CardDescription>
            Journaux et comptes utilisés par l'export des écritures (menu « Export comptable »). Faites-les valider par votre comptable
            avant le premier import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="separateurCsv">Séparateur du fichier CSV</Label>
            <Controller
              control={control}
              name="separateur"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="separateurCsv">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=";">Point-virgule « ; » (Excel français, virgule décimale)</SelectItem>
                    <SelectItem value=",">Virgule « , » (point décimal)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {CHAMPS_PLAN.map((g) => (
            <fieldset key={g.groupe} className="space-y-2">
              <legend className="text-sm font-semibold">{g.groupe}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {g.champs.map((c) => (
                  <div key={c.cle} className="space-y-1">
                    <Label htmlFor={c.cle} className="text-xs">
                      {c.libelle}
                    </Label>
                    <Input id={c.cle} className="font-mono" autoComplete="off" {...register(c.cle)} />
                    {errors[c.cle] && <p className="text-xs text-destructive">{errors[c.cle]?.message}</p>}
                  </div>
                ))}
              </div>
            </fieldset>
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
