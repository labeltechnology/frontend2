import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { ListeDemandes } from "@/features/chantiers/demandes/ListeDemandes";
import { useDemandes, useIndicateursDemandes } from "@/features/chantiers/demandes/demandes-api";
import { LIBELLES_STATUT_DEMANDE, libelleDelai } from "@/features/chantiers/demandes/demandes";
import { ReservesCritiquesCarte } from "@/features/chantiers/organisation/ReservesCritiquesCarte";
import type { StatutDemande } from "@/types/chantier";

const TOUTES = "TOUTES";
const STATUTS: StatutDemande[] = ["EN_ATTENTE", "ACCEPTEE", "SERVIE", "REFUSEE", "ANNULEE"];

/**
 * Onglet « Demandes » de la page Chantiers (V64) : toutes les demandes de
 * matériel visibles (le chef de chantier ne voit que les siennes), délais
 * moyens et matériel réservé aux chantiers critiques.
 */
export function DemandesChantiersTab({ gestion, idUtilisateur }: { gestion: boolean; idUtilisateur: number | undefined }) {
  const { data, isLoading, isError } = useDemandes();
  const { data: ind } = useIndicateursDemandes();
  const [statut, setStatut] = useState<string>("EN_ATTENTE");
  const visibles = (data ?? []).filter((d) => statut === TOUTES || d.statut === statut);

  return (
    <div className="space-y-4">
      {ind && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CarteChiffre titre="En attente" valeur={ind.enAttente} classeValeur={ind.enAttenteCritiques > 0 ? "text-destructive" : undefined}
            precision={`dont ${ind.enAttenteCritiques} critique(s)`} />
          <CarteChiffre titre="Délai moyen de réponse" valeur={libelleDelai(ind.delaiMoyenReponseHeures, "h")} />
          <CarteChiffre titre="Délai moyen demande → service" valeur={libelleDelai(ind.delaiMoyenServiceJours, "j")} />
          <CarteChiffre titre="Taux d'acceptation" valeur={ind.tauxAcceptation == null ? "—" : `${ind.tauxAcceptation} %`}
            precision={`${ind.servies} servie(s), ${ind.acceptees} à servir`} />
        </div>
      )}
      <Select value={statut} onValueChange={setStatut}>
        <SelectTrigger className="sm:w-56" aria-label="Filtrer par statut">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TOUTES}>Toutes</SelectItem>
          {STATUTS.map((s) => (
            <SelectItem key={s} value={s}>
              {LIBELLES_STATUT_DEMANDE[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && <p className="text-sm text-muted-foreground">Chargement des demandes…</p>}
      {isError && <p className="text-sm text-destructive">Impossible de charger les demandes.</p>}
      {data && <ListeDemandes demandes={visibles} avecChantier gestion={gestion} idUtilisateur={idUtilisateur} />}
      <ReservesCritiquesCarte modifiable={gestion} />
    </div>
  );
}
