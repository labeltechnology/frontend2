import { useState } from "react";
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMonVoteAide, useVoterAide } from "@/features/aide/api";
import { cn } from "@/lib/utils";

/** « Cet article vous a-t-il aidé ? » (étapes 6 et 7) : vote enregistré, commentaire facultatif sur un « Non ». */
export function VoteAideVue({ idPage }: { idPage: string }) {
  const monVote = useMonVoteAide(idPage);
  const voter = useVoterAide();
  const [commentaireOuvert, setCommentaireOuvert] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const utile = monVote.data?.utile ?? null;

  const envoyer = async (estUtile: boolean, texte?: string) => {
    try {
      await voter.mutateAsync({ idPage, utile: estUtile, commentaire: texte?.trim() || undefined });
      if (!estUtile && texte === undefined) setCommentaireOuvert(true);
      if (texte !== undefined) {
        setCommentaireOuvert(false);
        toast.success("Merci, votre remarque aidera à améliorer cette page.");
      }
    } catch {
      toast.error("Votre avis n'a pas pu être envoyé.");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium">Cet article vous a-t-il aidé ?</p>
        <div className="flex gap-2">
          <Button size="sm" variant={utile === true ? "default" : "outline"} onClick={() => envoyer(true)} disabled={voter.isPending} aria-pressed={utile === true}>
            <ThumbsUp className="h-4 w-4" />
            Oui
          </Button>
          <Button size="sm" variant={utile === false ? "default" : "outline"} onClick={() => envoyer(false)} disabled={voter.isPending} aria-pressed={utile === false}>
            <ThumbsDown className="h-4 w-4" />
            Non
          </Button>
        </div>
        {utile !== null && !commentaireOuvert && <span className="text-xs text-muted-foreground">Merci pour votre réponse.</span>}
      </div>
      {commentaireOuvert && (
        <div className="space-y-2">
          <label htmlFor={`commentaire-${idPage}`} className="text-sm text-muted-foreground">
            Qu'est-ce qui manque ou n'est pas clair ? (facultatif)
          </label>
          <Textarea
            id={`commentaire-${idPage}`}
            value={commentaire}
            maxLength={500}
            rows={3}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Ex. : l'étape 3 ne correspond pas à mon écran."
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCommentaireOuvert(false)}>
              Plus tard
            </Button>
            <Button size="sm" onClick={() => envoyer(false, commentaire)} disabled={voter.isPending || !commentaire.trim()}>
              {voter.isPending && <Loader2 className={cn("h-4 w-4 animate-spin")} />}
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
