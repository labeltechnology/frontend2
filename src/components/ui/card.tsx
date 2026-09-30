import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Panneau translucide flouté, comme le template de référence
 * (sa.avidtemplates.com) : ses cartes sont un voile semi-transparent
 * (--elevated: #08162b33) posé sur le fond dégradé de la page, avec
 * `backdrop-filter`. C'est cette transparence qui rend le dégradé visible —
 * voir la règle `body` dans index.css.
 *
 * Le voile est la classe `surface-verre` (index.css, 2026-09-24) : couleur
 * `--card`, opacité `--verre-opacite` (0,8 en clair/sombre — rendu inchangé —,
 * 0,5 en « Nuit vitrée ») et flou `--verre-flou`. Là où le floutage n'est pas
 * supporté (navigateurs anciens), la carte reste opaque plutôt qu'illisible.
 * Une classe `bg-*` passée en `className` l'emporte toujours (couche
 * utilities après la couche components).
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "surface-verre rounded-lg border text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
