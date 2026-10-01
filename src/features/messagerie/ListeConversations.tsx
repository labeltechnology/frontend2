import { Hash, MessagesSquare, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { dateCourte, grouperConversations, initialesNom } from "@/features/messagerie/messagerie";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import { libelleRole } from "@/lib/droits";
import { pluriel } from "@/lib/pluriel";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/messagerie";

const ICONES_SECTION = { CANAL: Hash, PRIVEE: UserRound, FIL: MessagesSquare } as const;

/** Colonne de gauche : canaux, messages privés, discussions — avec recherche et non-lus. */
export function ListeConversations({
  conversations,
  selection,
  onSelection,
  filtre,
  onFiltre,
}: {
  conversations: Conversation[];
  selection: number | null;
  onSelection: (idConversation: number) => void;
  filtre: string;
  onFiltre: (valeur: string) => void;
}) {
  const sections = grouperConversations(conversations, filtre);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={filtre}
          onChange={(e) => onFiltre(e.target.value)}
          placeholder="Rechercher une conversation"
          aria-label="Rechercher une conversation"
          className="pl-8"
        />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {sections.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aucune conversation.</p>}
        {sections.map((section) => {
          const Icone = ICONES_SECTION[section.type];
          return (
            <section key={section.type} aria-label={section.libelle}>
              <h3 className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icone className="h-3.5 w-3.5" aria-hidden />
                {section.libelle}
              </h3>
              <ul className="space-y-0.5">
                {section.conversations.map((c) => (
                  <li key={c.idConversation}>
                    <button
                      type="button"
                      onClick={() => onSelection(c.idConversation)}
                      aria-current={selection === c.idConversation ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selection === c.idConversation ? "bg-sidebar-active" : "hover:bg-muted/60",
                      )}
                    >
                      {c.type === "PRIVEE" ? (
                        <AvatarPersonne urlPhoto={c.interlocuteur?.urlPhoto} initiales={initialesNom(c.titre)} nom={c.titre} />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Icone className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm", c.nonLus > 0 ? "font-semibold text-foreground" : "text-foreground")}>
                          {c.titre}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.type === "PRIVEE" && c.interlocuteur?.role ? libelleRole(c.interlocuteur.role) : dateCourte(c.dateDernierMessage)}
                        </span>
                      </span>
                      {c.nonLus > 0 && (
                        <span
                          className="ml-auto min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums text-primary-foreground"
                          aria-label={pluriel(c.nonLus, "non lu")}
                        >
                          {c.nonLus > 99 ? "99+" : c.nonLus}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
