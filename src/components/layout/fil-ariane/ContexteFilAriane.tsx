import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ValeurContexte {
  detail: string | null;
  definir: (libelle: string | null) => void;
}

const Contexte = createContext<ValeurContexte>({ detail: null, definir: () => undefined });

/** Libellé de l'objet affiché (« 1234 TBA — Toyota Hilux »), fourni par la page de détail. */
export function FilArianeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [detail, setDetail] = useState<{ chemin: string; libelle: string | null }>({ chemin: pathname, libelle: null });
  const valeur: ValeurContexte = {
    detail: detail.chemin === pathname ? detail.libelle : null,
    definir: (libelle) => setDetail({ chemin: pathname, libelle }),
  };
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDetailFilAriane(): string | null {
  return useContext(Contexte).detail;
}

/** À appeler par une page de détail : `useTitreFilAriane(engin?.libelleVehicule)`. */
export function useTitreFilAriane(libelle: string | null | undefined) {
  const { definir } = useContext(Contexte);
  useEffect(() => {
    definir(libelle ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libelle]);
}
