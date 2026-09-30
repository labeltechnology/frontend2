import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pastille } from "@/features/fiabilite/EtatChargement";
import { telechargerModele, useApercuImport, useImporter } from "@/features/imports/api";
import { erreurFichier, STATUTS_LIGNE, TYPES_IMPORT } from "@/features/imports/imports";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ResultatImport, StatutLigneImport, TypeImport } from "@/types/importation";

/** Clés des listes rafraîchies après un import réussi. */
const LISTES: Record<TypeImport, string[]> = {
  VEHICULES: ["engins"],
  CONDUCTEURS: ["conducteurs"],
  PLEINS: ["carburant", "engins"],
};

/**
 * Import Excel / CSV (2026-09-29, question « import / export ») : modèle à
 * télécharger, aperçu ligne par ligne (rien n'est enregistré), puis import
 * tout ou rien. Chaque ligne passe par les mêmes contrôles qu'à l'écran.
 * Capacité GERER_PARC.
 */
export function ImportsPage() {
  const [type, setType] = useState<TypeImport>("VEHICULES");
  const [fichier, setFichier] = useState<File | null>(null);
  const [resultat, setResultat] = useState<ResultatImport | null>(null);
  const [filtre, setFiltre] = useState<StatutLigneImport | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const apercu = useApercuImport();
  const importer = useImporter();
  const queryClient = useQueryClient();

  const changerType = (t: TypeImport) => {
    setType(t);
    setFichier(null);
    setResultat(null);
    if (champ.current) champ.current.value = "";
  };

  const choisir = async (f: File | null) => {
    setResultat(null);
    setFiltre(null);
    setFichier(f);
    const erreur = erreurFichier(f);
    if (erreur || !f) {
      if (f) toast.error(erreur);
      return;
    }
    try {
      setResultat(await apercu.mutateAsync({ type, fichier: f }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Lecture du fichier impossible");
    }
  };

  const lancer = async () => {
    if (!fichier) return;
    try {
      const r = await importer.mutateAsync({ type, fichier });
      setResultat(r);
      if (r.enregistre) {
        toast.success(`${r.nombreLignes} ligne(s) importée(s)`);
        for (const cle of LISTES[type]) queryClient.invalidateQueries({ queryKey: [cle] });
      } else {
        toast.error("Rien n'a été importé : corrigez les erreurs puis recommencez.");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Import impossible");
    }
  };

  const modele = async () => {
    try {
      await telechargerModele(type);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Téléchargement impossible");
    }
  };

  const lignes = resultat ? resultat.lignes.filter((l) => filtre === null || l.statut === filtre) : [];
  const pret = resultat !== null && !resultat.enregistre && resultat.nombreLignes > 0 && resultat.nombreErreurs === 0 && resultat.colonnesManquantes.length === 0;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <FileUp className="h-6 w-6 text-primary" aria-hidden="true" />
          Import Excel / CSV
        </h1>
        <p className="text-sm text-muted-foreground">
          Reprendre des véhicules, des conducteurs ou un relevé de carte carburant sans ressaisie. Rien n'est enregistré tant que le fichier
          contient une erreur.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Que voulez-vous importer ?">
        {TYPES_IMPORT.map((t) => (
          <button
            key={t.cle}
            type="button"
            aria-pressed={type === t.cle}
            onClick={() => changerType(t.cle)}
            className={cn("rounded-xl border bg-card p-4 text-left shadow-sm hover:bg-muted/40", type === t.cle && "ring-2 ring-primary")}
          >
            <p className="font-medium">{t.libelle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
          </button>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Button variant="outline" onClick={modele}>
          <Download className="h-4 w-4" />
          Télécharger le modèle
        </Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {fichier ? fichier.name : "Choisir le fichier (.xlsx ou .csv)"}
          <input
            ref={champ}
            type="file"
            accept=".xlsx,.csv,.txt"
            className="sr-only"
            onChange={(e) => choisir(e.target.files?.[0] ?? null)}
          />
        </label>
        {apercu.isPending && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Vérification des lignes…
          </span>
        )}
        <Button className="ml-auto" onClick={lancer} disabled={!pret || importer.isPending}>
          {importer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Importer {resultat && !resultat.enregistre ? `${resultat.nombreLignes} ligne(s)` : ""}
        </Button>
      </section>

      {resultat && (
        <section className="space-y-3" aria-label="Résultat">
          {resultat.enregistre && (
            <p className="flex items-center gap-2 rounded-xl border bg-badge-successBg px-4 py-3 text-sm text-badge-successFg">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Import terminé : {resultat.nombreLignes} ligne(s) enregistrée(s) depuis « {resultat.fichier} ».
              {resultat.nombreAvertissements > 0 && ` ${resultat.nombreAvertissements} alerte(s) « Saisie à vérifier » créée(s).`}
            </p>
          )}
          {resultat.colonnesManquantes.length > 0 && (
            <p className="rounded-xl border bg-badge-dangerBg px-4 py-3 text-sm text-badge-dangerFg">
              Colonnes obligatoires absentes : {resultat.colonnesManquantes.join(", ")}. Partez du modèle ou renommez les en-têtes.
            </p>
          )}
          {resultat.colonnesIgnorees.length > 0 && (
            <p className="text-xs text-muted-foreground">Colonnes non reconnues, ignorées : {resultat.colonnesIgnorees.join(", ")}.</p>
          )}
          {resultat.lignes.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrer les lignes">
                <button
                  type="button"
                  aria-pressed={filtre === null}
                  onClick={() => setFiltre(null)}
                  className={cn("rounded-full border px-3 py-1 text-xs", filtre === null ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  Toutes ({resultat.nombreLignes})
                </button>
                {(["ERREUR", "AVERTISSEMENT", "OK"] as StatutLigneImport[]).map((s) => {
                  const n = s === "ERREUR" ? resultat.nombreErreurs : s === "AVERTISSEMENT" ? resultat.nombreAvertissements : resultat.nombreOk;
                  return n === 0 ? null : (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={filtre === s}
                      onClick={() => setFiltre(s)}
                      className={cn("rounded-full border px-3 py-1 text-xs", filtre === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                    >
                      {STATUTS_LIGNE[s].libelle} ({n})
                    </button>
                  );
                })}
              </div>
              <div className="max-h-[480px] overflow-auto rounded-xl border bg-card shadow-sm">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Ligne</th>
                      <th className="px-3 py-2">Élément</th>
                      <th className="px-3 py-2">Statut</th>
                      <th className="px-3 py-2">Détail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lignes.map((l) => (
                      <tr key={l.numero} className={cn(l.statut === "ERREUR" && "bg-badge-dangerBg/30")}>
                        <td className="px-3 py-2 tabular-nums">{l.numero}</td>
                        <td className="px-3 py-2">{l.libelle ?? "—"}</td>
                        <td className="px-3 py-2">
                          <Pastille libelle={STATUTS_LIGNE[l.statut].libelle} classes={STATUTS_LIGNE[l.statut].classes} />
                        </td>
                        <td className="px-3 py-2 text-xs">{l.messages.length === 0 ? "—" : l.messages.join(" ; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
