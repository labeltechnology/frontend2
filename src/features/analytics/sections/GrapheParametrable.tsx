import { useState } from "react";
import { BarChart3, FileSpreadsheet, Loader2, Table2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CadreSection } from "@/features/dashboard/sections/CadreSection";
import { LIBELLES_GRANULARITE, type Granularite } from "@/features/analytics/periode";
import { MESURES, type CleMesure, type DefinitionMesure } from "@/features/analytics/mesures";
import { tableauGraphe } from "@/features/analytics/export-graphe";
import { ApiError } from "@/lib/api-client";
import { exporterExcel } from "@/lib/export-excel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type FormeGraphe = "barres" | "courbe";

export interface PointGraphe {
  libelle: string;
  valeur: number;
  precedent?: number;
}

const COULEUR_ACTUELLE = "hsl(var(--primary))";
const COULEUR_PRECEDENTE = "hsl(var(--muted-foreground) / 0.45)";
const STYLE_AXE = { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const;
const STYLE_INFOBULLE = {
  borderRadius: 10,
  borderColor: "hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
} as const;

/** Bouton d'un groupe « segmenté » (une seule option active). */
function Segment<T extends string>({ options, valeur, onChange, libelles, nom }: { options: T[]; valeur: T; onChange: (v: T) => void; libelles: Record<T, string>; nom: string }) {
  return (
    <div className="inline-flex rounded-md border p-0.5" role="group" aria-label={nom}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={valeur === o}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            valeur === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {libelles[o]}
        </button>
      ))}
    </div>
  );
}

/**
 * Graphe paramétrable (2026-09-25) : l'utilisateur choisit la mesure, le
 * regroupement dans le temps (jour / semaine / mois selon la période), la
 * forme (barres ou courbe) et peut comparer à la période précédente (série
 * grise derrière). Une seule échelle, une seule couleur pour la période en
 * cours ; valeur exacte au survol ; bouton « Tableau » pour lire les chiffres
 * sans le graphe (accessibilité) ; bouton « Excel » (2026-09-29) : le même
 * tableau en .xlsx, avec la période et les filtres en en-tête (`contexte`).
 */
export function GrapheParametrable({
  mesure,
  onMesure,
  granularite,
  granularites,
  onGranularite,
  forme,
  onForme,
  comparer,
  onComparer,
  points,
  totalActuel,
  ecart,
  contexte = "",
}: {
  mesure: DefinitionMesure;
  onMesure: (cle: CleMesure) => void;
  granularite: Granularite;
  granularites: Granularite[];
  onGranularite: (g: Granularite) => void;
  forme: FormeGraphe;
  onForme: (f: FormeGraphe) => void;
  comparer: boolean;
  onComparer: (v: boolean) => void;
  points: PointGraphe[];
  totalActuel: number;
  ecart: number | null;
  /** Période et filtres, repris en tête du fichier Excel. */
  contexte?: string;
}) {
  const [enTableau, setEnTableau] = useState(false);
  const [exportEnCours, setExportEnCours] = useState(false);
  const exporter = async () => {
    setExportEnCours(true);
    try {
      await exporterExcel(tableauGraphe(mesure, points, comparer, contexte));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export Excel impossible");
    } finally {
      setExportEnCours(false);
    }
  };
  const vide = points.every((p) => p.valeur === 0 && (p.precedent ?? 0) === 0);
  const formaterAxe = (v: number) => (Math.abs(v) >= 1_000_000 ? `${Math.round(v / 100_000) / 10} M` : Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10} k` : String(v));
  const infobulle = (valeur: number, nom: string) => [mesure.formater(valeur), nom === "precedent" ? "Période précédente" : "Période en cours"];
  const legende = (nom: string) => (nom === "precedent" ? "Période précédente" : "Période en cours");

  const graphe =
    forme === "barres" ? (
      <BarChart data={points} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="libelle" tickLine={false} axisLine={false} tick={STYLE_AXE} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} tick={STYLE_AXE} width={48} tickFormatter={formaterAxe} allowDecimals={false} />
        <Tooltip formatter={infobulle} contentStyle={STYLE_INFOBULLE} cursor={{ fill: "hsl(var(--accent) / 0.4)" }} />
        {comparer && <Legend formatter={legende} wrapperStyle={{ fontSize: 12 }} />}
        {comparer && <Bar dataKey="precedent" fill={COULEUR_PRECEDENTE} radius={[4, 4, 0, 0]} maxBarSize={28} />}
        <Bar dataKey="valeur" fill={COULEUR_ACTUELLE} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    ) : (
      <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="libelle" tickLine={false} axisLine={false} tick={STYLE_AXE} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} tick={STYLE_AXE} width={48} tickFormatter={formaterAxe} allowDecimals={false} />
        <Tooltip formatter={infobulle} contentStyle={STYLE_INFOBULLE} />
        {comparer && <Legend formatter={legende} wrapperStyle={{ fontSize: 12 }} />}
        {comparer && <Line type="monotone" dataKey="precedent" stroke={COULEUR_PRECEDENTE} strokeWidth={2} strokeDasharray="5 4" dot={false} />}
        <Line type="monotone" dataKey="valeur" stroke={COULEUR_ACTUELLE} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    );

  return (
    <CadreSection
      titre="Évolution"
      icone={BarChart3}
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnTableau((v) => !v)}
            aria-pressed={enTableau}
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden />
            {enTableau ? "Graphe" : "Tableau"}
          </button>
          <button
            type="button"
            onClick={exporter}
            disabled={exportEnCours || vide}
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {exportEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />}
            Excel
          </button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={mesure.cle} onValueChange={(v) => onMesure(v as CleMesure)}>
          <SelectTrigger className="h-8 w-[260px] text-xs" aria-label="Mesure affichée">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESURES.map((m) => (
              <SelectItem key={m.cle} value={m.cle}>
                {m.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Segment nom="Regroupement" options={granularites} valeur={granularite} onChange={onGranularite} libelles={LIBELLES_GRANULARITE} />
        <Segment nom="Forme du graphe" options={["barres", "courbe"] as FormeGraphe[]} valeur={forme} onChange={onForme} libelles={{ barres: "Barres", courbe: "Courbe" }} />
        <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={comparer} onChange={(e) => onComparer(e.target.checked)} className="h-3.5 w-3.5 accent-[hsl(var(--primary))]" />
          Comparer à la période précédente
        </label>
      </div>

      <p className="mb-2 text-sm">
        <span className="font-display text-lg font-bold tabular-nums text-foreground">{mesure.formater(totalActuel)}</span>
        <span className="text-muted-foreground"> sur la période</span>
        {comparer && ecart !== null && (
          <span className="text-muted-foreground">
            {" "}
            · {ecart > 0 ? "+" : ""}
            {ecart.toFixed(1)} % par rapport à la période précédente
          </span>
        )}
      </p>

      {vide ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Aucune donnée sur cette période pour cette mesure.</p>
      ) : enTableau ? (
        <div className="max-h-72 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Période</th>
                <th className="px-3 py-2 text-right font-medium">Période en cours</th>
                {comparer && <th className="px-3 py-2 text-right font-medium">Période précédente</th>}
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.libelle} className="border-t">
                  <td className="px-3 py-1.5">{p.libelle}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{mesure.formater(p.valeur)}</td>
                  {comparer && <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{mesure.formater(p.precedent ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {graphe}
          </ResponsiveContainer>
        </div>
      )}
    </CadreSection>
  );
}
