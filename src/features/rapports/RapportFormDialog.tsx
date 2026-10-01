import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarRange, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChantiers } from "@/features/chantiers/api";
import { useConducteurs } from "@/features/conducteurs/api";
import { useEngins } from "@/features/engins/api";
import { useGenererRapport } from "@/features/rapports/api";
import { CatalogueRapports } from "@/features/rapports/CatalogueRapports";
import {
  definitionRapport,
  PARAMETRES_VIDES,
  requeteGeneration,
  validerParametres,
  type ParametresRapport,
} from "@/features/rapports/catalogue";
import { bornesPeriode, periodeCorrespondante, PERIODES } from "@/features/rapports/periodes";
import { ICONES_RAPPORT, TEINTE_FAMILLE } from "@/features/rapports/presentation-rapport";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { Rapport, TypeRapport } from "@/types/rapport";
import { LienAide } from "@/features/aide/LienAide";

/** Valeur spéciale des listes facultatives (« Tous ») : un Select Radix n'accepte pas "". */
const TOUS = "__tous__";

interface RapportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Appelé avec le rapport créé (la page ouvre alors son aperçu). */
  onGenere?: (rapport: Rapport) => void;
}

/**
 * Génération d'un rapport en 2 étapes (refonte du 2026-09-28) :
 *  1. choix du type dans le catalogue en cartes ;
 *  2. paramètres utiles à ce type seulement — période (raccourcis « Ce mois »,
 *     « Mois dernier »…), véhicule, conducteur ou chantier.
 * Les règles (obligations, champs envoyés) sont dans catalogue.ts.
 */
export function RapportFormDialog({ open, onOpenChange, onGenere }: RapportFormDialogProps) {
  const [type, setType] = useState<TypeRapport | null>(null);
  const [parametres, setParametres] = useState<ParametresRapport>(PARAMETRES_VIDES);
  const genererRapport = useGenererRapport();

  useEffect(() => {
    if (!open) {
      setType(null);
      setParametres(PARAMETRES_VIDES);
    }
  }, [open]);

  const choisir = (nouveau: TypeRapport) => {
    setType(nouveau);
    // Période du mois en cours proposée d'office quand elle est demandée.
    const periode = definitionRapport(nouveau).periode;
    if (periode !== "SANS" && !parametres.dateDebutPeriode && !parametres.dateFinPeriode) {
      const { debut, fin } = bornesPeriode("CE_MOIS", new Date());
      setParametres((p) => ({ ...p, dateDebutPeriode: debut, dateFinPeriode: fin }));
    }
  };

  const generer = async () => {
    if (!type) return;
    const erreur = validerParametres(type, parametres);
    if (erreur) {
      toast.error(erreur);
      return;
    }
    try {
      const rapport = await genererRapport.mutateAsync(requeteGeneration(type, parametres));
      toast.success("Rapport généré");
      onOpenChange(false);
      onGenere?.(rapport);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Génération impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type ? "Paramètres du rapport" : "Quel rapport souhaitez-vous générer ?"}</DialogTitle>
          <DialogDescription>
            {type
              ? "Choisissez la période et, si besoin, le véhicule, le conducteur ou le chantier."
              : "Cliquez sur un rapport : vous réglerez ensuite la période et la cible."}
          </DialogDescription>
          <LienAide idPage="guide-generer-rapport" libelle="Comment faire ?" />
        </DialogHeader>

        {type === null ? (
          <CatalogueRapports onChoisir={choisir} />
        ) : (
          <ParametresType
            type={type}
            parametres={parametres}
            onChange={setParametres}
            onChangerType={() => setType(null)}
          />
        )}

        {type !== null && (
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setType(null)}>
              <ArrowLeft className="h-4 w-4" />
              Autre rapport
            </Button>
            <Button type="button" onClick={generer} disabled={genererRapport.isPending}>
              {genererRapport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Générer le rapport
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParametresType({
  type,
  parametres,
  onChange,
  onChangerType,
}: {
  type: TypeRapport;
  parametres: ParametresRapport;
  onChange: (p: ParametresRapport) => void;
  onChangerType: () => void;
}) {
  const def = definitionRapport(type);
  const Icone = ICONES_RAPPORT[def.icone];
  const besoinVehicule = def.cible === "VEHICULE" || def.filtres.includes("VEHICULE");
  const besoinConducteur = def.cible === "CONDUCTEUR" || def.filtres.includes("CONDUCTEUR");
  const { data: engins } = useEngins();
  const { data: conducteurs } = useConducteurs();
  const { data: chantiers } = useChantiers();
  const aujourdhui = useMemo(() => new Date(), []);
  const raccourci = periodeCorrespondante(parametres.dateDebutPeriode, parametres.dateFinPeriode, aujourdhui);
  const maj = (champ: keyof ParametresRapport, valeur: string) => onChange({ ...parametres, [champ]: valeur === TOUS ? "" : valeur });

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", TEINTE_FAMILLE[def.famille])}>
          <Icone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{def.titre}</p>
          <p className="text-sm text-muted-foreground">{def.description}</p>
        </div>
        <Button type="button" variant="link" size="sm" className="shrink-0" onClick={onChangerType}>
          Changer
        </Button>
      </div>

      {def.periode === "SANS" ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
          Ce rapport montre la situation d'aujourd'hui : pas de période à choisir.
        </p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            Période {def.periode === "OBLIGATOIRE" ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(facultative)</span>}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {PERIODES.map((p) => (
              <Button
                key={p.cle}
                type="button"
                size="sm"
                variant={raccourci === p.cle ? "default" : "outline"}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => {
                  const { debut, fin } = bornesPeriode(p.cle, aujourdhui);
                  onChange({ ...parametres, dateDebutPeriode: debut, dateFinPeriode: fin });
                }}
              >
                {p.libelle}
              </Button>
            ))}
            {def.periode === "FACULTATIVE" && (
              <Button
                type="button"
                size="sm"
                variant={!parametres.dateDebutPeriode && !parametres.dateFinPeriode ? "default" : "outline"}
                className="h-7 rounded-full px-3 text-xs"
                onClick={() => onChange({ ...parametres, dateDebutPeriode: "", dateFinPeriode: "" })}
              >
                Tout l'historique
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rapport-debut" className="text-xs text-muted-foreground">Du</Label>
              <Input id="rapport-debut" type="date" value={parametres.dateDebutPeriode} onChange={(e) => maj("dateDebutPeriode", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rapport-fin" className="text-xs text-muted-foreground">Au</Label>
              <Input id="rapport-fin" type="date" value={parametres.dateFinPeriode} onChange={(e) => maj("dateFinPeriode", e.target.value)} />
            </div>
          </div>
        </fieldset>
      )}

      {(besoinVehicule || besoinConducteur || def.cible === "CHANTIER") && (
        <div className={cn("grid gap-3", besoinVehicule && besoinConducteur && "sm:grid-cols-2")}>
          {besoinVehicule && (
            <ChampListe
              libelle="Véhicule"
              obligatoire={def.cible === "VEHICULE"}
              valeur={parametres.idEngin}
              onChange={(v) => maj("idEngin", v)}
              options={(engins ?? []).map((e) => ({ valeur: String(e.idEngin), libelle: libelleVehicule(e) }))}
            />
          )}
          {besoinConducteur && (
            <ChampListe
              libelle="Conducteur"
              obligatoire={def.cible === "CONDUCTEUR"}
              valeur={parametres.idConducteur}
              onChange={(v) => maj("idConducteur", v)}
              options={(conducteurs ?? []).map((c) => ({ valeur: String(c.idConducteur), libelle: `${c.nom} ${c.prenom}` }))}
            />
          )}
          {def.cible === "CHANTIER" && (
            <ChampListe
              libelle="Chantier"
              obligatoire
              valeur={parametres.idChantier}
              onChange={(v) => maj("idChantier", v)}
              options={(chantiers ?? []).map((c) => ({ valeur: String(c.idChantier), libelle: c.nom }))}
            />
          )}
        </div>
      )}
      {def.cible === "AUCUNE" && def.filtres.length === 0 && (
        <p className="text-sm text-muted-foreground">Calculé sur l'ensemble du parc.</p>
      )}
    </div>
  );
}

function ChampListe({
  libelle,
  obligatoire,
  valeur,
  onChange,
  options,
}: {
  libelle: string;
  obligatoire: boolean;
  valeur: string;
  onChange: (valeur: string) => void;
  options: { valeur: string; libelle: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">
        {libelle} {obligatoire ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(facultatif)</span>}
      </Label>
      <Select value={valeur || (obligatoire ? undefined : TOUS)} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          {!obligatoire && <SelectItem value={TOUS}>Tous</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.valeur} value={o.valeur}>
              {o.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
