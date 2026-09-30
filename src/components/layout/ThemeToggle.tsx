import { Check, Moon, MoonStar, Sun, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIBELLES_THEME, THEMES, useTheme, type Theme } from "@/lib/theme";

const ICONES_THEME: Record<Theme, LucideIcon> = {
  clair: Sun,
  sombre: Moon,
  nuit: MoonStar,
};

/**
 * Sélecteur de thème (Clair / Sombre / Nuit vitrée). Remplace la bascule
 * clair/sombre depuis le 2026-09-24 (nom du composant conservé). Affiché
 * dans la barre de navigation du bas depuis le 2026-09-25. Le choix est
 * persisté — voir lib/theme.ts.
 * `cote` (2026-09-25) : côté d'ouverture du menu — "top" dans la barre de
 * navigation du bas. `ouvert` / `onOuvertChange` (facultatifs) : ouverture
 * pilotée de l'extérieur (un seul menu ouvert à la fois dans la barre).
 */
export function ThemeToggle({
  cote = "bottom",
  ouvert,
  onOuvertChange,
}: {
  cote?: "top" | "bottom";
  ouvert?: boolean;
  onOuvertChange?: (ouvert: boolean) => void;
}) {
  const { theme, changerTheme } = useTheme();
  const IconeCourante = ICONES_THEME[theme];
  const libelle = `Changer de thème (actuel : ${LIBELLES_THEME[theme]})`;

  return (
    <DropdownMenu open={ouvert} onOpenChange={onOuvertChange} modal={onOuvertChange ? false : undefined}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={libelle} title={libelle}>
          <IconeCourante className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={cote} align="end" sideOffset={cote === "top" ? 10 : 4} className="w-44">
        <DropdownMenuLabel>Thème</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((option) => {
          const Icone = ICONES_THEME[option];
          const actif = option === theme;
          return (
            <DropdownMenuItem key={option} onSelect={() => changerTheme(option)}>
              <Icone className="mr-2 h-4 w-4" />
              <span className="flex-1">{LIBELLES_THEME[option]}</span>
              {actif && (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(thème actuel)</span>
                </>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
