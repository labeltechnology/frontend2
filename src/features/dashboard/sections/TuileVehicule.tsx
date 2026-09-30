import { Link } from "react-router-dom";
import { Bell, FileText, ShieldAlert, Wrench, type LucideIcon } from "lucide-react";
import { DIMENSIONS_SANTE, type DimensionSante, type SanteVehicule } from "@/features/dashboard/sante-parc";
import { CLASSES_NIVEAU, ICONES_NIVEAU, LIBELLES_NIVEAU } from "@/features/rapport-engin/presentation";
import type { NiveauRapport } from "@/features/rapport-engin/niveaux";
import { cn } from "@/lib/utils";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";

export const ICONES_DIMENSION: Record<DimensionSante, LucideIcon> = {
  documents: FileText,
  alertes: Bell,
  incidents: ShieldAlert,
  atelier: Wrench,
};

/** Liseré gauche de la tuile (classes en toutes lettres pour Tailwind). */
const LISERE_NIVEAU: Record<NiveauRapport, string> = {
  ok: "border-l-badge-successFg",
  avertissement: "border-l-badge-warningFg",
  alerte: "border-l-badge-dangerFg",
  inconnu: "border-l-badge-neutralFg",
};

/**
 * Tuile d'un véhicule dans le « mur du parc » : identifiant, marque et
 * modèle, 4 pastilles (documents, alertes, incidents, atelier) à la couleur
 * de leur niveau, et le motif le plus grave. Le liseré gauche porte le
 * niveau global. Un clic ouvre le rapport du véhicule.
 * La couleur n'est jamais seule : pictogramme de niveau, infobulle et
 * libellé accessible décrivent chaque état.
 */
export function TuileVehicule({ sante }: { sante: SanteVehicule }) {
  const { engin, dimensions, niveau, motif } = sante;
  const IconeNiveau = ICONES_NIVEAU[niveau];
  const modele = [engin.marque, engin.modele].filter(Boolean).join(" ");
  const description = `${libelleVehicule(engin)} — ${LIBELLES_NIVEAU[niveau]}${motif ? ` — ${motif}` : ""}`;

  return (
    <Link
      to={`/engins/${engin.idEngin}/rapport`}
      title={description}
      aria-label={`${description}. Ouvrir le rapport du véhicule.`}
      className={cn(
        "group block min-w-0 rounded-md border border-l-4 border-border bg-card/60 p-2 transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        LISERE_NIVEAU[niveau],
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-sm font-semibold text-foreground">{identifiantVehicule(engin)}</span>
        <IconeNiveau className={cn("h-3.5 w-3.5 shrink-0", CLASSES_NIVEAU[niveau].texte)} aria-hidden />
      </div>
      <p className="truncate text-xs text-muted-foreground">{modele || "—"}</p>
      <div className="mt-1.5 flex items-center gap-1" aria-hidden>
        {DIMENSIONS_SANTE.map(({ cle, libelle }) => {
          const Icone = ICONES_DIMENSION[cle];
          const etat = dimensions[cle];
          return (
            <span
              key={cle}
              title={`${libelle} : ${etat.motif ?? LIBELLES_NIVEAU[etat.niveau]}`}
              className={cn("inline-flex h-5 w-5 items-center justify-center rounded", CLASSES_NIVEAU[etat.niveau].pastille)}
            >
              <Icone className="h-3 w-3" />
            </span>
          );
        })}
      </div>
      {motif && <p className="mt-1 truncate text-[11px] leading-tight text-muted-foreground">{motif}</p>}
    </Link>
  );
}
