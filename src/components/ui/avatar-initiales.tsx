import { cn } from "@/lib/utils";

/**
 * Pastille d'initiales (façon maquette UI, itération 12) — utilisée pour le
 * chip utilisateur de la barre latérale (initiales dérivées de l'e-mail, voir
 * initialesDepuisEmail dans lib/utils.ts, faute de nom affichable dans
 * SessionUtilisateur) et pour la colonne "Conducteur" de ConducteursPage
 * (initiales prénom+nom, données réellement disponibles là).
 *
 * Composant volontairement minimal (pas de gestion d'image) : pour afficher
 * la photo de profil quand elle existe (2026-09-29), utiliser
 * features/photo-profil/AvatarPersonne, qui retombe sur ces initiales.
 */
export function AvatarInitiales({
  initiales,
  className,
}: {
  initiales: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-from to-brand-to text-xs font-semibold text-primary-foreground",
        className,
      )}
    >
      {initiales}
    </span>
  );
}
