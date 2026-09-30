import { useState } from "react";
import { Copy, Loader2, Plus, RefreshCw, Send, Trash2, Webhook as IconeWebhook } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pastille } from "@/features/fiabilite/EtatChargement";
import {
  useCreerWebhook,
  useLivraisonsWebhook,
  useModifierWebhook,
  useRenouvelerSecret,
  useSupprimerWebhook,
  useTesterWebhook,
  useWebhooks,
} from "@/features/parametres/api-webhooks";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import type { LivraisonWebhook, Webhook } from "@/types/webhook";

function erreur(e: unknown, defaut: string) {
  toast.error(e instanceof ApiError ? e.message : defaut);
}

/**
 * Paramètres → « Webhooks » (2026-09-29, question « intégrations ») : les
 * alertes critiques (et celles escaladées en critique) sont envoyées en JSON
 * signé vers les adresses choisies (n8n, messagerie d'équipe, autre logiciel).
 * Le secret de signature n'est montré qu'une fois.
 */
export function SectionWebhooks() {
  const { data: webhooks } = useWebhooks();
  const creer = useCreerWebhook();
  const modifier = useModifierWebhook();
  const renouveler = useRenouvelerSecret();
  const supprimer = useSupprimerWebhook();
  const tester = useTesterWebhook();
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [secretMontre, setSecretMontre] = useState<Webhook | null>(null);
  const [historique, setHistorique] = useState<number | null>(null);

  const ajouter = async () => {
    try {
      const w = (await creer.mutateAsync({ nom: nom.trim(), url: url.trim(), actif: true })) as Webhook;
      setSecretMontre(w);
      setNom("");
      setUrl("");
    } catch (e) {
      erreur(e, "Ajout impossible");
    }
  };

  const essayer = async (w: Webhook) => {
    try {
      const l = (await tester.mutateAsync(w.idWebhook)) as LivraisonWebhook;
      if (l.succes) toast.success(`« ${w.nom} » a bien reçu le test (${l.dureeMs} ms)`);
      else toast.error(`« ${w.nom} » : ${l.message ?? "échec"}`);
      setHistorique(w.idWebhook);
    } catch (e) {
      erreur(e, "Test impossible");
    }
  };

  const copier = async (texte: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      toast.success("Secret copié");
    } catch {
      toast.error("Copie impossible : sélectionnez le texte à la main");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconeWebhook className="h-5 w-5" aria-hidden />
          Webhooks des alertes critiques
        </CardTitle>
        <CardDescription>
          Chaque alerte critique est envoyée (POST JSON) aux adresses ci-dessous, signée avec l'en-tête X-ParkAuto-Signature
          (HMAC-SHA256 de « horodatage.corps »). Trois tentatives en cas d'échec.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {secretMontre?.secret && (
          <div className="space-y-2 rounded-xl border border-badge-warningFg/30 bg-badge-warningBg px-4 py-3 text-sm text-badge-warningFg">
            <p className="font-medium">Secret de « {secretMontre.nom} » : copiez-le maintenant, il ne sera plus affiché.</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-background px-2 py-1 font-mono text-xs text-foreground">{secretMontre.secret}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => copier(secretMontre.secret ?? "")}>
                <Copy className="h-4 w-4" />
                Copier
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSecretMontre(null)}>
                C'est noté
              </Button>
            </div>
          </div>
        )}

        {(webhooks ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun webhook.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border">
            {(webhooks ?? []).map((w) => (
              <li key={w.idWebhook} className="space-y-2 px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Switch
                    checked={w.actif}
                    aria-label={`Activer ${w.nom}`}
                    onCheckedChange={(v) => modifier.mutateAsync({ id: w.idWebhook, nom: w.nom, url: w.url, actif: v }).catch((e) => erreur(e, "Modification impossible"))}
                  />
                  <span className="font-medium">{w.nom}</span>
                  {!w.chiffre && <Pastille libelle="Non chiffré (http)" classes="bg-badge-warningBg text-badge-warningFg" />}
                  <span className="ml-auto flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => essayer(w)} disabled={tester.isPending}>
                      {tester.isPending && tester.variables === w.idWebhook ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Tester
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setHistorique(historique === w.idWebhook ? null : w.idWebhook)}>
                      Envois
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          setSecretMontre((await renouveler.mutateAsync(w.idWebhook)) as Webhook);
                        } catch (e) {
                          erreur(e, "Renouvellement impossible");
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Nouveau secret
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Supprimer ${w.nom}`}
                      onClick={() => supprimer.mutateAsync(w.idWebhook).catch((e) => erreur(e, "Suppression impossible"))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </span>
                </div>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {w.url} · secret {w.secretMasque}
                </p>
                {historique === w.idWebhook && <Livraisons idWebhook={w.idWebhook} />}
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="nomWebhook">Nom</Label>
            <Input id="nomWebhook" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="n8n alertes" maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="urlWebhook">Adresse</Label>
            <Input id="urlWebhook" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" maxLength={500} />
          </div>
          <Button type="button" onClick={ajouter} disabled={!nom.trim() || !url.trim() || creer.isPending}>
            {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Livraisons({ idWebhook }: { idWebhook: number }) {
  const { data, isPending } = useLivraisonsWebhook(idWebhook);
  if (isPending) return <p className="text-xs text-muted-foreground">Chargement…</p>;
  if (!data || data.length === 0) return <p className="text-xs text-muted-foreground">Aucun envoi.</p>;
  return (
    <table className="w-full text-xs">
      <thead className="text-left text-muted-foreground">
        <tr>
          <th className="py-1">Date</th>
          <th className="py-1">Événement</th>
          <th className="py-1">Tentative</th>
          <th className="py-1">Résultat</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {data.map((l) => (
          <tr key={l.idLivraisonWebhook}>
            <td className="py-1 tabular-nums">{formatDateTime(l.dateLivraison)}</td>
            <td className="py-1">{l.evenement === "test" ? "Test" : `Alerte n° ${l.idAlerte ?? "?"}`}</td>
            <td className="py-1 tabular-nums">{l.tentative}</td>
            <td className={l.succes ? "py-1 text-badge-successFg" : "py-1 text-badge-dangerFg"}>
              {l.message}
              {l.dureeMs !== null && ` · ${l.dureeMs} ms`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
