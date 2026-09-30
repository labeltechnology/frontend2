import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeEcart } from "@/features/performance/sections/BadgeEcart";
import { Jauge } from "@/features/performance/sections/TableauTypes";
import {
  CLASSEMENTS,
  FILTRES_VEHICULES,
  TRIS_VEHICULES,
  compterParFiltre,
  nombreFr,
  texteCoutUnitaire,
  usageVehicule,
  vehiculesAffiches,
  type FiltreVehicules,
  type TriVehicules,
} from "@/features/performance/performance";
import { cn } from "@/lib/utils";
import type { PerformanceVehicule, SyntheseTypePerformance } from "@/types/performance";

/**
 * Détail par véhicule : jours utilisés, taux (avec le seuil du type), usage,
 * coûts, coût unitaire comparé à la référence, et état (sous-utilisé, en trop).
 */
export function TableauVehicules({ vehicules, types }: { vehicules: PerformanceVehicule[]; types: SyntheseTypePerformance[] }) {
  const [filtre, setFiltre] = useState<FiltreVehicules>("TOUS");
  const [tri, setTri] = useState<TriVehicules>("TAUX_CROISSANT");
  const [recherche, setRecherche] = useState("");
  const comptes = useMemo(() => compterParFiltre(vehicules), [vehicules]);
  const affiches = useMemo(() => vehiculesAffiches(vehicules, filtre, recherche, tri), [vehicules, filtre, recherche, tri]);
  const seuilParType = useMemo(() => new Map(types.map((t) => [t.idTypeEngin, t.seuilTauxJours])), [types]);

  return (
    <section className="space-y-3" aria-labelledby="titre-vehicules">
      <div>
        <h2 id="titre-vehicules" className="font-display text-lg font-semibold">Par véhicule</h2>
        <p className="text-sm text-muted-foreground">
          Un jour est « utilisé » s'il y a une mission, un trajet GPS ou un plein. Le trait sur la jauge marque le seuil du type.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer les véhicules">
          {FILTRES_VEHICULES.map((f) => (
            <button
              key={f.cle}
              type="button"
              aria-pressed={filtre === f.cle}
              onClick={() => setFiltre(f.cle)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                filtre === f.cle ? "border-primary bg-primary/10 font-medium text-foreground" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.libelle} <span className="tabular-nums">({comptes[f.cle]})</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un véhicule" className="h-9 w-56 pl-8" aria-label="Rechercher un véhicule" />
        </div>
        <Select value={tri} onValueChange={(v) => setTri(v as TriVehicules)}>
          <SelectTrigger className="h-9 w-56" aria-label="Trier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIS_VEHICULES.map((t) => (
              <SelectItem key={t.cle} value={t.cle}>
                {t.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Véhicule</th>
              <th className="px-3 py-2 text-right">Jours utilisés</th>
              <th className="px-3 py-2">Utilisation</th>
              <th className="px-3 py-2 text-right">Usage</th>
              <th className="px-3 py-2 text-right">Coût total</th>
              <th className="px-3 py-2 text-right">Coût unitaire</th>
              <th className="px-3 py-2">Écart référence</th>
              <th className="px-3 py-2">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {affiches.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Aucun véhicule ne correspond.</td>
              </tr>
            )}
            {affiches.map((v) => (
              <tr key={v.idEngin} className="align-top">
                <td className="px-3 py-2">
                  <Link to={`/engins/${v.idEngin}/rapport`} className="font-medium hover:underline">
                    {v.libelleVehicule}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {v.libelleType}
                    {v.equipeGps ? " · GPS" : ""}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {v.joursUtilises} / {v.joursDisponibles}
                  {v.joursImmobilises > 0 && <span className="block text-xs text-muted-foreground">{v.joursImmobilises} j au garage</span>}
                </td>
                <td className="px-3 py-2">
                  <Jauge valeur={v.tauxUtilisation} seuil={seuilParType.get(v.idTypeEngin)} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {nombreFr(usageVehicule(v), v.uniteUsage === "h" ? 1 : 0)} {v.uniteUsage}
                  {v.usageMensuel !== null && (
                    <span className="block text-xs text-muted-foreground">
                      {nombreFr(v.usageMensuel, v.uniteUsage === "h" ? 1 : 0)} {v.uniteUsage}/mois
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{nombreFr(v.couts.total)} Ar</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{texteCoutUnitaire(v.coutParUnite, v.uniteUsage)}</td>
                <td className="px-3 py-2">
                  <BadgeEcart niveau={v.niveauEcart} pourcent={v.ecartReferencePourcent} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CLASSEMENTS[v.classement].classes)} title={v.motifs.join(" ; ")}>
                      {CLASSEMENTS[v.classement].libelle}
                    </span>
                    {v.enTrop && <span className="rounded-full bg-badge-dangerBg px-2 py-0.5 text-xs font-medium text-badge-dangerFg">En trop</span>}
                  </div>
                  {v.classement === "SOUS_UTILISE" && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {v.motifs.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
