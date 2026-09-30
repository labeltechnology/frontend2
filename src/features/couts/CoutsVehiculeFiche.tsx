import { useEffect, useState } from "react";
import { Loader2, Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCoutVehicule, useEnregistrerCoutVehicule } from "@/features/couts/api";
import {
  MODES_ACQUISITION,
  requeteCoutVehicule,
  texteMontant,
  valeursCoutVehicule,
  type ValeursCoutVehicule,
} from "@/features/couts/couts";
import { ApiError } from "@/lib/api-client";
import type { ModeAcquisition } from "@/types/couts";

interface Props {
  idEngin: number;
  /** Capacité GERER_PARC ; sinon lecture seule. */
  peutModifier: boolean;
}

/**
 * Onglet « Coûts » de la fiche véhicule (2026-09-29) : acquisition (achat
 * amorti, location longue durée ou crédit-bail) et charges annuelles. Sert au
 * coût complet (TCO) de la page Coûts et rentabilité.
 */
export function CoutsVehiculeFiche({ idEngin, peutModifier }: Props) {
  const { data, isLoading } = useCoutVehicule(idEngin);
  const enregistrer = useEnregistrerCoutVehicule(idEngin);
  const [valeurs, setValeurs] = useState<ValeursCoutVehicule>(valeursCoutVehicule(undefined));

  useEffect(() => {
    if (data) setValeurs(valeursCoutVehicule(data));
  }, [data]);

  if (isLoading) return <Skeleton className="h-80 w-full" />;

  const changer = (cle: keyof ValeursCoutVehicule) => (e: { target: { value: string } }) =>
    setValeurs((v) => ({ ...v, [cle]: e.target.value }));
  const achat = valeurs.modeAcquisition === "ACHAT";

  const valider = async () => {
    const requete = requeteCoutVehicule(valeurs);
    if (typeof requete === "string") return toast.error(requete);
    try {
      await enregistrer.mutateAsync(requete);
      toast.success("Coûts du véhicule enregistrés");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const champ = (cle: keyof ValeursCoutVehicule, libelle: string, aide?: string, type: "number" | "date" = "number") => (
    <div className="space-y-1.5">
      <Label htmlFor={`cout-${cle}`}>{libelle}</Label>
      <Input id={`cout-${cle}`} type={type} min={0} value={valeurs[cle]} onChange={changer(cle)} disabled={!peutModifier} />
      {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5" aria-hidden="true" />
          Coûts du véhicule
        </CardTitle>
        <CardDescription>
          Coûts fixes du véhicule, ajoutés au carburant, à la maintenance et aux incidents pour calculer son coût complet (TCO). Tout est
          facultatif ; montants en Ariary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Acquisition</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Mode d'acquisition</Label>
              <Select
                value={valeurs.modeAcquisition}
                onValueChange={(v) => setValeurs((anciennes) => ({ ...anciennes, modeAcquisition: v as ModeAcquisition }))}
                disabled={!peutModifier}
              >
                <SelectTrigger aria-label="Mode d'acquisition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MODES_ACQUISITION) as ModeAcquisition[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODES_ACQUISITION[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {champ("prixAchat", achat ? "Prix d'achat" : "Valeur du véhicule (information)")}
            {achat ? (
              <>
                {champ("dateDebutAmortissement", "Début de l'amortissement", "Vide = date d'acquisition de la fiche.", "date")}
                {champ("dureeAmortissementMois", "Durée d'amortissement (mois)", "Exemple : 60 pour 5 ans.")}
                {champ("valeurResiduelle", "Valeur résiduelle", "Valeur de revente estimée en fin d'amortissement.")}
              </>
            ) : (
              champ("loyerMensuel", "Loyer mensuel")
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Charges annuelles</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {champ("primeAssuranceAnnuelle", "Prime d'assurance")}
            {champ("taxesAnnuelles", "Taxes")}
            {champ("vignetteAnnuelle", "Vignette")}
            {champ("autresChargesAnnuelles", "Autres charges", "Parking, abonnement GPS…")}
          </div>
          <p className="text-xs text-muted-foreground">Les pneus se suivent en maintenance, sur le poste d'entretien « Remplacement des pneus ».</p>
        </section>

        {data && (
          <dl className="grid gap-3 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Amortissement mensuel</dt>
              <dd className="font-semibold tabular-nums">{texteMontant(data.amortissementMensuel)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Valeur nette aujourd'hui</dt>
              <dd className="font-semibold tabular-nums">{texteMontant(data.valeurNetteComptable)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Charges annuelles</dt>
              <dd className="font-semibold tabular-nums">{texteMontant(data.chargesAnnuellesTotales)}</dd>
            </div>
          </dl>
        )}

        {peutModifier && (
          <div className="flex justify-end">
            <Button onClick={valider} disabled={enregistrer.isPending}>
              {enregistrer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer les coûts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
