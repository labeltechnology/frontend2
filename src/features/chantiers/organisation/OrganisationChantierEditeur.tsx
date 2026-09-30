import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResponsablesPossibles, useTypesChantier } from "@/features/chantiers/organisation/organisation-api";
import {
  LIBELLES_PRIORITE,
  problemeOrganisation,
  RAYON_PRESENCE_DEFAUT,
  type OrganisationSaisie,
} from "@/features/chantiers/organisation/organisation";
import { libelleRole } from "@/lib/droits";
import type { PrioriteChantier } from "@/types/chantier";

const AUCUN = "aucun";
const PRIORITES: PrioriteChantier[] = ["NORMALE", "HAUTE", "CRITIQUE"];

/**
 * Organisation du chantier dans la fiche (V64, 2026-09-29) : type, priorité,
 * chef de chantier responsable, rayon de présence GPS, budget matériel et
 * client refacturé. Enregistrée avec la fiche.
 */
export function OrganisationChantierEditeur({
  valeur,
  onChange,
  lectureSeule,
  nomResponsableActuel,
}: {
  valeur: OrganisationSaisie;
  onChange: (valeur: OrganisationSaisie) => void;
  lectureSeule: boolean;
  /** Nom affiché quand la liste des comptes n'est pas accessible (lecture seule). */
  nomResponsableActuel?: string | null;
}) {
  const { data: types } = useTypesChantier();
  const responsables = useResponsablesPossibles(!lectureSeule);
  const probleme = problemeOrganisation(valeur);
  const maj = (modif: Partial<OrganisationSaisie>) => onChange({ ...valeur, ...modif });
  const typesProposes = (types ?? []).filter((t) => t.actif || t.idTypeChantier === valeur.idTypeChantier);

  return (
    <fieldset disabled={lectureSeule} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Type de chantier</Label>
          <Select
            value={valeur.idTypeChantier == null ? AUCUN : String(valeur.idTypeChantier)}
            onValueChange={(v) => maj({ idTypeChantier: v === AUCUN ? null : Number(v) })}
          >
            <SelectTrigger aria-label="Type de chantier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUCUN}>Non précisé</SelectItem>
              {typesProposes.map((t) => (
                <SelectItem key={t.idTypeChantier} value={String(t.idTypeChantier)}>
                  {t.libelle}
                  {t.facteurEntretien < 1 ? " (conditions sévères)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priorité</Label>
          <Select value={valeur.priorite} onValueChange={(v) => maj({ priorite: v as PrioriteChantier })}>
            <SelectTrigger aria-label="Priorité du chantier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITES.map((p) => (
                <SelectItem key={p} value={p}>
                  {LIBELLES_PRIORITE[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {valeur.priorite === "CRITIQUE" && (
            <p className="text-xs text-muted-foreground">Les véhicules réservés aux chantiers critiques peuvent y être déposés.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Chef de chantier</Label>
          {lectureSeule || !responsables.data ? (
            <Input value={nomResponsableActuel ?? "—"} readOnly aria-label="Chef de chantier" />
          ) : (
            <Select
              value={valeur.idResponsable == null ? AUCUN : String(valeur.idResponsable)}
              onValueChange={(v) => maj({ idResponsable: v === AUCUN ? null : Number(v) })}
            >
              <SelectTrigger aria-label="Chef de chantier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUCUN}>Aucun</SelectItem>
                {responsables.data.map((r) => (
                  <SelectItem key={r.idUtilisateur} value={String(r.idUtilisateur)}>
                    {r.nom ?? `Compte n° ${r.idUtilisateur}`} — {libelleRole(r.role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rayon-presence">Rayon de présence GPS (m)</Label>
          <Input
            id="rayon-presence"
            inputMode="numeric"
            placeholder={`${RAYON_PRESENCE_DEFAUT} (par défaut)`}
            value={valeur.rayon}
            onChange={(e) => maj({ rayon: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Utilisé autour des zones et de la position du chantier pour savoir si un véhicule est sur place.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget-materiel">Budget matériel (Ar)</Label>
          <Input
            id="budget-materiel"
            inputMode="decimal"
            placeholder="Facultatif"
            value={valeur.budget}
            onChange={(e) => maj({ budget: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-nom">Client refacturé</Label>
          <Input id="client-nom" value={valeur.clientNom} maxLength={150} onChange={(e) => maj({ clientNom: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-contact">Contact du client</Label>
          <Input
            id="client-contact"
            value={valeur.clientContact}
            maxLength={255}
            onChange={(e) => maj({ clientContact: e.target.value })}
          />
        </div>
      </div>
      {probleme && <p className="text-sm text-destructive">{probleme}</p>}
    </fieldset>
  );
}
