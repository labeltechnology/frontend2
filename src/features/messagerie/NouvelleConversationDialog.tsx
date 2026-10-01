import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useContacts, useOuvrirPrivee } from "@/features/messagerie/api";
import { initialesNom } from "@/features/messagerie/messagerie";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import { ApiError } from "@/lib/api-client";
import { libelleRole } from "@/lib/droits";

/** Choix d'un utilisateur actif pour ouvrir (ou retrouver) une conversation privée. */
export function NouvelleConversationDialog({
  open,
  onOpenChange,
  onOuverte,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOuverte: (idConversation: number) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const { data: contacts, isLoading } = useContacts(open);
  const ouvrir = useOuvrirPrivee();
  const filtre = recherche.trim().toLowerCase();
  const visibles = (contacts ?? []).filter(
    (c) => !filtre || c.nomComplet.toLowerCase().includes(filtre) || libelleRole(c.role).toLowerCase().includes(filtre),
  );

  const choisir = async (idUtilisateur: number) => {
    try {
      const conversation = await ouvrir.mutateAsync(idUtilisateur);
      onOuverte(conversation.idConversation);
      onOpenChange(false);
      setRecherche("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Conversation impossible à ouvrir");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogDescription>Choisissez la personne à qui écrire.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom ou rôle"
            aria-label="Rechercher une personne"
            className="pl-8"
          />
        </div>
        <ul className="max-h-80 space-y-0.5 overflow-y-auto">
          {isLoading && <li className="py-4 text-center text-sm text-muted-foreground">Chargement…</li>}
          {!isLoading && visibles.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">Aucune personne ne correspond à la recherche.</li>}
          {visibles.map((c) => (
            <li key={c.idUtilisateur}>
              <button
                type="button"
                disabled={ouvrir.isPending}
                onClick={() => choisir(c.idUtilisateur)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <AvatarPersonne urlPhoto={c.urlPhoto} initiales={initialesNom(c.nomComplet)} nom={c.nomComplet} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.nomComplet}</span>
                  <span className="block truncate text-xs text-muted-foreground">{libelleRole(c.role)}</span>
                </span>
                {ouvrir.isPending && ouvrir.variables === c.idUtilisateur && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
