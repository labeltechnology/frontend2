import { useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { useAdoption } from "@/features/suivi-logiciel/api";
import { ACTIVITES, classeTaux, libelleMoisAdoption, texteTaux } from "@/features/suivi-logiciel/suivi-logiciel";
import { ApiError } from "@/lib/api-client";
import { libelleRole } from "@/lib/droits";
import { exporterExcel } from "@/lib/export-excel";
import { accord, pluriel } from "@/lib/pluriel";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ActiviteUtilisateur } from "@/types/suivi-logiciel";

type Filtre = "TOUS" | ActiviteUtilisateur;

/**
 * Onglet « Adoption » (2026-09-29, question « taux d'adoption ») : comptes
 * connectés sur 30 jours, évolution sur 6 mois, par rôle et par personne.
 */
export function OngletAdoption({ actif }: { actif: boolean }) {
  const requete = useAdoption(actif);
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const a = requete.data;
  const utilisateurs = useMemo(() => (a ? a.utilisateurs.filter((u) => filtre === "TOUS" || u.activite === filtre) : []), [a, filtre]);

  if (!a) return <EtatChargement enCours={requete.isPending} erreur={requete.error} />;
  const maxConnectes = Math.max(1, ...a.mois.map((m) => m.comptesActifs));

  const exporter = async () => {
    try {
      await exporterExcel({
        titre: "Adoption du logiciel — utilisateurs",
        sousTitre: "30 derniers jours",
        colonnes: [
          { libelle: "Nom", format: "TEXTE" },
          { libelle: "Adresse électronique", format: "TEXTE" },
          { libelle: "Rôle", format: "TEXTE" },
          { libelle: "Activité", format: "TEXTE" },
          { libelle: "Dernière connexion", format: "TEXTE" },
          { libelle: "Connexions", format: "NOMBRE" },
          { libelle: "Saisies", format: "NOMBRE" },
        ],
        lignes: utilisateurs.map((u) => [u.nom, u.email, libelleRole(u.role), ACTIVITES[u.activite].libelle,
          u.derniereConnexion ? formatDateTime(u.derniereConnexion) : "", u.connexions, u.saisies]),
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export impossible");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CarteChiffre
          titre="Taux d'adoption (30 jours)"
          valeur={texteTaux(a.tauxAdoption)}
          classeValeur={classeTaux(a.tauxAdoption)}
          precision={`${pluriel(a.utilisateursConnectes, "compte")} sur ${a.comptesActifs} ${accord(a.utilisateursConnectes, "connecté")}`}
        />
        <CarteChiffre titre="Comptes actifs" valeur={a.comptesActifs} />
        <CarteChiffre titre="Connexions (30 jours)" valeur={a.connexions} precision={`Dont ${texteTaux(a.partMobile)} depuis l'application`} />
        <CarteChiffre titre="Saisies (30 jours)" valeur={a.saisies} precision="Créations et modifications" />
      </div>
      <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Connexions comptées {a.debutJournalConnexions ? `depuis le ${formatDate(a.debutJournalConnexions)}` : "à partir de la mise en service du journal"} ;
        saisies tirées du journal d'audit. Un compte est « inactif » s'il ne s'est pas connecté depuis 30 jours.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2 rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-adoption-mois">
          <h2 id="titre-adoption-mois" className="font-display text-lg font-semibold">Par mois</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-1.5">Mois</th>
                <th className="py-1.5">Comptes connectés</th>
                <th className="py-1.5 text-right">Connexions</th>
                <th className="py-1.5 text-right">Saisies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {a.mois.map((m) => (
                <tr key={m.mois}>
                  <td className="py-1.5">{libelleMoisAdoption(m.mois)}</td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(m.utilisateursConnectes / maxConnectes) * 100}%` }} />
                      </div>
                      <span className="tabular-nums">
                        {m.utilisateursConnectes} ({texteTaux(m.tauxAdoption)})
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{m.connexions}</td>
                  <td className="py-1.5 text-right tabular-nums">{m.saisies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="space-y-2 rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-adoption-roles">
          <h2 id="titre-adoption-roles" className="font-display text-lg font-semibold">Par rôle (30 jours)</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-1.5">Rôle</th>
                <th className="py-1.5 text-right">Connectés</th>
                <th className="py-1.5 text-right">Connexions</th>
                <th className="py-1.5 text-right">Saisies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {a.roles.map((r) => (
                <tr key={r.role}>
                  <td className="py-1.5">{libelleRole(r.role)}</td>
                  <td className={`py-1.5 text-right tabular-nums ${classeTaux(r.tauxAdoption) ?? ""}`}>
                    {r.connectes}/{r.comptesActifs} ({texteTaux(r.tauxAdoption)})
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{r.connexions}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.saisies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="space-y-2" aria-labelledby="titre-adoption-utilisateurs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titre-adoption-utilisateurs" className="font-display text-lg font-semibold">Utilisateurs</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrer par activité">
              {(["TOUS", "ACTIF", "INACTIF", "JAMAIS"] as Filtre[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filtre === f}
                  onClick={() => setFiltre(f)}
                  className={`rounded-full border px-3 py-1 text-xs ${filtre === f ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {f === "TOUS" ? `Tous (${a.utilisateurs.length})` : `${ACTIVITES[f].libelle} (${a.utilisateurs.filter((u) => u.activite === f).length})`}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exporter} disabled={utilisateurs.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Utilisateur</th>
                <th className="px-3 py-2">Rôle</th>
                <th className="px-3 py-2">Activité</th>
                <th className="px-3 py-2">Dernière connexion</th>
                <th className="px-3 py-2 text-right">Connexions</th>
                <th className="px-3 py-2 text-right">Saisies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {utilisateurs.map((u) => (
                <tr key={u.idUtilisateur}>
                  <td className="px-3 py-2">
                    <span className="font-medium">{u.nom}</span>
                    <span className="block text-xs text-muted-foreground">{u.email}</span>
                  </td>
                  <td className="px-3 py-2">{libelleRole(u.role)}</td>
                  <td className="px-3 py-2">
                    <Pastille libelle={ACTIVITES[u.activite].libelle} classes={ACTIVITES[u.activite].classes} />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{u.derniereConnexion ? formatDateTime(u.derniereConnexion) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{u.connexions}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{u.saisies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
