import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, MessagesSquare, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/data-table/PageHeader";
import { useConversations } from "@/features/messagerie/api";
import { FilConversation } from "@/features/messagerie/FilConversation";
import { ListeConversations } from "@/features/messagerie/ListeConversations";
import { NouvelleConversationDialog } from "@/features/messagerie/NouvelleConversationDialog";
import { cn } from "@/lib/utils";

/**
 * Messagerie interne (2026-09-28). Deux colonnes : conversations à gauche,
 * conversation ouverte à droite (sur petit écran, l'une OU l'autre). La
 * conversation ouverte est dans l'URL (?c=12) : un lien « Discussion »
 * d'une fiche mène directement au bon fil.
 */
export function MessageriePage() {
  const [params, setParams] = useSearchParams();
  const idSelection = Number(params.get("c")) || null;
  const [filtre, setFiltre] = useState("");
  const [nouvelleOuverte, setNouvelleOuverte] = useState(false);
  const { data: conversations, isLoading, isError } = useConversations();
  const selection = conversations?.find((c) => c.idConversation === idSelection) ?? null;

  const choisir = (idConversation: number | null) => {
    const suivants = new URLSearchParams(params);
    if (idConversation === null) suivants.delete("c");
    else suivants.set("c", String(idConversation));
    setParams(suivants, { replace: true });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Messagerie"
        description="Messages privés, canaux d'équipe et discussions par véhicule, mission, chantier ou maintenance."
        actions={
          <Button onClick={() => setNouvelleOuverte(true)}>
            <SquarePen className="h-4 w-4" />
            Nouveau message
          </Button>
        }
      />

      <Card className="flex h-[calc(100dvh-14rem)] min-h-[420px] overflow-hidden">
        <aside
          className={cn(
            "w-full shrink-0 flex-col border-r p-3 md:flex md:w-80",
            selection ? "hidden md:flex" : "flex",
          )}
          aria-label="Conversations"
        >
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p>}
          {isError && <p className="py-6 text-center text-sm text-destructive">Messagerie indisponible.</p>}
          {conversations && (
            <ListeConversations
              conversations={conversations}
              selection={idSelection}
              onSelection={choisir}
              filtre={filtre}
              onFiltre={setFiltre}
            />
          )}
        </aside>

        <section className={cn("min-w-0 flex-1 flex-col", selection ? "flex" : "hidden md:flex")}>
          {selection ? (
            <>
              <div className="border-b p-2 md:hidden">
                <Button variant="ghost" size="sm" onClick={() => choisir(null)}>
                  <ArrowLeft className="h-4 w-4" />
                  Conversations
                </Button>
              </div>
              <FilConversation key={selection.idConversation} conversation={selection} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <MessagesSquare className="h-10 w-10" aria-hidden />
              <p className="text-sm">
                {idSelection && conversations ? "Cette conversation n'est pas accessible." : "Choisissez une conversation ou écrivez un nouveau message."}
              </p>
            </div>
          )}
        </section>
      </Card>

      <NouvelleConversationDialog open={nouvelleOuverte} onOpenChange={setNouvelleOuverte} onOuverte={choisir} />
    </div>
  );
}
