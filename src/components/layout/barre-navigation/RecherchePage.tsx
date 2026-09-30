import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Car, CornerDownLeft, FileText, HardHat, Loader2, Route, Search, Users, Zap, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { rechercherPages } from "@/components/layout/barre-navigation/recherche-pages";
import { useAuth } from "@/features/auth/useAuth";
import { actionsPour } from "@/features/recherche/actions-rapides";
import { useRechercheGlobale } from "@/features/recherche/recherche-api";
import { assemblerResultats, type GroupeResultat } from "@/features/recherche/resultats";
import { cn, libelleEnum } from "@/lib/utils";
import type { NavItem } from "@/routes/nav-config";

const ICONES: Record<GroupeResultat, LucideIcon> = {
  Véhicules: Car,
  Conducteurs: Users,
  Chantiers: HardHat,
  Missions: Route,
  "Actions rapides": Zap,
  Pages: FileText,
};

/**
 * Loupe de la barre du bas : recherche globale (2026-09-30 ; au départ, le
 * 2026-09-25, recherche des seules pages). Ouverture au clic ou avec Ctrl+K
 * (⌘K sur Mac). On y trouve un véhicule (immatriculation, marque, type), une
 * mission, un chantier, un conducteur, une action rapide (« Ajouter un
 * plein ») ou une page. Flèches pour choisir, Entrée pour ouvrir. Le
 * serveur ne renvoie que ce que le rôle peut voir.
 */
export function RecherchePage({ pages }: { pages: NavItem[] }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const idListe = useId();
  const [ouvert, setOuvert] = useState(false);
  const [terme, setTerme] = useState("");
  const [indexActif, setIndexActif] = useState(0);
  const avecDonnees = session?.role !== "CONDUCTEUR";
  const requete = useRechercheGlobale(terme, ouvert && avecDonnees);

  const lignes = useMemo(
    () =>
      assemblerResultats(
        terme.trim().length >= 2 ? requete.data : undefined,
        actionsPour(session?.role, terme),
        rechercherPages(pages, terme),
        avecDonnees,
      ),
    [requete.data, terme, session?.role, pages, avecDonnees],
  );

  useEffect(() => {
    const raccourci = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert(true);
      }
    };
    window.addEventListener("keydown", raccourci);
    return () => window.removeEventListener("keydown", raccourci);
  }, []);

  useEffect(() => setIndexActif(0), [lignes.length]);

  const changerOuverture = (valeur: boolean) => {
    setOuvert(valeur);
    if (!valeur) {
      setTerme("");
      setIndexActif(0);
    }
  };

  const ouvrir = (chemin: string) => {
    changerOuverture(false);
    navigate(chemin);
  };

  const surTouche = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndexActif((i) => Math.min(i + 1, lignes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexActif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && lignes[indexActif]) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) window.open(lignes[indexActif].chemin, "_blank", "noopener");
      else ouvrir(lignes[indexActif].chemin);
    }
  };

  const enCours = avecDonnees && terme.trim().length >= 2 && requete.isFetching;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Rechercher (Ctrl+K)"
        title="Rechercher un véhicule, une personne, une page ou une action (Ctrl+K)"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-text transition-colors hover:bg-sidebar-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
      <Dialog open={ouvert} onOpenChange={changerOuverture}>
        <DialogContent className="max-w-xl gap-3 p-4">
          <DialogHeader>
            <DialogTitle>Rechercher</DialogTitle>
            <DialogDescription>
              {avecDonnees ? "Un véhicule, une mission, un chantier, un conducteur, une action ou une page." : "Une action ou une page."}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              autoFocus
              value={terme}
              onChange={(e) => setTerme(e.target.value)}
              onKeyDown={surTouche}
              placeholder={avecDonnees ? "Ex. 1234 TBA, hilux, Rakoto, plein…" : "Ex. plein, incident…"}
              role="combobox"
              aria-expanded="true"
              aria-controls={idListe}
              aria-activedescendant={lignes[indexActif] ? `${idListe}-${indexActif}` : undefined}
              aria-label="Rechercher"
            />
            {enCours && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          </div>
          <ul id={idListe} role="listbox" aria-label="Résultats" className="max-h-[26rem] overflow-y-auto">
            {lignes.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">Aucun résultat.</li>}
            {lignes.map((l, index) => {
              const Icone = ICONES[l.groupe];
              const nouveauGroupe = index === 0 || lignes[index - 1].groupe !== l.groupe;
              return (
                <li key={l.cle} role="presentation">
                  {nouveauGroupe && (
                    <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" aria-hidden="true">
                      {l.groupe}
                    </div>
                  )}
                  <div
                    id={`${idListe}-${index}`}
                    role="option"
                    aria-selected={index === indexActif}
                    onMouseEnter={() => setIndexActif(index)}
                    onClick={() => ouvrir(l.chemin)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm",
                      index === indexActif ? "bg-accent text-accent-foreground" : "text-foreground",
                    )}
                  >
                    <Icone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{l.titre}</span>
                      {l.detail && <span className="block truncate text-xs text-muted-foreground">{l.detail}</span>}
                    </span>
                    {l.statut && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{libelleEnum(l.statut)}</span>}
                    {index === indexActif && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
            <span>↑ ↓ choisir</span>
            <span>Entrée ouvrir</span>
            <span>Ctrl+Entrée nouvel onglet</span>
            <span>? raccourcis clavier</span>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
