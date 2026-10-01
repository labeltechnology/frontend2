import { useMemo, useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScoresConduite } from "@/features/couts/api";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { NIVEAUX_CONDUITE, derniersMois, libelleMois, moisDe } from "@/features/couts/couts";
import { nombreFr } from "@/features/performance/performance";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Onglet « Conduite » : score mensuel sur 100 par conducteur. Survitesses
 * (positions GPS au-dessus de la vitesse maximale du type) et manœuvres
 * brusques (alarmes Traccar), ramenées à 100 km.
 */
export function OngletConduite({ actif }: { actif: boolean }) {
  const liste = useMemo(() => derniersMois(new Date(), 12), []);
  const [mois, setMois] = useState(moisDe(new Date()));
  const requete = useScoresConduite(mois, actif);
  const donnees = requete.data;

  return (
    <div className="space-y-5">
      <Select value={mois} onValueChange={setMois}>
        <SelectTrigger className="h-9 w-48" aria-label="Mois">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {liste.map((m) => (
            <SelectItem key={m} value={m}>
              {libelleMois(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {requete.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calcul en cours…
        </p>
      )}
      {requete.isError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {requete.error instanceof ApiError ? requete.error.message : "Calcul impossible pour le moment."}
        </p>
      )}

      {donnees && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <CarteChiffre titre="Score moyen" valeur={donnees.scoreMoyen === null ? "—" : `${donnees.scoreMoyen}/100`} precision="Pondéré par les km" />
            <CarteChiffre titre="Bons" valeur={donnees.nombreBons} />
            <CarteChiffre titre="À surveiller" valeur={donnees.nombreASurveiller} classeValeur={donnees.nombreASurveiller > 0 ? "text-badge-warningFg" : undefined} />
            <CarteChiffre titre="À former" valeur={donnees.nombreAFormer} classeValeur={donnees.nombreAFormer > 0 ? "text-badge-dangerFg" : undefined} />
            <CarteChiffre titre="Événements sans conducteur" valeur={donnees.evenementsNonAttribues} precision="Ni mission ni affectation" />
          </div>

          <p className="flex gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Score = 100 − 5 × points pour 100 km (survitesse 3 points, accélération, freinage ou virage brusque 2 points). Pas de score sous
              50 km dans le mois. Bon ≥ 85, à surveiller ≥ 70, à former en dessous.
              {!donnees.alarmesTraccarRecues &&
                " Aucune alarme de manœuvre brusque n'a encore été reçue de Traccar : il est possible que les boîtiers n'envoient pas ce type d'alarme ; dans ce cas, seule la survitesse est prise en compte."}
            </span>
          </p>

          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Conducteur</th>
                  <th className="px-3 py-2 text-right">Km</th>
                  <th className="px-3 py-2 text-right">Survitesses</th>
                  <th className="px-3 py-2 text-right">Accélérations</th>
                  <th className="px-3 py-2 text-right">Freinages</th>
                  <th className="px-3 py-2 text-right">Virages</th>
                  <th className="px-3 py-2 text-right">Points / 100 km</th>
                  <th className="px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {donnees.conducteurs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Aucune mission ni aucun événement en {libelleMois(donnees.mois)}.
                    </td>
                  </tr>
                )}
                {donnees.conducteurs.map((c) => {
                  const niveau = NIVEAUX_CONDUITE[c.niveau];
                  return (
                    <tr key={c.idConducteur}>
                      <td className="px-3 py-2">
                        <span className="font-medium">{c.nom}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.matricule ? `${c.matricule} · ` : ""}
                          {c.missions} mission{c.missions > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{nombreFr(c.kilometres)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.survitesses}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.accelerations}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.freinages}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.virages}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.pointsPour100Km === null ? "—" : nombreFr(c.pointsPour100Km, 1)}</td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-[170px] items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                            {c.score !== null && <div className={cn("h-full rounded-full", niveau.barre)} style={{ width: `${c.score}%` }} />}
                          </div>
                          <span className="w-12 text-right tabular-nums">{c.score === null ? "—" : c.score}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", niveau.classes)}>{niveau.libelle}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
