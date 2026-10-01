import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ImageOff, Loader2, Map as IconCarte, Satellite, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/data-table/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import {
  useMettreAJourParametresEntreprise,
  useMettreAJourParametresMapbox,
  useMettreAJourParametresTraccar,
  useParametresEntreprise,
  useParametresMapbox,
  useParametresTraccar,
  useSupprimerLogo,
  useTeleverserLogo,
} from "@/features/parametres/api";
import { SectionControleCarburant } from "@/features/parametres/SectionControleCarburant";
import { SectionEnvoiRapports } from "@/features/parametres/SectionEnvoiRapports";
import { SectionEscaladeAlertes } from "@/features/parametres/SectionEscaladeAlertes";
import { SectionVehiculesProblematiques } from "@/features/parametres/SectionVehiculesProblematiques";
import { SectionWebhooks } from "@/features/parametres/SectionWebhooks";
import { SectionFatigue } from "@/features/parametres/SectionFatigue";
import { SectionComptabilite } from "@/features/comptabilite/SectionComptabilite";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const schema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().optional(),
  nif: z.string().optional(),
  stat: z.string().optional(),
  tauxTvaPourcent: z.coerce.number().min(0, "Doit être positif").max(100, "Ne peut pas dépasser 100"),
  banqueNom: z.string().optional(),
  banqueIban: z.string().optional(),
  banqueBic: z.string().optional(),
  mentionsPied: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const traccarSchema = z.object({
  actif: z.boolean(),
  urlServeur: z.string().min(1, "L'URL du serveur est obligatoire"),
  jetonApi: z.string().optional(),
  intervalleSyncMs: z.coerce.number().int().positive("Doit être un nombre de millisecondes positif"),
});

type TraccarFormValues = z.infer<typeof traccarSchema>;

const mapboxSchema = z.object({
  actif: z.boolean(),
});

type MapboxFormValues = z.infer<typeof mapboxSchema>;

/**
 * Écran Paramètres — nom de l'entreprise, identifiants fiscaux (NIF/STAT),
 * taux de TVA et coordonnées bancaires, réservé à ADMINISTRER — administrateur,
 * DG, responsable du parc (lib/droits.ts, 2026-09-28). Ces valeurs pilotent l'en-tête et le bloc
 * « Règlement » des factures de location et des factures proforma — voir
 * ParametresEntreprise côté backend.
 */
export function ParametresPage() {
  const { data: parametres, isLoading } = useParametresEntreprise();
  const mettreAJour = useMettreAJourParametresEntreprise();
  const televerserLogo = useTeleverserLogo();
  const supprimerLogo = useSupprimerLogo();
  const inputLogoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (parametres) {
      reset({
        nom: parametres.nom,
        adresse: parametres.adresse ?? "",
        telephone: parametres.telephone ?? "",
        email: parametres.email ?? "",
        nif: parametres.nif ?? "",
        stat: parametres.stat ?? "",
        tauxTvaPourcent: parametres.tauxTvaPourcent,
        banqueNom: parametres.banqueNom ?? "",
        banqueIban: parametres.banqueIban ?? "",
        banqueBic: parametres.banqueBic ?? "",
        mentionsPied: parametres.mentionsPied ?? "",
      });
    }
  }, [parametres, reset]);

  // Section séparée du formulaire principal (endpoint propre, mutation
  // propre) — même principe que le logo ci-dessus : un bouton
  // « Enregistrer » qui lui est propre, indépendant des champs
  // entreprise/TVA/banque au-dessus.
  const { data: parametresTraccar, isLoading: isLoadingTraccar } = useParametresTraccar();
  const mettreAJourTraccar = useMettreAJourParametresTraccar();

  const {
    control: controlTraccar,
    register: registerTraccar,
    handleSubmit: handleSubmitTraccar,
    reset: resetTraccar,
    formState: { isSubmitting: isSubmittingTraccar, isDirty: isDirtyTraccar },
  } = useForm<TraccarFormValues>({ resolver: zodResolver(traccarSchema) });

  useEffect(() => {
    if (parametresTraccar) {
      resetTraccar({
        actif: parametresTraccar.actif,
        urlServeur: parametresTraccar.urlServeur,
        jetonApi: "",
        intervalleSyncMs: parametresTraccar.intervalleSyncMs,
      });
    }
  }, [parametresTraccar, resetTraccar]);

  const onSubmitTraccar = async (values: TraccarFormValues) => {
    try {
      await mettreAJourTraccar.mutateAsync({
        actif: values.actif,
        urlServeur: values.urlServeur,
        jetonApi: values.jetonApi || undefined,
        intervalleSyncMs: values.intervalleSyncMs,
      });
      toast.success("Paramètres Traccar enregistrés");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  // Section séparée, même principe que Traccar ci-dessus (endpoint propre,
  // mutation propre, bouton « Enregistrer » indépendant).
  const { data: parametresMapbox, isLoading: isLoadingMapbox } = useParametresMapbox();
  const mettreAJourMapbox = useMettreAJourParametresMapbox();

  const {
    control: controlMapbox,
    handleSubmit: handleSubmitMapbox,
    reset: resetMapbox,
    formState: { isSubmitting: isSubmittingMapbox, isDirty: isDirtyMapbox },
  } = useForm<MapboxFormValues>({ resolver: zodResolver(mapboxSchema) });

  useEffect(() => {
    if (parametresMapbox) {
      resetMapbox({
        actif: parametresMapbox.actif,
      });
    }
  }, [parametresMapbox, resetMapbox]);

  const onSubmitMapbox = async (values: MapboxFormValues) => {
    try {
      await mettreAJourMapbox.mutateAsync({
        actif: values.actif,
      });
      toast.success("Paramètres de la vue satellite enregistrés");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  // Action séparée du formulaire principal (même principe que la galerie de photos d'engin / le
  // proforma garage) : un fichier choisi part immédiatement, sans attendre le bouton « Enregistrer »
  // qui ne porte que sur les champs texte/TVA ci-dessous.
  const onFichierLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = ""; // permet de reséléctionner le même fichier ensuite (ex. après une erreur)
    if (!fichier) return;
    try {
      await televerserLogo.mutateAsync(fichier);
      toast.success("Logo mis à jour");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi du logo impossible");
    }
  };

  const onSupprimerLogo = async () => {
    try {
      await supprimerLogo.mutateAsync();
      toast.success("Logo supprimé");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await mettreAJour.mutateAsync({
        nom: values.nom,
        adresse: values.adresse || undefined,
        telephone: values.telephone || undefined,
        email: values.email || undefined,
        nif: values.nif || undefined,
        stat: values.stat || undefined,
        tauxTvaPourcent: values.tauxTvaPourcent,
        banqueNom: values.banqueNom || undefined,
        banqueIban: values.banqueIban || undefined,
        banqueBic: values.banqueBic || undefined,
        mentionsPied: values.mentionsPied || undefined,
      });
      toast.success("Paramètres enregistrés");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Identité de l'entreprise, taux de TVA, coordonnées bancaires, intégrations, contrôle de consommation carburant et escalade des alertes."
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entreprise</CardTitle>
              <CardDescription>Affiché en en-tête des factures de location et des factures pro forma.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nom">Nom de l'entreprise</Label>
                <Input id="nom" {...register("nom")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" {...register("adresse")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" {...register("telephone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse électronique</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input id="nif" {...register("nif")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stat">STAT</Label>
                <Input id="stat" {...register("stat")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Affiché en haut à droite des factures de location et des factures pro forma, à côté du nom de
                l'entreprise. Formats acceptés : JPEG, PNG, WEBP (5 Mo maximum).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              {parametres?.logoUrl ? (
                <AuthenticatedImage
                  url={parametres.logoUrl}
                  alt="Logo de l'entreprise"
                  className="h-20 w-32 rounded-md border bg-white object-contain"
                />
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                {parametres?.nomFichierLogoOriginal && (
                  <span className="text-sm text-muted-foreground">
                    Fichier actuel : {parametres.nomFichierLogoOriginal}
                  </span>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputLogoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onFichierLogoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputLogoRef.current?.click()}
                    disabled={televerserLogo.isPending}
                  >
                    {televerserLogo.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {parametres?.logoUrl ? "Remplacer" : "Téléverser un logo"}
                  </Button>
                  {parametres?.logoUrl && (
                    <Button type="button" variant="ghost" onClick={onSupprimerLogo} disabled={supprimerLogo.isPending}>
                      {supprimerLogo.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TVA</CardTitle>
              <CardDescription>
                Appliqué à chaque facture de location et facture pro forma émise ensuite — figé sur les factures déjà
                émises, jamais recalculé après coup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs space-y-2">
                <Label htmlFor="tauxTvaPourcent">Taux de TVA (%)</Label>
                <Input id="tauxTvaPourcent" type="number" min={0} max={100} step="0.01" {...register("tauxTvaPourcent")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées bancaires</CardTitle>
              <CardDescription>Affichées dans le bloc « Règlement » des factures.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="banqueNom">Banque</Label>
                <Input id="banqueNom" {...register("banqueNom")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banqueIban">IBAN</Label>
                <Input id="banqueIban" {...register("banqueIban")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banqueBic">BIC</Label>
                <Input id="banqueBic" {...register("banqueBic")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mention de pied de page</CardTitle>
              <CardDescription>
                Texte libre affiché en bas des factures (ex. pénalités de retard, conditions générales).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea id="mentionsPied" rows={3} {...register("mentionsPied")} />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      {isLoadingTraccar && <Skeleton className="h-64 w-full" />}

      {!isLoadingTraccar && (
        <form onSubmit={handleSubmitTraccar(onSubmitTraccar)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Satellite className="h-5 w-5" />
                Intégration GPS (Traccar)
              </CardTitle>
              <CardDescription>
                Connexion à un serveur Traccar auto-hébergé pour importer automatiquement les positions GPS déjà
                décodées (voir la documentation du dossier <code>traccar/</code>). Un changement ici prend effet au
                cycle de synchronisation suivant, sans redémarrer le backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 sm:col-span-2">
                <Controller
                  control={controlTraccar}
                  name="actif"
                  render={({ field }) => (
                    <Switch id="traccarActif" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="traccarActif">Activer l'intégration Traccar</Label>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="urlServeur">URL du serveur Traccar</Label>
                <Input id="urlServeur" placeholder="http://localhost:8082" {...registerTraccar("urlServeur")} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="jetonApi">Jeton API</Label>
                <Input
                  id="jetonApi"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    parametresTraccar?.jetonConfigure
                      ? `Configuré (${parametresTraccar.jetonApercu}) — laisser vide pour conserver le jeton actuel`
                      : "Compte → Jetons API dans l'interface Traccar"
                  }
                  {...registerTraccar("jetonApi")}
                />
                <p className="text-sm text-muted-foreground">
                  Jamais réaffiché en clair une fois enregistré — laisse ce champ vide pour conserver le jeton actuel.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalleSyncMs">Intervalle de synchronisation (millisecondes)</Label>
                <Input
                  id="intervalleSyncMs"
                  type="number"
                  min={1000}
                  step={1000}
                  {...registerTraccar("intervalleSyncMs")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmittingTraccar || !isDirtyTraccar}>
              {isSubmittingTraccar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      {isLoadingMapbox && <Skeleton className="h-64 w-full" />}

      {!isLoadingMapbox && (
        <form onSubmit={handleSubmitMapbox(onSubmitMapbox)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCarte className="h-5 w-5" />
                Vue satellite (Esri World Imagery)
              </CardTitle>
              <CardDescription>
                Imagerie satellite des cartes de chantier — fournisseur Esri World Imagery (remplace Mapbox depuis le
                22/09/2026, quota gratuit Mapbox atteint). Gratuit et sans jeton à configurer : il suffit d'activer
                l'interrupteur ci-dessous. Les noms de lieux (villes, villages) affichés par-dessus sont une couche
                séparée (OpenStreetMap), indépendante de ce réglage.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 sm:col-span-2">
                <Controller
                  control={controlMapbox}
                  name="actif"
                  render={({ field }) => (
                    <Switch id="mapboxActif" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="mapboxActif">Activer la vue satellite</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmittingMapbox || !isDirtyMapbox}>
              {isSubmittingMapbox ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      <SectionControleCarburant />

      <SectionEscaladeAlertes />

      <SectionVehiculesProblematiques />

      <SectionFatigue />

      <SectionEnvoiRapports />

      <SectionComptabilite />

      <SectionWebhooks />
    </div>
  );
}
