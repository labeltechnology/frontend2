/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Police du template de référence (sa.avidtemplates.com, chargée depuis
        // Google Fonts — voir index.html). Une seule famille pour le texte et
        // les titres, comme le template : la hiérarchie repose sur la graisse
        // et la taille, pas sur un contraste de polices. La clé "display" est
        // conservée (utilisée par les titres dans toute l'app) mais pointe
        // désormais sur la même famille.
        //
        // 2026-09-24 : la famille passe par la variable --police (index.css) pour
        // que le thème « Nuit vitrée » puisse utiliser Source Sans 3 sans toucher
        // aux composants. Valeur par défaut : "Google Sans", rendu inchangé.
        sans: ["var(--police)", "system-ui", "sans-serif"],
        display: ["var(--police)", "system-ui", "sans-serif"],
      },
      // Graisses pilotées par thème (index.css) : 500/600/700 par défaut comme
      // Tailwind, allégées en « Nuit vitrée » (police fine et douce).
      fontWeight: {
        medium: "var(--graisse-moyenne)",
        semibold: "var(--graisse-demi)",
        bold: "var(--graisse-grasse)",
      },
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        // Couleurs "pastille" des badges de statut (StatutBadge) — délibérément séparées de
        // success/warning/destructive ci-dessus, qui restent des couleurs de TEXTE/icône lisibles
        // directement sur fond de carte (messages d'erreur de formulaire, bannières d'avertissement,
        // boutons pleins). Réutiliser ces mêmes tokens pour un fond pastel de badge aurait forcé un
        // compromis de lisibilité dans un sens ou dans l'autre — voir claude/frontend-scaffold.md,
        // itération 12.
        badge: {
          successBg: "hsl(var(--badge-success-bg) / <alpha-value>)",
          successFg: "hsl(var(--badge-success-fg) / <alpha-value>)",
          infoBg: "hsl(var(--badge-info-bg) / <alpha-value>)",
          infoFg: "hsl(var(--badge-info-fg) / <alpha-value>)",
          warningBg: "hsl(var(--badge-warning-bg) / <alpha-value>)",
          warningFg: "hsl(var(--badge-warning-fg) / <alpha-value>)",
          dangerBg: "hsl(var(--badge-danger-bg) / <alpha-value>)",
          dangerFg: "hsl(var(--badge-danger-fg) / <alpha-value>)",
          neutralBg: "hsl(var(--badge-neutral-bg) / <alpha-value>)",
          neutralFg: "hsl(var(--badge-neutral-fg) / <alpha-value>)",
        },
        // Barre latérale (fond graphite plein, direction "Graphite & Ambre" frontend2) + jauge de
        // couleur de la vignette de marque (brand-from/to, non utilisés en dégradé dans cette
        // direction — logo en aplat ambre, voir Sidebar.tsx — mais conservés pour compatibilité).
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-bg) / <alpha-value>)",
          active: "hsl(var(--sidebar-active) / <alpha-value>)",
          chip: "hsl(var(--sidebar-chip) / <alpha-value>)",
          text: "hsl(var(--sidebar-text) / <alpha-value>)",
          textMuted: "hsl(var(--sidebar-text-muted) / <alpha-value>)",
        },
        brand: {
          from: "hsl(var(--brand-from) / <alpha-value>)",
          to: "hsl(var(--brand-to) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
