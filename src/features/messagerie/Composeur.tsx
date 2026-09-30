import { useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEnvoyerMessage } from "@/features/messagerie/api";
import { LONGUEUR_MAX_MESSAGE, TYPES_PIECE_JOINTE, tailleLisible, verifierPiecesJointes } from "@/features/messagerie/messagerie";
import { ApiError } from "@/lib/api-client";

/**
 * Zone de saisie : texte (Entrée = envoyer, Maj+Entrée = retour à la ligne)
 * et pièces jointes (photos, PDF — contrôlées ici puis par le serveur).
 */
export function Composeur({ idConversation }: { idConversation: number }) {
  const [texte, setTexte] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const champFichiers = useRef<HTMLInputElement>(null);
  const envoyer = useEnvoyerMessage(idConversation);

  const ajouterFichiers = (liste: FileList | null) => {
    if (!liste) return;
    const suivants = [...fichiers, ...Array.from(liste)];
    const erreur = verifierPiecesJointes(suivants);
    if (erreur) toast.error(erreur);
    else setFichiers(suivants);
    if (champFichiers.current) champFichiers.current.value = "";
  };

  const soumettre = async () => {
    const contenu = texte.trim();
    if ((!contenu && fichiers.length === 0) || envoyer.isPending) return;
    try {
      await envoyer.mutateAsync({ contenu, fichiers });
      setTexte("");
      setFichiers([]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Message non envoyé");
    }
  };

  const surTouche = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void soumettre();
    }
  };

  return (
    <div className="border-t p-3">
      {fichiers.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Pièces jointes à envoyer">
          {fichiers.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
              <span className="max-w-40 truncate">{f.name}</span>
              <span className="text-muted-foreground">{tailleLisible(f.size)}</span>
              <button
                type="button"
                onClick={() => setFichiers(fichiers.filter((_, j) => j !== i))}
                aria-label={`Retirer ${f.name}`}
                className="rounded p-0.5 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={champFichiers}
          type="file"
          multiple
          accept={TYPES_PIECE_JOINTE.join(",")}
          className="hidden"
          onChange={(e) => ajouterFichiers(e.target.files)}
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => champFichiers.current?.click()} aria-label="Joindre une photo ou un PDF">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={surTouche}
          maxLength={LONGUEUR_MAX_MESSAGE}
          rows={1}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          aria-label="Message"
          className="max-h-40 min-h-10 flex-1 resize-none"
        />
        <Button type="button" onClick={() => void soumettre()} disabled={envoyer.isPending || (!texte.trim() && fichiers.length === 0)} aria-label="Envoyer">
          {envoyer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
