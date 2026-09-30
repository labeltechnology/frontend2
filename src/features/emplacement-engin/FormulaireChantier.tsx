import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChantiers, useCreerAffectationChantier } from "@/features/chantiers/api";
import {
  chantiersEnCours,
  chantiersProposes,
  erreurChantier,
  jourDe,
  periodeParDefaut,
  type Occupation,
} from "@/features/emplacement-engin/occupations";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { Engin } from "@/types/engin";
import { libelleVehicule } from "@/lib/vehicule";

interface FormulaireChantierProps {
  engin: Engin;
  occupations: Occupation[];
  /** Chantiers où le véhicule est déjà rattaché (exclus de la liste). */
  idsChantiersDejaRattaches: ReadonlySet<number>;
  aujourdhui: string;
  onTermine: () => void;
  onAnnuler: () => void;
}

/**
 * Partie « Chantier » du formulaire de la carte « Localisation »
 * (2026-09-25) : un chantier EXISTANT (planifié ou en cours — choix de
 * l'utilisateur ; lien vers la fiche chantier pour en créer un) et la
 * période du véhicule sur ce chantier, comprise dans ses dates. Bloquée si
 * la période chevauche un autre chantier ou une mission du véhicule (mêmes
 * règles que le serveur).
 */
export function FormulaireChantier({
  engin,
  occupations,
  idsChantiersDejaRattaches,
  aujourdhui,
  onTermine,
  onAnnuler,
}: FormulaireChantierProps) {
  const chantiers = useChantiers();
  const rattacher = useCreerAffectationChantier();
  const [idChantier, setIdChantier] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const proposes = useMemo(
    () => chantiersProposes(chantiers.data ?? [], aujourdhui, idsChantiersDejaRattaches),
    [chantiers.data, aujourdhui, idsChantiersDejaRattaches],
  );
  // Liste vide : distinguer « aucun chantier ouvert » de « déjà rattaché à
  // tous » — sinon l'utilisateur croit que les chantiers n'ont pas été
  // chargés (retour du 2026-09-25 : « il n'y a pas de chantier », alors que
  // le véhicule était déjà rattaché au seul chantier existant).
  const ouverts = useMemo(
    () => chantiersEnCours(chantiers.data ?? [], aujourdhui),
    [chantiers.data, aujourdhui],
  );
  const listeChargee = !chantiers.isPending && !chantiers.isError;
  const rienAProposer = listeChargee && proposes.length === 0;
  const chantier = proposes.find((c) => String(c.idChantier) === idChantier);
  const erreur = chantier ? erreurChantier(chantier, debut, fin, occupations) : null;
  const valide = chantier !== undefined && erreur === null;

  const choisirChantier = (valeur: string) => {
    setIdChantier(valeur);
    const choisi = proposes.find((c) => String(c.idChantier) === valeur);
    if (choisi) {
      const periode = periodeParDefaut(choisi, aujourdhui);
      setDebut(periode.debut);
      setFin(periode.fin);
    }
  };

  const valider = async () => {
    if (!valide || !chantier) return;
    setEnvoi(true);
    try {
      await rattacher.mutateAsync({
        idEngin: engin.idEngin,
        idChantier: chantier.idChantier,
        dateDebutPrevue: debut,
        dateFinPrevue: fin,
      });
      toast.success(`${libelleVehicule(engin)} prévu sur le chantier « ${chantier.nom} »`);
      onTermine();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de prévoir le véhicule sur ce chantier");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="emplacement-chantier">Chantier</Label>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link to="/chantiers/nouveau">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Créer un chantier
            </Link>
          </Button>
        </div>
        {/* Désactivé quand il n'y a rien à proposer : sans ça, le menu s'ouvrait
            sur un panneau vide qui recouvrait le message explicatif. */}
        <Select value={idChantier} onValueChange={choisirChantier} disabled={rienAProposer}>
          <SelectTrigger id="emplacement-chantier">
            <SelectValue
              placeholder={
                chantiers.isPending ? "Chargement…" : rienAProposer ? "Aucun chantier à proposer" : "Choisir un chantier"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {proposes.map((c) => (
              <SelectItem key={c.idChantier} value={String(c.idChantier)}>
                {c.nom}
                {c.lieu ? ` — ${c.lieu}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {chantiers.isError && <p className="text-xs text-destructive">Liste des chantiers indisponible.</p>}
        {rienAProposer && (
          <p className="text-xs text-muted-foreground">
            {ouverts.length === 0
              ? "Aucun chantier planifié ou en cours : créez-en un pour y prévoir ce véhicule."
              : ouverts.length === 1
                ? `Ce véhicule est déjà rattaché à « ${ouverts[0].nom} », le seul chantier ouvert.`
                : `Ce véhicule est déjà rattaché à tous les chantiers ouverts (${ouverts.length}).`}
          </p>
        )}
        {chantier && (
          <p className="text-xs text-muted-foreground">
            Dates du chantier : du {formatDate(jourDe(chantier.dateDebutPrevue))} au {formatDate(jourDe(chantier.dateFinPrevue))}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emplacement-debut">Début</Label>
          <Input
            id="emplacement-debut"
            type="date"
            value={debut}
            disabled={!chantier}
            min={chantier ? jourDe(chantier.dateDebutPrevue) : undefined}
            max={chantier ? jourDe(chantier.dateFinPrevue) : undefined}
            onChange={(e) => setDebut(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emplacement-fin">Fin</Label>
          <Input
            id="emplacement-fin"
            type="date"
            value={fin}
            disabled={!chantier}
            min={debut || undefined}
            max={chantier ? jourDe(chantier.dateFinPrevue) : undefined}
            onChange={(e) => setFin(e.target.value)}
          />
        </div>
      </div>
      {erreur && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onAnnuler} disabled={envoi}>
          Annuler
        </Button>
        <Button onClick={valider} disabled={!valide || envoi}>
          {envoi && <Loader2 className="h-4 w-4 animate-spin" />}
          Prévoir sur le chantier
        </Button>
      </div>
    </div>
  );
}
