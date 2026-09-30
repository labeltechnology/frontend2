import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface OptionsConfirmation {
  titre: string;
  message: ReactNode;
  libelleConfirmer?: string;
  libelleAnnuler?: string;
  /** Action destructrice : bouton rouge et pictogramme corbeille. */
  danger?: boolean;
}

type Confirmer = (options: OptionsConfirmation) => Promise<boolean>;

const ContexteConfirmation = createContext<Confirmer | null>(null);

/**
 * Fenêtre de confirmation unique de l'application (2026-09-30, remplace
 * window.confirm) : `const confirmer = useConfirmer();` puis
 * `if (await confirmer({ titre, message, danger: true })) …`. Le focus
 * arrive sur « Annuler » : Entrée par réflexe ne détruit rien.
 */
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<OptionsConfirmation | null>(null);
  const resoudre = useRef<((ok: boolean) => void) | null>(null);

  const confirmer = useCallback<Confirmer>((opts) => {
    resoudre.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resoudre.current = resolve;
    });
  }, []);

  const fermer = (ok: boolean) => {
    resoudre.current?.(ok);
    resoudre.current = null;
    setOptions(null);
  };

  const Icone = options?.danger ? Trash2 : AlertTriangle;
  return (
    <ContexteConfirmation.Provider value={confirmer}>
      {children}
      <Dialog open={options !== null} onOpenChange={(ouvert) => !ouvert && fermer(false)}>
        <DialogContent className="max-w-md" role="alertdialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icone className={options?.danger ? "h-5 w-5 text-destructive" : "h-5 w-5 text-badge-warningFg"} aria-hidden="true" />
              {options?.titre}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">{options?.message}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" autoFocus onClick={() => fermer(false)}>
              {options?.libelleAnnuler ?? "Annuler"}
            </Button>
            <Button variant={options?.danger ? "destructive" : "default"} onClick={() => fermer(true)}>
              {options?.libelleConfirmer ?? "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContexteConfirmation.Provider>
  );
}

export function useConfirmer(): Confirmer {
  const confirmer = useContext(ContexteConfirmation);
  // Hors fournisseur (tests, page de connexion) : on retombe sur la fenêtre du navigateur.
  return confirmer ?? (async (o) => window.confirm(`${o.titre}\n\n${typeof o.message === "string" ? o.message : ""}`));
}
