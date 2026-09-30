import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { cliquerNouveau, enregistrerFormulaire, estChampDeSaisie, focaliserRecherche } from "@/components/layout/raccourcis/actions-page";
import { DELAI_SEQUENCE_MS, interpreter } from "@/components/layout/raccourcis/raccourcis";
import { NAV_ITEMS } from "@/routes/nav-config";
import { entreesVisibles } from "@/routes/navigation-groupes";

/** Raccourcis clavier de l'application (2026-09-30). Renvoie l'état de la fenêtre d'aide « ? ». */
export function useRaccourcis() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [aideOuverte, setAideOuverte] = useState(false);
  const precedente = useRef<{ touche: string; quand: number } | null>(null);
  const role = useRef(session?.role);
  role.current = session?.role;

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      // Une fenêtre est ouverte : elle garde le clavier (sauf Ctrl+S).
      const fenetreOuverte = document.querySelector("[role=dialog],[role=alertdialog]") !== null;
      const prec = precedente.current && Date.now() - precedente.current.quand < DELAI_SEQUENCE_MS ? precedente.current.touche : null;
      const { action, attente } = interpreter(
        { key: e.key, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
        prec,
        estChampDeSaisie(e.target) || (fenetreOuverte && !(e.ctrlKey || e.metaKey)),
      );
      precedente.current = attente ? { touche: attente, quand: Date.now() } : null;
      if (!action) return;
      let fait = false;
      switch (action.type) {
        case "aide":
          setAideOuverte(true);
          fait = true;
          break;
        case "chercherListe":
          fait = focaliserRecherche();
          break;
        case "nouveau":
          fait = cliquerNouveau();
          break;
        case "enregistrer":
          fait = enregistrerFormulaire();
          break;
        case "aller":
          if (entreesVisibles(NAV_ITEMS, role.current).some((i) => i.to === action.chemin)) {
            navigate(action.chemin);
            fait = true;
          }
          break;
      }
      if (fait) e.preventDefault();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [navigate]);

  return { aideOuverte, setAideOuverte };
}
