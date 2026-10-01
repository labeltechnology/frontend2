import { useState } from "react";
import { Link } from "react-router-dom";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { useConformite } from "@/features/fiabilite/api";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { ETATS_DOCUMENT, NATURES_DEPASSEMENT, classeTauxObjectif, textePourcent, texteMinutes } from "@/features/fiabilite/fiabilite";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { pluriel } from "@/lib/pluriel";

const OBJECTIF = 100;

/**
 * Onglet « Conformité » (2026-09-29, question du DG « 100 % conforme ? ») :
 * taux de conformité des véhicules (documents obligatoires de leur type) et
 * des conducteurs (permis ou CACES), à la date du jour ; dépassements de
 * temps de conduite des 30 derniers jours.
 */
export function OngletConformite({ actif, peutReglerFatigue }: { actif: boolean; peutReglerFatigue: boolean }) {
  const requete = useConformite(actif);
  const [tousVehicules, setTousVehicules] = useState(false);
  const [tousConducteurs, setTousConducteurs] = useState(false);
  const d = requete.data;

  if (!d) return <EtatChargement enCours={requete.isPending} erreur={requete.error} />;

  const vehicules = tousVehicules ? d.vehicules : d.vehicules.filter((v) => !v.conforme || v.aSurveiller);
  const conducteurs = tousConducteurs ? d.conducteurs : d.conducteurs.filter((c) => !c.conforme || c.aSurveiller);
  const s = d.seuilsFatigue;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CarteChiffre
          titre="Véhicules conformes"
          valeur={textePourcent(d.tauxVehicules)}
          classeValeur={classeTauxObjectif(d.tauxVehicules, OBJECTIF)}
          precision={`${d.nombreVehiculesConformes} sur ${d.nombreVehicules} · ${d.nombreVehiculesASurveiller} à renouveler bientôt`}
        />
        <CarteChiffre
          titre="Conducteurs conformes"
          valeur={textePourcent(d.tauxConducteurs)}
          classeValeur={classeTauxObjectif(d.tauxConducteurs, OBJECTIF)}
          precision={`${d.nombreConducteursConformes} sur ${d.nombreConducteurs} · ${d.nombreConducteursASurveiller} à renouveler bientôt`}
        />
        <CarteChiffre
          titre="Temps de conduite dépassé"
          valeur={d.depassementsFatigue.length}
          classeValeur={d.depassementsFatigue.length > 0 ? "text-badge-warningFg" : undefined}
          precision="30 derniers jours"
        />
        <CarteChiffre titre="Date" valeur={<span className="text-base">{formatDate(d.date)}</span>} precision="Situation à ce jour" />
      </div>

      <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Une mission ne démarre pas si un document obligatoire du véhicule est expiré ou si le conducteur n'a pas de{" "}
        <strong className="text-foreground">permis</strong> (véhicule routier) ou de <strong className="text-foreground">CACES</strong> (engin de
        chantier) valide. Les documents exigés se règlent par type avec <strong className="text-foreground">Réglages par type</strong>.
      </p>

      <section className="space-y-2" aria-labelledby="titre-conf-vehicules">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titre-conf-vehicules" className="font-display text-lg font-semibold">
            Véhicules {tousVehicules ? "" : "non conformes ou à renouveler"}
          </h2>
          <button type="button" className="text-sm text-primary hover:underline" onClick={() => setTousVehicules((v) => !v)}>
            {tousVehicules
              ? "Afficher uniquement les anomalies"
              : d.vehicules.length < 2
                ? "Voir le véhicule"
                : `Voir les ${pluriel(d.vehicules.length, "véhicule")}`}
          </button>
        </div>
        {vehicules.length === 0 ? (
          <p className="rounded-xl border bg-card px-4 py-3 text-sm text-badge-successFg">Tous les véhicules ont leurs documents à jour.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Véhicule</th>
                  <th className="px-3 py-2">Documents obligatoires</th>
                  <th className="px-3 py-2">À faire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicules.map((v) => (
                  <tr key={v.idEngin} className={cn(!v.conforme && "bg-badge-dangerBg/30")}>
                    <td className="px-3 py-2">
                      <Link to={`/engins/${v.idEngin}/fiche`} className="font-medium hover:underline">
                        {v.libelleVehicule}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{v.libelleType}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {v.documents.map((doc) => (
                          <span key={doc.type} title={doc.dateExpiration ? `Expire le ${formatDate(doc.dateExpiration)}` : undefined}>
                            <Pastille libelle={`${doc.libelle.charAt(0).toUpperCase()}${doc.libelle.slice(1)} : ${ETATS_DOCUMENT[doc.etat].libelle.toLowerCase()}`} classes={ETATS_DOCUMENT[doc.etat].classes} />
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs">{v.motifs.join(" ; ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="titre-conf-conducteurs">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titre-conf-conducteurs" className="font-display text-lg font-semibold">
            Conducteurs {tousConducteurs ? "" : "non conformes ou à renouveler"}
          </h2>
          <button type="button" className="text-sm text-primary hover:underline" onClick={() => setTousConducteurs((v) => !v)}>
            {tousConducteurs
              ? "Afficher uniquement les anomalies"
              : d.conducteurs.length < 2
                ? "Voir le conducteur"
                : `Voir les ${pluriel(d.conducteurs.length, "conducteur")}`}
          </button>
        </div>
        {conducteurs.length === 0 ? (
          <p className="rounded-xl border bg-card px-4 py-3 text-sm text-badge-successFg">Tous les conducteurs ont une qualification valide.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Conducteur</th>
                  <th className="px-3 py-2">Qualification</th>
                  <th className="px-3 py-2">Expire le</th>
                  <th className="px-3 py-2 text-right">Dépassements (30 j)</th>
                  <th className="px-3 py-2">À faire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conducteurs.map((c) => (
                  <tr key={c.idConducteur} className={cn(!c.conforme && "bg-badge-dangerBg/30")}>
                    <td className="px-3 py-2 font-medium">{c.nom}</td>
                    <td className="px-3 py-2">{c.qualification}</td>
                    <td className="px-3 py-2 tabular-nums">{formatDate(c.dateExpiration)}</td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", c.depassementsFatigue > 0 && "font-medium text-badge-warningFg")}>
                      {c.depassementsFatigue}
                    </td>
                    <td className="px-3 py-2 text-xs">{c.motifs.join(" ; ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="titre-fatigue">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="titre-fatigue" className="font-display text-lg font-semibold">Fatigue au volant (30 derniers jours)</h2>
          {peutReglerFatigue && (
            <Link to="/parametres" className="text-sm text-primary hover:underline">
              Régler les seuils →
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {s.actif ? "Surveillance active" : "Surveillance désactivée"} : au plus {texteMinutes(s.conduiteContinueMaxMinutes)} de conduite sans pause
          d'au moins {texteMinutes(s.pauseMinimaleMinutes)}, et {texteMinutes(s.conduiteJournaliereMaxMinutes)} par jour. Calcul sur les positions
          GPS en mouvement ; le conducteur est celui de la mission, sinon de l'affectation.
        </p>
        {d.depassementsFatigue.length === 0 ? (
          <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Aucun dépassement.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Conducteur</th>
                  <th className="px-3 py-2">Véhicule</th>
                  <th className="px-3 py-2">Nature</th>
                  <th className="px-3 py-2">Début</th>
                  <th className="px-3 py-2 text-right">Durée</th>
                  <th className="px-3 py-2 text-right">Seuil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.depassementsFatigue.map((f) => (
                  <tr key={f.idDepassementFatigue}>
                    <td className="px-3 py-2 font-medium">{f.nomConducteur ?? <span className="text-muted-foreground">Inconnu</span>}</td>
                    <td className="px-3 py-2">{f.libelleVehicule ?? "—"}</td>
                    <td className="px-3 py-2">{NATURES_DEPASSEMENT[f.nature]}</td>
                    <td className="px-3 py-2 tabular-nums">{f.nature === "CONDUITE_JOURNALIERE" ? formatDate(f.jour) : formatDateTime(f.debut)}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-badge-warningFg">{texteMinutes(f.dureeMinutes)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{texteMinutes(f.seuilMinutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
