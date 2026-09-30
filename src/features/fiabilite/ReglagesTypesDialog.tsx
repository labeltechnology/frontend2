import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEnregistrerReglageType, useReglagesTypes } from "@/features/fiabilite/api";
import { DOCUMENTS_PAR_DEFAUT, DOCUMENTS_VEHICULE, lireMontant } from "@/features/fiabilite/fiabilite";
import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { TypeDocument } from "@/types/document";
import type { ReglageType } from "@/types/fiabilite";

/**
 * Réglages par type de véhicule (2026-09-29) : coût d'une journée
 * d'immobilisation et documents obligatoires (exigés au démarrage d'une
 * mission et pour le taux de conformité). Sans choix : assurance + visite
 * technique.
 */
export function ReglagesTypesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const requete = useReglagesTypes(open);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Réglages par type de véhicule</DialogTitle>
          <DialogDescription>
            Coût d'une journée d'immobilisation (location de remplacement, chantier arrêté…) et documents exigés pour démarrer une mission.
          </DialogDescription>
        </DialogHeader>
        {requete.isPending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        )}
        <ul className="divide-y divide-border">
          {(requete.data ?? []).filter((t) => t.actif).map((t) => (
            <LigneReglage key={t.idTypeEngin} reglage={t} />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function LigneReglage({ reglage }: { reglage: ReglageType }) {
  const enregistrer = useEnregistrerReglageType();
  const [cout, setCout] = useState(reglage.coutImmobilisationJour === null ? "" : String(reglage.coutImmobilisationJour));
  const [documents, setDocuments] = useState<TypeDocument[]>(reglage.documentsObligatoires);

  useEffect(() => {
    setCout(reglage.coutImmobilisationJour === null ? "" : String(reglage.coutImmobilisationJour));
    setDocuments(reglage.documentsObligatoires);
  }, [reglage]);

  const basculer = (doc: TypeDocument) =>
    setDocuments((l) => (l.includes(doc) ? l.filter((x) => x !== doc) : [...l, doc]));

  const onEnregistrer = async () => {
    const valeur = lireMontant(cout);
    if (valeur === undefined) return toast.error("Coût journalier invalide.");
    if (documents.length === 0) return toast.error("Choisissez au moins un document (l'assurance est obligatoire).");
    try {
      await enregistrer.mutateAsync({ idTypeEngin: reglage.idTypeEngin, requete: { coutImmobilisationJour: valeur, documentsObligatoires: documents } });
      toast.success(`Réglages du type « ${reglage.libelle} » enregistrés`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-medium">
          {reglage.libelle}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {reglage.categorie === "ENGIN_CHANTIER" ? "Engin de chantier" : "Véhicule routier"}
            {reglage.documentsParDefaut && " · documents par défaut"}
          </span>
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Immobilisation</span>
          <Input className="h-8 w-32" inputMode="decimal" placeholder="Non chiffrée" value={cout} onChange={(e) => setCout(e.target.value)} />
          <span className="text-muted-foreground">Ar/jour</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Documents obligatoires : ${reglage.libelle}`}>
        {DOCUMENTS_VEHICULE.map((doc) => {
          const choisi = documents.includes(doc);
          return (
            <button
              key={doc}
              type="button"
              aria-pressed={choisi}
              onClick={() => basculer(doc)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                choisi ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {LIBELLES_TYPE_DOCUMENT[doc]}
            </button>
          );
        })}
        <button type="button" className="ml-1 text-xs text-primary hover:underline" onClick={() => setDocuments(DOCUMENTS_PAR_DEFAUT)}>
          Par défaut
        </button>
        <Button size="sm" className="ml-auto h-8" onClick={onEnregistrer} disabled={enregistrer.isPending}>
          {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </li>
  );
}
