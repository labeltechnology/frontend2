import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIBELLES_PERIODE, type PeriodeAnalyse } from "@/features/analytics/periode";
import { libelleVehicule } from "@/lib/vehicule";
import type { Engin, TypeEngin } from "@/types/engin";

const TOUS = "tous";

/**
 * Filtres de la page Analytique, sur une seule ligne au-dessus de tous les
 * blocs : période, véhicule, type de véhicule. Ils s'appliquent à toute la
 * page (indicateurs, graphe, classements, répartitions).
 */
export function FiltresAnalytique({
  periode,
  onPeriode,
  idEngin,
  onEngin,
  idTypeEngin,
  onType,
  engins,
  types,
}: {
  periode: PeriodeAnalyse;
  onPeriode: (p: PeriodeAnalyse) => void;
  idEngin: number | null;
  onEngin: (id: number | null) => void;
  idTypeEngin: number | null;
  onType: (id: number | null) => void;
  engins: Engin[];
  types: TypeEngin[];
}) {
  const enginsProposes = idTypeEngin === null ? engins : engins.filter((e) => e.typeEngin?.idTypeEngin === idTypeEngin);
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtres de l'analyse">
      <Select value={periode} onValueChange={(v) => onPeriode(v as PeriodeAnalyse)}>
        <SelectTrigger className="h-9 w-[180px]" aria-label="Période">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LIBELLES_PERIODE) as PeriodeAnalyse[]).map((p) => (
            <SelectItem key={p} value={p}>
              {LIBELLES_PERIODE[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={idTypeEngin === null ? TOUS : String(idTypeEngin)} onValueChange={(v) => onType(v === TOUS ? null : Number(v))}>
        <SelectTrigger className="h-9 w-[190px]" aria-label="Type de véhicule">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TOUS}>Tous les types</SelectItem>
          {types.map((t) => (
            <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
              {t.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={idEngin === null ? TOUS : String(idEngin)} onValueChange={(v) => onEngin(v === TOUS ? null : Number(v))}>
        <SelectTrigger className="h-9 w-[240px]" aria-label="Véhicule">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TOUS}>Tous les véhicules</SelectItem>
          {enginsProposes.map((e) => (
            <SelectItem key={e.idEngin} value={String(e.idEngin)}>
              {libelleVehicule(e)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
