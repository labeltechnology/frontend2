import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowDownToLine, ArrowUpFromLine, CalendarClock, FileSpreadsheet, FileText, Fuel, Handshake, Receipt, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useCarburant } from "@/features/carburant/api";
import { carburantDuMois } from "@/features/dashboard/indicateurs";
import {
  aTraiterFinances,
  contratsActifs,
  echeancesContrats,
  facturesEnAttente,
  maintenanceDuMois,
  totalParSens,
} from "@/features/dashboard/metier/finances";
import { lignesEcheances, lignesFactures } from "@/features/dashboard/metier/lignes";
import { useToutesFacturesGarage, useToutesFacturesLocation, useToutesFacturesLocationEntrante } from "@/features/dashboard/metier/metier-api";
import { ListeLiens } from "@/features/dashboard/metier/sections/ListeLiens";
import { CarburantDuMois } from "@/features/dashboard/sections/CarburantDuMois";
import { CarteIndicateur } from "@/features/dashboard/sections/CarteIndicateur";
import { EnTeteTableauBord } from "@/features/dashboard/sections/EnTeteTableauBord";
import { PanneauATraiter } from "@/features/dashboard/sections/PanneauATraiter";
import { useContratsLocationEntrante } from "@/features/location-entrante/api";
import { useContratsLocationExterne } from "@/features/location-externe/api";
import { useMaintenances } from "@/features/maintenance/api";
import { libelleRole, peut } from "@/lib/droits";
import { formatMontant, formatNombre } from "@/lib/utils";
import { pluriel } from "@/lib/pluriel";

/**
 * Tableau de bord des finances (pages par métier, 2026-09-30) — comptable.
 *
 *  1. Six indicateurs : carburant et maintenance du mois, factures à régler,
 *     factures à encaisser, contrats de location actifs, échéances à 30 jours.
 *  2. « À traiter » (factures anciennes, contrats dépassés ou à échéance,
 *     interventions de garage sans facture) + factures en attente.
 *  3. Contrats à échéance + carburant du mois par semaine.
 *
 * Calculs dans finances.ts (purs, testés).
 */
export function TableauBordFinances() {
  const { session } = useAuth();
  const finances = peut(session?.role, "VOIR_FINANCES");
  const pleins = useCarburant();
  const maintenances = useMaintenances();
  const sortants = useContratsLocationExterne();
  const entrants = useContratsLocationEntrante();
  const facturesGarage = useToutesFacturesGarage(finances);
  const facturesEmises = useToutesFacturesLocation(finances);
  const facturesRecues = useToutesFacturesLocationEntrante(finances);

  const maintenant = useMemo(() => new Date(), []);
  const charge = (q: { isPending: boolean; isError: boolean }) => q.isPending && !q.isError;
  const chargeFactures = charge(facturesGarage) || charge(facturesEmises) || charge(facturesRecues);
  const erreurFactures = facturesGarage.isError || facturesEmises.isError || facturesRecues.isError;

  const carburant = useMemo(() => carburantDuMois(pleins.data ?? [], maintenant), [pleins.data, maintenant]);
  const atelier = useMemo(() => maintenanceDuMois(maintenances.data ?? [], maintenant), [maintenances.data, maintenant]);
  const factures = useMemo(
    () =>
      facturesEnAttente(
        { garage: facturesGarage.data ?? [], locationsRecues: facturesRecues.data ?? [], locationsEmises: facturesEmises.data ?? [] },
        maintenant,
      ),
    [facturesGarage.data, facturesRecues.data, facturesEmises.data, maintenant],
  );
  const contrats = useMemo(() => ({ sortants: sortants.data ?? [], entrants: entrants.data ?? [] }), [sortants.data, entrants.data]);
  const echeances = useMemo(() => echeancesContrats(contrats, maintenant), [contrats, maintenant]);
  const actifs = contratsActifs(contrats);
  const aRegler = totalParSens(factures, "A_PAYER");
  const aEncaisser = totalParSens(factures, "A_ENCAISSER");

  const aTraiter = useMemo(
    () =>
      aTraiterFinances({
        factures,
        echeances,
        maintenances: maintenances.data ?? [],
        facturesGarage: facturesGarage.isSuccess ? facturesGarage.data : null,
        aujourdhui: maintenant,
      }),
    [factures, echeances, maintenances.data, facturesGarage.isSuccess, facturesGarage.data, maintenant],
  );
  const sourcesIndisponibles = [
    erreurFactures && "factures",
    (sortants.isError || entrants.isError) && "contrats de location",
    maintenances.isError && "maintenances",
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <EnTeteTableauBord
        date={format(maintenant, "EEEE d MMMM yyyy", { locale: fr })}
        salutation={`Bonjour${session ? ` — ${libelleRole(session.role)}` : ""}`}
        sousTitre={<p className="text-sm text-muted-foreground">Dépenses du mois, factures et contrats de location.</p>}
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link to="/couts">
                <FileText className="h-4 w-4" />
                Coûts du parc
              </Link>
            </Button>
            {finances && (
              <Button size="sm" asChild>
                <Link to="/export-comptable">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export comptable
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <CarteIndicateur
          titre="Carburant du mois"
          valeur={formatMontant(carburant.montant)}
          precision={`${formatNombre(carburant.litres)} L — ${pluriel(carburant.pleins, "plein")}`}
          icone={Fuel}
          ton="info"
          lien="/carburant"
          enChargement={charge(pleins)}
        />
        <CarteIndicateur
          titre="Maintenance du mois"
          valeur={formatMontant(atelier.montant)}
          precision={`${pluriel(atelier.interventions, "intervention terminée")}${atelier.montantExterne > 0 ? `, dont ${formatMontant(atelier.montantExterne)} en garage` : ""}`}
          icone={Wrench}
          ton="info"
          lien="/maintenance"
          enChargement={charge(maintenances)}
        />
        <CarteIndicateur
          titre="À régler"
          valeur={formatMontant(aRegler.montant)}
          precision={pluriel(aRegler.nombre, "facture de garage ou de location", "factures de garage et de location")}
          icone={ArrowUpFromLine}
          ton={aRegler.nombre > 0 ? "alerte" : "succes"}
          lien="/garages-externes"
          enChargement={chargeFactures}
        />
        <CarteIndicateur
          titre="À encaisser"
          valeur={formatMontant(aEncaisser.montant)}
          precision={pluriel(aEncaisser.nombre, "facture de location émise", "factures de location émises")}
          icone={ArrowDownToLine}
          ton={aEncaisser.nombre > 0 ? "info" : "neutre"}
          lien="/locations-externes"
          enChargement={chargeFactures}
        />
        <CarteIndicateur
          titre="Contrats de location"
          valeur={actifs.sortants + actifs.entrants}
          precision={`${pluriel(actifs.sortants, "loué")} à des clients, ${actifs.entrants} pris en location`}
          icone={Handshake}
          ton="neutre"
          lien="/locations-externes"
          enChargement={charge(sortants) || charge(entrants)}
        />
        <CarteIndicateur
          titre="Échéances sous 30 jours"
          valeur={echeances.length}
          precision={
            echeances.some((e) => e.jours < 0)
              ? `dont ${pluriel(echeances.filter((e) => e.jours < 0).length, "dépassée")}`
              : "fins de contrat à préparer"
          }
          icone={CalendarClock}
          ton={echeances.some((e) => e.jours < 0) ? "danger" : echeances.length > 0 ? "alerte" : "succes"}
          lien="/locations-entrantes"
          enChargement={charge(sortants) || charge(entrants)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <PanneauATraiter
          elements={aTraiter}
          enChargement={chargeFactures || charge(sortants) || charge(entrants) || charge(maintenances)}
          sourcesIndisponibles={sourcesIndisponibles}
        />
        <ListeLiens
          titre="Factures en attente"
          icone={Receipt}
          lignes={lignesFactures(factures)}
          enChargement={chargeFactures}
          enErreur={erreurFactures}
          vide="Aucune facture en attente de paiement."
          nombreVisible={7}
          pied={`À régler : ${formatMontant(aRegler.montant)} — à encaisser : ${formatMontant(aEncaisser.montant)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ListeLiens
          titre="Contrats à échéance"
          icone={CalendarClock}
          lignes={lignesEcheances(echeances)}
          enChargement={charge(sortants) || charge(entrants)}
          enErreur={sortants.isError || entrants.isError}
          vide="Aucun contrat de location ne se termine dans les 30 jours."
        />
        <CarburantDuMois
          donnees={carburant}
          mois={format(maintenant, "LLLL yyyy", { locale: fr })}
          enChargement={charge(pleins)}
          enErreur={pleins.isError}
        />
      </div>
    </div>
  );
}
