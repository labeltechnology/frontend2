import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnalyseChantiers } from "@/features/chantiers/analyse/analyse-api";
import { COULEURS_TYPES, hauteur, libelleMois, moisLePlusCharge, typesDeLaPrevision } from "@/features/chantiers/analyse/analyse";
import { BarresPareto } from "@/features/chantiers/defaillances/BarresPareto";
import { TypesChantierCarte } from "@/features/chantiers/organisation/TypesChantierCarte";
import { cn, formatMontant, formatNombre } from "@/lib/utils";
import type { PrevisionMois } from "@/types/chantier";

/**
 * Onglet « Analyse » de la page Chantiers (V64, 2026-09-29) : rendement du
 * matériel par type de chantier, matériel mal adapté, charge prévue par mois
 * (12 mois passés, 6 à venir) et causes des défaillances sur 12 mois.
 */
export function AnalyseChantiersTab({ gestion }: { gestion: boolean }) {
  const { data, isLoading, isError } = useAnalyseChantiers();

  return (
    <div className="space-y-5">
      {isLoading && <p className="text-sm text-muted-foreground">Analyse en cours…</p>}
      {isError && <p className="text-sm text-destructive">Impossible de calculer l'analyse.</p>}
      {data && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rendement par type de chantier</CardTitle>
              <CardDescription>Chantiers en cours ou terminés, coûts réels à ce jour, heures du journal.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.parType.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun chantier démarré.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Chantiers</TableHead>
                      <TableHead className="text-right">Jours-véhicule</TableHead>
                      <TableHead className="text-right">h / jour-véhicule</TableHead>
                      <TableHead className="text-right">Coût / heure</TableHead>
                      <TableHead className="text-right">Coût / jour</TableHead>
                      <TableHead className="text-right">Défaillances / 100 j</TableHead>
                      <TableHead className="text-right">Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.parType.map((t) => (
                      <TableRow key={t.typeChantier}>
                        <TableCell className="font-medium">{t.typeChantier}</TableCell>
                        <TableCell className="text-right">{t.chantiers}</TableCell>
                        <TableCell className="text-right">{formatNombre(t.joursVehicules)}</TableCell>
                        <TableCell className="text-right">{t.heuresParJourVehicule == null ? "—" : formatNombre(t.heuresParJourVehicule, 1)}</TableCell>
                        <TableCell className="text-right">{formatMontant(t.coutParHeure)}</TableCell>
                        <TableCell className="text-right">{formatMontant(t.coutParJourVehicule)}</TableCell>
                        <TableCell className="text-right">{t.defaillancesPour100Jours == null ? "—" : formatNombre(t.defaillancesPour100Jours, 1)}</TableCell>
                        <TableCell className="text-right">{t.noteMoyenne == null ? "—" : `${formatNombre(t.noteMoyenne, 1)} / 5`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Matériel et type de chantier</CardTitle>
              <CardDescription>
                Chaque type de véhicule comparé à lui-même sur l'ensemble des chantiers : coût par heure, défaillances, notes des
                chantiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.adaptation.length === 0 ? (
                <p className="text-sm text-muted-foreground">Pas encore de données.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Véhicule / chantier</TableHead>
                      <TableHead className="text-right">Jours</TableHead>
                      <TableHead className="text-right">Coût / h (réf.)</TableHead>
                      <TableHead className="text-right">Défaillances / 100 j (réf.)</TableHead>
                      <TableHead className="text-right">Note</TableHead>
                      <TableHead>Constat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.adaptation.map((a) => (
                      <TableRow key={`${a.typeEngin}-${a.typeChantier}`}>
                        <TableCell>
                          <div className="font-medium">{a.typeEngin}</div>
                          <div className="text-xs text-muted-foreground">{a.typeChantier}</div>
                        </TableCell>
                        <TableCell className="text-right">{formatNombre(a.joursVehicules)}</TableCell>
                        <TableCell className="text-right">
                          {formatMontant(a.coutParHeure)}
                          <div className="text-xs text-muted-foreground">{formatMontant(a.coutParHeureReference)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {a.defaillancesPour100Jours == null ? "—" : formatNombre(a.defaillancesPour100Jours, 1)}
                          <div className="text-xs text-muted-foreground">
                            {a.defaillancesPour100JoursReference == null ? "—" : formatNombre(a.defaillancesPour100JoursReference, 1)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{a.noteMoyenne == null ? "—" : `${formatNombre(a.noteMoyenne, 1)} / 5`}</TableCell>
                        <TableCell>
                          {a.malAdapte ? (
                            <div className="space-y-1">
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Mal adapté
                              </Badge>
                              {a.motifs.map((m) => (
                                <div key={m} className="text-xs text-muted-foreground">
                                  {m}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="success">Adapté</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <PrevisionCarte prevision={data.prevision} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Causes des défaillances (12 mois, tout le parc)</CardTitle>
              <CardDescription>Incidents et maintenances correctives dont la cause est renseignée.</CardDescription>
            </CardHeader>
            <CardContent>
              <BarresPareto lignes={data.pareto} />
            </CardContent>
          </Card>
        </>
      )}
      <TypesChantierCarte modifiable={gestion} />
    </div>
  );
}

function PrevisionCarte({ prevision }: { prevision: PrevisionMois[] }) {
  const types = typesDeLaPrevision(prevision);
  const pic = moisLePlusCharge(prevision);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Charge prévue des chantiers</CardTitle>
        <CardDescription>
          Jours-véhicule prévus par mois et par type de chantier (12 mois passés, 6 à venir).
          {pic && ` Pic : ${libelleMois(pic.mois)} (${formatNombre(pic.total)} jours-véhicule).`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Charge prévue par mois">
          {prevision.map((m) => (
            <div key={m.mois} className="flex h-full flex-1 flex-col justify-end" title={`${libelleMois(m.mois)} : ${m.total} jours-véhicule`}>
              {types.map((t, i) =>
                m.joursParType[t] ? (
                  <div key={t} className={cn(COULEURS_TYPES[i % COULEURS_TYPES.length], !m.passe && "opacity-60")}
                    style={{ height: `${hauteur(m.joursParType[t], prevision)}%` }} />
                ) : null,
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1 text-[10px] text-muted-foreground">
          {prevision.map((m) => (
            <span key={m.mois} className="flex-1 text-center">
              {libelleMois(m.mois)}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {types.map((t, i) => (
            <span key={t} className="flex items-center gap-1">
              <span className={cn("h-2.5 w-2.5 rounded-sm", COULEURS_TYPES[i % COULEURS_TYPES.length])} />
              {t}
            </span>
          ))}
          <span className="text-muted-foreground">Les mois à venir sont affichés en couleur claire.</span>
        </div>
      </CardContent>
    </Card>
  );
}
