import { useState } from "react";
import { CloudSun, NotebookPen, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { JourneeJournalDialog } from "@/features/chantiers/journal/JourneeJournalDialog";
import { journalChantierKeys, useJournalChantier, useSupprimerJournee } from "@/features/chantiers/journal/journal-api";
import { useSuppressionAnnulable } from "@/components/confirmation/useSuppressionAnnulable";
import {
  formatHeures,
  jourLocal,
  journeeParDefaut,
  LIBELLES_METEO,
  refusEcriture,
} from "@/features/chantiers/journal/journal-chantier";
import { formatDate } from "@/lib/utils";
import type { Chantier, JournalChantier } from "@/types/chantier";

/**
 * Onglet « Journal » de la fiche chantier (2026-09-29) : une carte par
 * journée (la plus récente d'abord), rédaction et modification réservées à
 * la gestion du parc, pendant le chantier et jusqu'à 7 jours après sa fin.
 */
export function OngletJournalChantier({ chantier, peutEcrire }: { chantier: Chantier; peutEcrire: boolean }) {
  const { data: journaux, isLoading, isError } = useJournalChantier(chantier.idChantier);
  const supprimer = useSupprimerJournee(chantier.idChantier);
  const [edition, setEdition] = useState<{ journee: JournalChantier | null } | null>(null);

  const aujourdhui = jourLocal(new Date());
  const refus = refusEcriture(chantier, aujourdhui);
  const ecriture = peutEcrire && refus === null;
  const jourPropose = journeeParDefaut(chantier, journaux ?? [], aujourdhui);

  // Confirmation, puis « Annuler » pendant 8 s (2026-09-30, remplace window.confirm).
  const supprimerAnnulable = useSuppressionAnnulable();
  const surSupprimer = (j: JournalChantier) =>
    supprimerAnnulable<JournalChantier>({
      titre: `Supprimer la journée du ${formatDate(j.dateJour)} ?`,
      message: "La journée et ses photos seront supprimées. Vous pourrez annuler pendant quelques secondes.",
      libelleFait: `Journée du ${formatDate(j.dateJour)} supprimée`,
      cles: [journalChantierKeys.liste(chantier.idChantier)],
      estVise: (x) => x.idJournal === j.idJournal,
      supprimer: () => supprimer.mutateAsync(j.idJournal),
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {refus && peutEcrire ? refus : "Météo, travaux, incidents, heures des véhicules et photos, jour par jour."}
        </p>
        {ecriture && (
          <Button type="button" disabled={!jourPropose} onClick={() => setEdition({ journee: null })}>
            <Plus className="h-4 w-4" />
            Nouvelle journée
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement du journal…</p>}
      {isError && <p className="text-sm text-destructive">Impossible de charger le journal.</p>}
      {journaux && journaux.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          <NotebookPen className="h-8 w-8" aria-hidden="true" />
          Aucune journée rédigée.
        </div>
      )}

      <ul className="space-y-3">
        {(journaux ?? []).map((j) => (
          <li key={j.idJournal} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold">{formatDate(j.dateJour)}</h3>
              {j.meteo && (
                <Badge variant="outline" className="gap-1">
                  <CloudSun className="h-3.5 w-3.5" aria-hidden="true" />
                  {LIBELLES_METEO[j.meteo]}
                </Badge>
              )}
              {j.effectif != null && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {j.effectif} pers.
                </Badge>
              )}
              {j.totalHeures > 0 && <Badge variant="outline">{formatHeures(j.totalHeures)} de véhicules</Badge>}
              {ecriture && (
                <span className="ml-auto flex gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={`Modifier la journée du ${formatDate(j.dateJour)}`} onClick={() => setEdition({ journee: j })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Supprimer la journée du ${formatDate(j.dateJour)}`} onClick={() => surSupprimer(j)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              )}
            </div>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
              {j.travauxRealises && (
                <div className="sm:col-span-3">
                  <dt className="text-xs text-muted-foreground">Travaux réalisés</dt>
                  <dd className="whitespace-pre-line">{j.travauxRealises}</dd>
                </div>
              )}
              {j.incidents && (
                <div className="sm:col-span-3">
                  <dt className="text-xs text-destructive">Incidents</dt>
                  <dd className="whitespace-pre-line">{j.incidents}</dd>
                </div>
              )}
              {j.remarques && (
                <div className="sm:col-span-3">
                  <dt className="text-xs text-muted-foreground">Remarques</dt>
                  <dd className="whitespace-pre-line">{j.remarques}</dd>
                </div>
              )}
            </dl>
            {j.engins.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {j.engins.map((e) => `${e.vehicule} : ${formatHeures(e.heures)}`).join(" · ")}
              </p>
            )}
            {j.photos.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {j.photos.map((p) => (
                  <li key={p.idPhoto}>
                    <AuthenticatedImage url={p.urlFichier} alt={p.legende ?? `Photo du ${formatDate(j.dateJour)}`} className="h-20 w-full rounded-md" />
                    {p.legende && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{p.legende}</p>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {edition && (
        <JourneeJournalDialog
          chantier={chantier}
          journaux={journaux ?? []}
          journee={edition.journee}
          jourPropose={jourPropose}
          open
          onOpenChange={(o) => !o && setEdition(null)}
        />
      )}
    </div>
  );
}
