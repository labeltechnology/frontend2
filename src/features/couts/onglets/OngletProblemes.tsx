import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useVehiculesProblematiques } from "@/features/couts/api";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { NIVEAUX_PROBLEME } from "@/features/couts/couts";
import { nombreFr, texteCoutUnitaire, texteEcart } from "@/features/performance/performance";
import { ApiError } from "@/lib/api-client";
import { cn, formatDate } from "@/lib/utils";
import { accord, pluriel } from "@/lib/pluriel";
import type { NiveauProbleme } from "@/types/couts";

const FILTRES: { cle: NiveauProbleme | "TOUS"; libelle: string }[] = [
  { cle: "TOUS", libelle: "Tous" },
  { cle: "A_REMPLACER", libelle: "À remplacer" },
  { cle: "A_SURVEILLER", libelle: "À surveiller" },
];

/**
 * Onglet « Véhicules à problèmes » : 12 derniers mois glissants, coût de
 * maintenance par km (ou h) comparé à la moyenne du type, pannes, âge et
 * compteur ; seuils réglables dans Paramètres.
 */
export function OngletProblemes({ actif, peutRegler }: { actif: boolean; peutRegler: boolean }) {
  const requete = useVehiculesProblematiques(actif);
  const [filtre, setFiltre] = useState<NiveauProbleme | "TOUS">("TOUS");
  const donnees = requete.data;
  const affiches = useMemo(
    () => (donnees?.vehicules ?? []).filter((v) => filtre === "TOUS" || v.niveau === filtre),
    [donnees, filtre],
  );

  if (requete.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Calcul en cours…
      </p>
    );
  }
  if (requete.isError || !donnees) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {requete.error instanceof ApiError ? requete.error.message : "Calcul impossible pour le moment."}
      </p>
    );
  }
  const s = donnees.seuils;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CarteChiffre titre="À remplacer" valeur={donnees.nombreARemplacer} classeValeur={donnees.nombreARemplacer > 0 ? "text-badge-dangerFg" : undefined} />
        <CarteChiffre titre="À surveiller" valeur={donnees.nombreASurveiller} classeValeur={donnees.nombreASurveiller > 0 ? "text-badge-warningFg" : undefined} />
        <CarteChiffre titre="Véhicules évalués" valeur={donnees.vehicules.length} />
        <CarteChiffre titre="Période" valeur={<span className="text-base">12 derniers mois</span>} precision={`Du ${formatDate(donnees.debut)} au ${formatDate(donnees.fin)}`} />
      </div>

      <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">À surveiller</strong> : maintenance par km (ou h) plus de {s.ecartSurveillancePourcent} % au-dessus de la
        moyenne du type, ou au moins {s.pannesSurveillance} pannes. <strong className="text-foreground">À remplacer</strong> : plus de{" "}
        {s.ecartRemplacementPourcent} %, au moins {s.pannesRemplacement} pannes, {s.ageRemplacementAns} ans ou plus,{" "}
        {nombreFr(s.kilometrageRemplacement)} km ou {nombreFr(s.heuresRemplacement)} h au compteur.
        {peutRegler && (
          <>
            {" "}
            <Link to="/parametres" className="text-primary hover:underline">
              Régler les seuils
            </Link>
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par étiquette">
        {FILTRES.map((f) => {
          const nombre = f.cle === "TOUS" ? donnees.vehicules.length : donnees.vehicules.filter((v) => v.niveau === f.cle).length;
          return (
            <button
              key={f.cle}
              type="button"
              aria-pressed={filtre === f.cle}
              onClick={() => setFiltre(f.cle)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filtre === f.cle ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.libelle} <span className="tabular-nums">({nombre})</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Véhicule</th>
              <th className="px-3 py-2">Étiquette</th>
              <th className="px-3 py-2 text-right">Maintenance / km ou h</th>
              <th className="px-3 py-2 text-right">Moyenne du type</th>
              <th className="px-3 py-2 text-right">Écart</th>
              <th className="px-3 py-2 text-right">Pannes</th>
              <th className="px-3 py-2 text-right">Âge</th>
              <th className="px-3 py-2 text-right">Compteur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {affiches.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Aucun véhicule dans cette catégorie.</td>
              </tr>
            )}
            {affiches.map((v) => (
              <tr key={v.idEngin} className="align-top">
                <td className="px-3 py-2">
                  <Link to={`/engins/${v.idEngin}/rapport`} className="font-medium hover:underline">
                    {v.libelleVehicule}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{v.libelleType}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", NIVEAUX_PROBLEME[v.niveau].classes)}>
                    {NIVEAUX_PROBLEME[v.niveau].libelle}
                  </span>
                  {v.motifs.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {v.motifs.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{texteCoutUnitaire(v.coutMaintenanceParUnite, v.uniteUsage)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{texteCoutUnitaire(v.moyenneType, v.uniteUsage)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{texteEcart(v.ecartPourcent) ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums" title={`${pluriel(v.pannes, "panne déclarée", "pannes déclarées")}, ${pluriel(v.reparationsCorrectives, "réparation corrective", "réparations correctives")}`}>
                  {v.pannesRetenues}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{v.ageAns === null ? "—" : `${nombreFr(v.ageAns, 1)} ${accord(v.ageAns, "an")}`}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {nombreFr(v.compteur)} {v.uniteUsage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
