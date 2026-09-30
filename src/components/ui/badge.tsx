import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pastilles de statut façon maquette UI (itération 12) : fond pastel + texte
 * foncé lisible (tokens `badge.*`, voir tailwind.config.js) plutôt que
 * l'ancien remplissage plein bg-primary/bg-success/etc. Le mapping
 * statut -> variante (StatutBadge.tsx) n'a pas changé, seul le rendu de
 * chaque variante change ici.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-badge-infoBg text-badge-infoFg",
        secondary: "bg-badge-neutralBg text-badge-neutralFg",
        destructive: "bg-badge-dangerBg text-badge-dangerFg",
        success: "bg-badge-successBg text-badge-successFg",
        warning: "bg-badge-warningBg text-badge-warningFg",
        // "outline" garde un fond neutre très clair + une bordure visible, pour les statuts
        // "en retrait" (REFORME, VENDU, INACTIF, TERMINE...) qui doivent rester en arrière-plan.
        outline: "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Couleur du point qui précède le libellé — reprend la couleur de premier plan de chaque
// variante pour rester cohérent avec le texte, sauf "outline" qui reste discret.
const badgeDotVariants = cva("h-1.5 w-1.5 shrink-0 rounded-full", {
  variants: {
    variant: {
      default: "bg-badge-infoFg",
      secondary: "bg-badge-neutralFg",
      destructive: "bg-badge-dangerFg",
      success: "bg-badge-successFg",
      warning: "bg-badge-warningFg",
      outline: "bg-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  /** Affiche un petit point de couleur avant le libellé, comme dans la maquette. Actif par défaut. */
  dot?: boolean;
}

function Badge({ className, variant, dot = true, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn(badgeDotVariants({ variant }))} />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
