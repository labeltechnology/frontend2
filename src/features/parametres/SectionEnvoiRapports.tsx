import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2, Loader2, Mail, Save, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { FREQUENCES, JOURS_SEMAINE, textePeriodeEnvoi, textePlanning } from "@/features/rapports/abonnements/abonnements";
import {
  useEnvoyerTest,
  useHistoriqueEnvois,
  useMettreAJourParametresEnvoi,
  useParametresEnvoiRapports,
} from "@/features/rapports/abonnements/api";
import { ApiError } from "@/lib/api-client";
import { cn, formatDateTime } from "@/lib/utils";

const entier = (min: number, max: number) =>
  z.coerce.number().int("Nombre entier").min(min, `${min} minimum`).max(max, `${max} maximum`);

const schema = z.object({
  actif: z.boolean(),
  jourSemaine: entier(1, 7),
  jourMois: entier(1, 28),
  heure: entier(0, 23),
});

type Valeurs = z.infer<typeof schema>;

/**
 * Paramètres → « Rapports par e-mail » (2026-09-29) : planning des envois
 * automatiques, état de la messagerie (variables d'environnement SPRING_MAIL_*
 * côté serveur, jamais saisies ici), e-mail d'essai et historique de tous les
 * envois. Serveur : diffusion/ParametresEnvoiRapportsController.
 */
export function SectionEnvoiRapports() {
  const { data, isLoading } = useParametresEnvoiRapports();
  const historique = useHistoriqueEnvois(true);
  const mettreAJour = useMettreAJourParametresEnvoi();
  const test = useEnvoyerTest();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Valeurs>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) reset({ actif: data.actif, jourSemaine: data.jourSemaine, jourMois: data.jourMois, heure: data.heure });
  }, [data, reset]);

  const onSubmit = async (valeurs: Valeurs) => {
    try {
      await mettreAJour.mutateAsync(valeurs);
      toast.success("Planning des envois enregistré");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const envoyerTest = async () => {
    try {
      const envoi = await test.mutateAsync();
      toast.success(`E-mail d'essai envoyé à ${envoi.destinataire}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "L'e-mail d'essai n'est pas parti");
    }
  };

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;
  const apercu = {
    jourSemaine: Number(watch("jourSemaine")) || data.jourSemaine,
    jourMois: Number(watch("jourMois")) || data.jourMois,
    heure: Number.isFinite(Number(watch("heure"))) ? Number(watch("heure")) : data.heure,
  };
  const envois = historique.data ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" aria-hidden />
            Rapports par e-mail
          </CardTitle>
          <CardDescription>
            Chaque utilisateur choisit ses rapports depuis la page Rapports (« Recevoir par e-mail »). Le serveur envoie un seul e-mail par
            personne avec les PDF de la semaine ou du mois écoulé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm",
              data.messagerieConfiguree ? "bg-badge-successBg text-badge-successFg" : "bg-badge-warningBg text-badge-warningFg",
            )}
          >
            {data.messagerieConfiguree ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden />
            )}
            {data.messagerieConfiguree ? (
              <span>
                Messagerie configurée · expéditeur <strong>{data.expediteur || "—"}</strong>
              </span>
            ) : (
              <span>
                Messagerie non configurée : renseigner SPRING_MAIL_HOST, SPRING_MAIL_PORT, SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD et
                APP_MAIL_EXPEDITEUR sur le serveur, puis redémarrer.
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              disabled={!data.messagerieConfiguree || test.isPending}
              onClick={envoyerTest}
            >
              {test.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              M'envoyer un e-mail d'essai
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="actif"
              render={({ field }) => <Switch id="envoiRapportsActif" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="envoiRapportsActif">Envoi automatique actif</Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="jourSemaine">Jour des envois hebdomadaires</Label>
              <Controller
                control={control}
                name="jourSemaine"
                render={({ field }) => (
                  <Select value={String(field.value ?? "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="jourSemaine">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOURS_SEMAINE.map((j, i) => (
                        <SelectItem key={j} value={String(i + 1)}>
                          {j.charAt(0).toUpperCase() + j.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jourMois">Jour du mois (1 à 28)</Label>
              <Input id="jourMois" type="number" min={1} max={28} {...register("jourMois")} />
              {errors.jourMois && <p className="text-sm text-destructive">{errors.jourMois.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="heureEnvoi">Heure (0 à 23, heure du serveur)</Label>
              <Input id="heureEnvoi" type="number" min={0} max={23} {...register("heure")} />
              {errors.heure && <p className="text-sm text-destructive">{errors.heure.message}</p>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {FREQUENCES.HEBDOMADAIRE} : {textePlanning(apercu, "HEBDOMADAIRE").toLowerCase()}. {FREQUENCES.MENSUELLE} :{" "}
            {textePlanning(apercu, "MENSUELLE").toLowerCase()}. Un envoi manqué (serveur arrêté) part au redémarrage ; après 3 échecs pour
            une même période, le serveur n'insiste plus.
          </p>

          <section className="space-y-2" aria-labelledby="titre-historique-envois">
            <h3 id="titre-historique-envois" className="text-sm font-semibold">
              Historique des envois (tous les utilisateurs)
            </h3>
            {envois.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun envoi pour l'instant.</p>
            ) : (
              <div className="max-h-72 overflow-auto rounded-xl border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Destinataire</th>
                      <th className="px-3 py-2">Période</th>
                      <th className="px-3 py-2 text-right">Rapports</th>
                      <th className="px-3 py-2">Résultat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {envois.map((e) => (
                      <tr key={e.idEnvoiRapport}>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatDateTime(e.dateEnvoi)}</td>
                        <td className="px-3 py-2">{e.destinataire}</td>
                        <td className="px-3 py-2">{textePeriodeEnvoi(e)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{e.typesRapport.length}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              e.statut === "ENVOYE" ? "bg-badge-successBg text-badge-successFg" : "bg-badge-dangerBg text-badge-dangerFg",
                            )}
                          >
                            {e.statut === "ENVOYE" ? "Envoyé" : "Échec"}
                          </span>
                          {e.statut === "ECHEC" && e.message && <span className="block text-xs text-badge-dangerFg">{e.message}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
