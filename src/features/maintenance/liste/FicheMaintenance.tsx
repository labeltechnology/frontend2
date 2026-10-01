import type { ReactNode } from "react";
import { CalendarClock, MessagesSquare, PackagePlus, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import {
  coutAffiche,
  dureeImmobilisation,
  estEnRetard,
  LIBELLES_TYPE_MAINTENANCE,
} from "@/features/maintenance/liste/maintenance-liste";
import { useMaintenanceProforma } from "@/features/maintenance/proforma-api";
import { formatDate, formatDateTime, formatMontant, formatNombre } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { Maintenance } from "@/types/maintenance";

interface FicheMaintenanceProps {
  maintenance: Maintenance | null;
  onFermer: () => void;
  /** Droit maintenance (GERER_MAINTENANCE) : sans lui, fiche en lecture seule. */
  peutAgir: boolean;
  onDemarrer: (m: Maintenance) => void;
  onAjouterPiece: (m: Maintenance) => void;
  onTerminer: (m: Maintenance) => void;
  onReplanifier: (m: Maintenance) => void;
  /** Absent = discussion indisponible pour ce profil. */
  onDiscussion?: (m: Maintenance) => void;
  demarrageEnCours?: boolean;
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titre}</h3>
      {children}
    </section>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{libelle}</dt>
      <dd className="text-right font-medium">{valeur}</dd>
    </div>
  );
}

/**
 * Fiche détaillée d'une maintenance (2026-09-28), en panneau latéral :
 * planification, travaux, pièces (stock et garage), coûts, proforma,
 * facture, et les actions du moment (démarrer, ajouter une pièce, terminer).
 */
export function FicheMaintenance({
  maintenance: m,
  onFermer,
  peutAgir,
  onDemarrer,
  onAjouterPiece,
  onTerminer,
  onReplanifier,
  onDiscussion,
  demarrageEnCours = false,
}: FicheMaintenanceProps) {
  const garage = m?.idGarageExterne != null;
  const proforma = useMaintenanceProforma(m && garage ? m.idMaintenance : undefined);
  const maintenant = new Date();

  return (
    <Sheet open={m !== null} onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <SheetContent>
        {m && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <StatutBadge statut={m.statut} />
                <span className="text-xs text-muted-foreground">
                  {LIBELLES_TYPE_MAINTENANCE[m.type]} · {m.nomGarageExterne ?? "Atelier interne"}
                </span>
              </div>
              <SheetTitle>{libelleVehicule(m.engin)}</SheetTitle>
              <SheetDescription>
                Maintenance n° {m.idMaintenance}
                {m.engin?.kilometrage != null && ` · ${formatNombre(m.engin.kilometrage)} km au compteur`}
              </SheetDescription>
            </SheetHeader>

            {peutAgir && m.statut !== "TERMINEE" && (
              <div className="flex flex-wrap gap-2">
                {m.statut === "PLANIFIEE" && (
                  <>
                    <Button size="sm" onClick={() => onDemarrer(m)} disabled={demarrageEnCours}>
                      <Play className="h-4 w-4" />
                      Démarrer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReplanifier(m)}>
                      <CalendarClock className="h-4 w-4" />
                      Replanifier
                    </Button>
                  </>
                )}
                {m.statut === "EN_COURS" && (
                  <Button size="sm" variant="outline" onClick={() => onAjouterPiece(m)}>
                    <PackagePlus className="h-4 w-4" />
                    Ajouter une pièce
                  </Button>
                )}
                {m.statut === "EN_COURS" && (
                  <Button size="sm" onClick={() => onTerminer(m)}>
                    <Square className="h-4 w-4" />
                    Terminer
                  </Button>
                )}
                {onDiscussion && (
                  <Button size="sm" variant="ghost" onClick={() => onDiscussion(m)}>
                    <MessagesSquare className="h-4 w-4" />
                    Discussion
                  </Button>
                )}
              </div>
            )}

            <Section titre="Planification">
              <dl className="space-y-1">
                <Ligne
                  libelle="Date prévue"
                  valeur={
                    m.datePrevue ? (
                      <span className={estEnRetard(m, maintenant) ? "text-badge-warningFg" : undefined}>
                        {formatDateTime(m.datePrevue)}
                        {estEnRetard(m, maintenant) && " (en retard)"}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <Ligne libelle="Début" valeur={formatDateTime(m.dateDebut)} />
                <Ligne libelle="Fin" valeur={formatDateTime(m.dateFin)} />
                <Ligne libelle="Immobilisation" valeur={dureeImmobilisation(m, maintenant) ?? "—"} />
                {m.libellePosteEntretien && <Ligne libelle="Poste d'entretien" valeur={m.libellePosteEntretien} />}
                {m.prochaineDateEntretien && <Ligne libelle="Prochaine échéance" valeur={formatDate(m.prochaineDateEntretien)} />}
              </dl>
            </Section>

            <Section titre="Travaux">
              {m.travaux.length === 0 && !m.description ? (
                <p className="text-sm text-muted-foreground">Aucun travail précisé.</p>
              ) : (
                <>
                  {m.travaux.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {m.travaux.map((t) => (
                        <li key={t.idTravailMaintenance} className="rounded bg-muted px-2 py-0.5 text-xs">
                          {t.libelle}
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.description && <p className="whitespace-pre-line text-sm">{m.description}</p>}
                </>
              )}
            </Section>

            <Section titre={garage ? "Pièces facturées par le garage" : "Pièces du stock"}>
              {(garage ? m.piecesExternes.length : m.piecesUtilisees.length) === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune pièce.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1 text-left font-normal">Pièce</th>
                      <th className="py-1 text-right font-normal">Qté</th>
                      <th className="py-1 text-right font-normal">Prix unit.</th>
                      <th className="py-1 text-right font-normal">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {garage
                      ? m.piecesExternes.map((p) => (
                          <tr key={p.idLignePieceExterne} className="border-t">
                            <td className="py-1">{p.designation}</td>
                            <td className="py-1 text-right tabular-nums">{formatNombre(p.quantite)}</td>
                            <td className="py-1 text-right tabular-nums">{formatMontant(p.prixUnitaire)}</td>
                            <td className="py-1 text-right tabular-nums">{formatMontant(p.montant)}</td>
                          </tr>
                        ))
                      : m.piecesUtilisees.map((p, i) => (
                          <tr key={`${p.idPiece}-${i}`} className="border-t">
                            <td className="py-1">{p.nomPiece}</td>
                            <td className="py-1 text-right tabular-nums">{formatNombre(p.quantiteUtilisee)}</td>
                            <td className="py-1 text-right tabular-nums">{formatMontant(p.prixUnitaireApplique)}</td>
                            <td className="py-1 text-right tabular-nums">
                              {formatMontant(p.quantiteUtilisee * p.prixUnitaireApplique)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              )}
            </Section>

            <Section titre="Coûts">
              <dl className="space-y-1">
                <Ligne libelle="Main-d'œuvre" valeur={formatMontant(m.coutMainOeuvre)} />
                <Ligne
                  libelle={coutAffiche(m).provisoire ? "Total (provisoire)" : "Total"}
                  valeur={formatMontant(coutAffiche(m).montant)}
                />
                {garage && (
                  <Ligne
                    libelle="Facture pro forma du garage"
                    valeur={
                      proforma.isPending && !proforma.isError
                        ? "…"
                        : proforma.data
                          ? (proforma.data.nomFichierOriginal ?? "Téléversée")
                          : <span className="text-badge-warningFg">Manquante (exigée à la clôture)</span>
                    }
                  />
                )}
                {m.referenceFacture && <Ligne libelle="Facture" valeur={m.referenceFacture} />}
              </dl>
            </Section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
