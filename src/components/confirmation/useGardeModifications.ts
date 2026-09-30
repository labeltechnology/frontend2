import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirmer } from "@/components/confirmation/ConfirmationProvider";

/**
 * Garde d'une saisie non enregistrée (2026-09-30). Tant que `modifie` est
 * vrai :
 * - fermer ou recharger l'onglet déclenche l'avertissement du navigateur ;
 * - un clic sur un lien de l'application (menu, fil d'Ariane, liste…) ouvre
 *   « Quitter sans enregistrer ? » avant de partir.
 * Les navigations faites par programme (après un enregistrement réussi)
 * ne sont pas interceptées.
 */
export function useGardeModifications(modifie: boolean, description = "Vos modifications seront perdues.") {
  const confirmer = useConfirmer();
  const navigate = useNavigate();
  const etat = useRef({ modifie, description });
  etat.current = { modifie, description };

  useEffect(() => {
    const avantDeQuitter = (e: BeforeUnloadEvent) => {
      if (!etat.current.modifie) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const surClic = (e: MouseEvent) => {
      if (!etat.current.modifie || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!lien || lien.target === "_blank" || lien.hasAttribute("download")) return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const destination = url.pathname + url.search + url.hash;
      if (destination === window.location.pathname + window.location.search + window.location.hash) return;
      e.preventDefault();
      e.stopPropagation();
      void confirmer({
        titre: "Quitter sans enregistrer ?",
        message: `${etat.current.description} Restez sur la page pour les enregistrer.`,
        libelleAnnuler: "Rester sur la page",
        libelleConfirmer: "Quitter sans enregistrer",
        danger: true,
      }).then((ok) => {
        if (ok) {
          etat.current.modifie = false;
          navigate(destination);
        }
      });
    };
    window.addEventListener("beforeunload", avantDeQuitter);
    document.addEventListener("click", surClic, true);
    return () => {
      window.removeEventListener("beforeunload", avantDeQuitter);
      document.removeEventListener("click", surClic, true);
    };
  }, [confirmer, navigate]);
}
