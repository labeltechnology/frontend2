import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { CaptureAide } from "@/types/aide";

/** Dossier des captures : frontend2/public/aide/captures/ (servi tel quel par Vite). */
export const DOSSIER_CAPTURES = "/aide/captures/";

/**
 * Capture d'écran annotée (étape 5). Tant que le fichier n'est pas déposé,
 * rien n'est montré aux utilisateurs ; le responsable de l'aide voit un
 * emplacement avec le nom exact du fichier à produire.
 */
export function CaptureAideVue({ capture, responsable }: { capture: CaptureAide; responsable: boolean }) {
  const [absente, setAbsente] = useState(false);
  if (absente) {
    return responsable ? (
      <figure className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
        <ImageOff className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          Capture à ajouter : <code className="font-mono text-foreground">public/aide/captures/{capture.fichier}</code>
          <span className="block">{capture.alt}</span>
        </span>
      </figure>
    ) : null;
  }
  return (
    <figure className="space-y-1.5">
      <img
        src={DOSSIER_CAPTURES + capture.fichier}
        alt={capture.alt}
        loading="lazy"
        onError={() => setAbsente(true)}
        className="w-full rounded-lg border border-border"
      />
      {capture.legende && <figcaption className="text-xs text-muted-foreground">{capture.legende}</figcaption>}
    </figure>
  );
}
