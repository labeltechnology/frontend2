import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/useAuth";
import {
  abonnementDe,
  actifsParFrequence,
  destinatairesPossibles,
  envoisDe,
  FREQUENCES,
  prochainEnvoi,
  rapportsAbonnables,
  textePeriodeEnvoi,
  textePlanning,
} from "@/features/rapports/abonnements/abonnements";
import {
  useAbonnements,
  useActiverAbonnement,
  useCreerAbonnement,
  useEnvoyerMaintenant,
  useHistoriqueEnvois,
  useParametresEnvoiRapports,
  useSupprimerAbonnement,
} from "@/features/rapports/abonnements/api";
import { useUtilisateurs } from "@/features/utilisateurs/api";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import { cn, formatDateTime } from "@/lib/utils";
import type { FrequenceEnvoi } from "@/types/diffusion";
import type { TypeRapport } from "@/types/rapport";

const MOI = "moi";
const LISTE_FREQUENCES = Object.keys(FREQUENCES) as FrequenceEnvoi[];

function messageErreur(e: unknown, defaut: string): string {
  return e instanceof ApiError ? e.message : defaut;
}

/**
 * « Recevoir par e-mail » (2026-09-29, question du DG « synthèse mensuelle
 * envoyée automatiquement ») : chaque utilisateur choisit les rapports
 * « tout le parc » qu'il reçoit en PDF, chaque semaine ou chaque mois.
 * L'administration (ADMINISTRER) peut gérer les abonnements des autres.
 * Serveur : diffusion/AbonnementService, EnvoiRapportsScheduler.
 */
export function AbonnementsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { session } = useAuth();
  const administration = peut(session?.role, "ADMINISTRER");
  const [cible, setCible] = useState<string>(MOI);
  const idCible = cible === MOI ? null : Number(cible);

  const parametres = useParametresEnvoiRapports(open);
  const abonnements = useAbonnements(idCible, open);
  const utilisateurs = useUtilisateurs(open && administration);
  const historique = useHistoriqueEnvois(administration && idCible != null, open);
  const creer = useCreerAbonnement();
  const activer = useActiverAbonnement();
  const supprimer = useSupprimerAbonnement();
  const envoyer = useEnvoyerMaintenant();

  const rapports = useMemo(() => rapportsAbonnables(), []);
  const liste = abonnements.data ?? [];
  const actifs = actifsParFrequence(liste);
  const p = parametres.data;
  const autres = useMemo(
    () => (administration ? destinatairesPossibles(utilisateurs.data ?? []).filter((u) => u.idUtilisateur !== session?.idUtilisateur) : []),
    [administration, utilisateurs.data, session?.idUtilisateur],
  );
  const envois = envoisDe(historique.data ?? [], idCible).slice(0, 10);
  const enCours = creer.isPending || activer.isPending || supprimer.isPending;

  const basculer = async (type: TypeRapport, f: FrequenceEnvoi, valeur: boolean) => {
    const existant = abonnementDe(liste, type, f);
    try {
      if (valeur) {
        if (existant) await activer.mutateAsync({ id: existant.idAbonnementRapport, valeur: true });
        else await creer.mutateAsync({ typeRapport: type, frequence: f, idUtilisateur: idCible ?? undefined });
      } else if (existant) {
        await supprimer.mutateAsync(existant.idAbonnementRapport);
      }
    } catch (e) {
      toast.error(messageErreur(e, "Modification impossible"));
    }
  };

  const envoyerMaintenant = async (f: FrequenceEnvoi) => {
    try {
      const envoi = await envoyer.mutateAsync({ frequence: f, idUtilisateur: idCible });
      toast.success(`Courriel envoyé à ${envoi.destinataire}`);
    } catch (e) {
      toast.error(messageErreur(e, "L'envoi a échoué"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setCible(MOI);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            Recevoir des rapports par courriel
          </DialogTitle>
          <DialogDescription>
            Cochez les rapports à recevoir en PDF. Chaque envoi couvre la semaine ou le mois écoulé, en un seul courriel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {administration && (
            <div className="flex flex-wrap items-center gap-3">
              <Label htmlFor="destinataireAbonnements">Abonnements de</Label>
              <Select value={cible} onValueChange={setCible}>
                <SelectTrigger id="destinataireAbonnements" className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MOI}>Moi ({session?.email})</SelectItem>
                  {autres.map((u) => (
                    <SelectItem key={u.idUtilisateur} value={String(u.idUtilisateur)}>
                      {u.prenom} {u.nom} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {p && !p.messagerieConfiguree && (
            <p className="flex items-start gap-2 rounded-xl border border-badge-warningFg/30 bg-badge-warningBg px-4 py-3 text-sm text-badge-warningFg">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              La messagerie du serveur n'est pas configurée : les abonnements sont enregistrés mais aucun courriel ne partira. Prévenez
              l'administrateur.
            </p>
          )}
          {p && p.messagerieConfiguree && !p.actif && (
            <p className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              L'envoi automatique est coupé dans{" "}
              {administration ? (
                <Link to="/parametres" className="text-primary hover:underline" onClick={() => onOpenChange(false)}>
                  Paramètres
                </Link>
              ) : (
                "Paramètres"
              )}
              . « Envoyer maintenant » reste possible.
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Rapport</th>
                  {LISTE_FREQUENCES.map((f) => (
                    <th key={f} className="w-32 px-3 py-2 text-center">
                      {FREQUENCES[f]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rapports.map((r) => (
                  <tr key={r.type}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{r.titre}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </td>
                    {LISTE_FREQUENCES.map((f) => {
                      const a = abonnementDe(liste, r.type, f);
                      return (
                        <td key={f} className="px-3 py-2 text-center">
                          <Switch
                            checked={!!a?.actif}
                            disabled={enCours || abonnements.isPending}
                            onCheckedChange={(v) => basculer(r.type, f, v)}
                            aria-label={`${r.titre} — ${FREQUENCES[f].toLowerCase()}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {LISTE_FREQUENCES.map((f) => {
              const prochain = prochainEnvoi(liste, f);
              return (
                <div key={f} className="space-y-2 rounded-xl border bg-muted/20 px-4 py-3">
                  <p className="text-sm font-medium">
                    {FREQUENCES[f]} · {actifs[f]} rapport{actifs[f] > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p ? textePlanning(p, f) : "…"}
                    {prochain && <> · prochain envoi le {formatDateTime(prochain)}</>}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actifs[f] === 0 || envoyer.isPending || (p != null && !p.messagerieConfiguree)}
                    onClick={() => envoyerMaintenant(f)}
                  >
                    {envoyer.isPending && envoyer.variables?.frequence === f ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Envoyer maintenant ({f === "HEBDOMADAIRE" ? "semaine écoulée" : "mois écoulé"})
                  </Button>
                </div>
              );
            })}
          </div>

          <section className="space-y-2" aria-labelledby="titre-derniers-envois">
            <h3 id="titre-derniers-envois" className="text-sm font-semibold">
              Derniers envois
            </h3>
            {envois.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun envoi pour l'instant.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border text-sm">
                {envois.map((e) => (
                  <li key={e.idEnvoiRapport} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                    <span>
                      {textePeriodeEnvoi(e)}
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · {e.typesRapport.length} rapport{e.typesRapport.length > 1 ? "s" : ""} · {formatDateTime(e.dateEnvoi)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        e.statut === "ENVOYE" ? "bg-badge-successBg text-badge-successFg" : "bg-badge-dangerBg text-badge-dangerFg",
                      )}
                      title={e.message ?? undefined}
                    >
                      {e.statut === "ENVOYE" ? "Envoyé" : "Échec"}
                    </span>
                    {e.statut === "ECHEC" && e.message && <p className="w-full text-xs text-badge-dangerFg">{e.message}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
