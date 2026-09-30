import { CircleHelp } from "lucide-react";
import { cheminPage } from "@/features/aide/liens-aide";

/**
 * Lien d'aide contextuel (étape 6) : placé dans un formulaire, il ouvre le
 * guide de la tâche dans un nouvel onglet, sans perdre la saisie en cours.
 */
export function LienAide({ idPage, libelle = "Aide" }: { idPage: string; libelle?: string }) {
  return (
    <a
      href={cheminPage(idPage)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-primary"
      title="Ouvrir le guide dans un nouvel onglet"
    >
      <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      {libelle}
    </a>
  );
}
