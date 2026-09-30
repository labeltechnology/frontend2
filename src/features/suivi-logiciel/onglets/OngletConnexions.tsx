import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { useConnexions } from "@/features/suivi-logiciel/api";
import { adressesSuspectes, resumerNavigateur } from "@/features/suivi-logiciel/suivi-logiciel";
import { libelleRole } from "@/lib/droits";
import { formatDateTime } from "@/lib/utils";

/**
 * Onglet « Connexions » (2026-09-29, sécurité) : les 300 dernières
 * tentatives, web et appli, avec le motif des refus et les adresses qui
 * accumulent les échecs. Conservation : 12 mois.
 */
export function OngletConnexions({ actif }: { actif: boolean }) {
  const [echecs, setEchecs] = useState(false);
  const requete = useConnexions(echecs, actif);
  const lignes = requete.data;
  const suspectes = lignes ? adressesSuspectes(lignes) : [];

  return (
    <div className="space-y-4">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={echecs} onChange={(e) => setEchecs(e.target.checked)} />
        Afficher seulement les échecs
      </label>

      {suspectes.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-badge-dangerFg/30 bg-badge-dangerBg px-4 py-3 text-sm text-badge-dangerFg">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Adresses avec plusieurs échecs : {suspectes.map((s) => `${s.adresse} (${s.echecs})`).join(", ")}. Au-delà de 20 échecs en
            15 minutes, l'adresse est bloquée automatiquement.
          </span>
        </div>
      )}

      {!lignes ? (
        <EtatChargement enCours={requete.isPending} erreur={requete.error} />
      ) : lignes.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Aucune connexion enregistrée.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Compte</th>
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2">Résultat</th>
                <th className="px-3 py-2">Adresse</th>
                <th className="px-3 py-2">Navigateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lignes.map((l) => (
                <tr key={l.idJournalConnexion}>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatDateTime(l.dateConnexion)}</td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{l.nomUtilisateur ?? l.emailSaisi}</span>
                    <span className="block text-xs text-muted-foreground">
                      {l.nomUtilisateur ? `${l.emailSaisi} · ${libelleRole(l.role)}` : "Compte inconnu"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{l.canal === "WEB" ? "Web" : "Appli"}</td>
                  <td className="px-3 py-2">
                    {l.succes ? (
                      <Pastille libelle="Réussie" classes="bg-badge-successBg text-badge-successFg" />
                    ) : (
                      <Pastille libelle={l.motif ?? "Refusée"} classes="bg-badge-dangerBg text-badge-dangerFg" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{l.adresseIp ?? "—"}</td>
                  <td className="px-3 py-2 text-xs" title={l.navigateur ?? undefined}>
                    {resumerNavigateur(l.navigateur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
