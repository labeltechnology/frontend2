import { History } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { formatDateTime, libelleEnum } from "@/lib/utils";
import type { JournalAudit } from "@/types/audit";

const NOMBRE_VISIBLE = 6;

/** Dernières actions du journal d'audit (administrateur et responsable du parc seulement, règle 14.5). */
export function ActiviteRecente({ entrees }: { entrees: JournalAudit[] | undefined }) {
  const liste = (entrees ?? [])
    .slice()
    .sort((a, b) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime())
    .slice(0, NOMBRE_VISIBLE);
  return (
    <CadreSection titre="Activité récente" icone={History} lien="/journal-audit">
      {liste.length === 0 ? (
        <EtatBloc>Aucune activité enregistrée.</EtatBloc>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {liste.map((e) => (
            <li key={e.idJournalAudit} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" aria-hidden />
              <p className="text-sm">
                <span className="font-medium text-foreground">{libelleEnum(e.action)}</span>
                <span className="text-muted-foreground"> — {e.entite}</span>
              </p>
              {e.details && <p className="truncate text-xs text-muted-foreground">{e.details}</p>}
              <p className="text-[11px] text-muted-foreground">{formatDateTime(e.dateAction)}</p>
            </li>
          ))}
        </ol>
      )}
    </CadreSection>
  );
}
