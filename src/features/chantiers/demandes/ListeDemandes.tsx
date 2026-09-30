import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnnulerDemande, useRepondreDemande } from "@/features/chantiers/demandes/demandes-api";
import {
  LIBELLES_STATUT_DEMANDE,
  libelleDelai,
  peutAnnuler,
  peutRepondre,
  trierDemandes,
  VARIANT_STATUT_DEMANDE,
} from "@/features/chantiers/demandes/demandes";
import { LIBELLES_PRIORITE, VARIANT_PRIORITE } from "@/features/chantiers/organisation/organisation";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { DemandeMateriel } from "@/types/chantier";

/** Tableau des demandes de matériel (V64) : réponse par la gestion du parc, annulation par le demandeur. */
export function ListeDemandes({
  demandes,
  avecChantier,
  gestion,
  idUtilisateur,
}: {
  demandes: DemandeMateriel[];
  avecChantier: boolean;
  gestion: boolean;
  idUtilisateur: number | undefined;
}) {
  const annuler = useAnnulerDemande();
  const [reponse, setReponse] = useState<{ demande: DemandeMateriel; accepter: boolean } | null>(null);

  const surAnnuler = async (d: DemandeMateriel) => {
    if (!window.confirm("Annuler cette demande ?")) return;
    try {
      await annuler.mutateAsync(d.idDemande);
      toast.success("Demande annulée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Annulation impossible");
    }
  };

  if (demandes.length === 0) return <p className="text-sm text-muted-foreground">Aucune demande de matériel.</p>;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {avecChantier && <TableHead>Chantier</TableHead>}
            <TableHead>Demande</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Délais</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {trierDemandes(demandes).map((d) => (
            <TableRow key={d.idDemande}>
              {avecChantier && <TableCell className="font-medium">{d.nomChantier}</TableCell>}
              <TableCell>
                <div>
                  {d.quantite} × {d.typeEngin}
                </div>
                <div className="text-xs text-muted-foreground">
                  du {formatDate(d.dateDebut)} au {formatDate(d.dateFin)} · par {d.nomDemandeur ?? "—"} le {formatDateTime(d.dateDemande)}
                </div>
                {d.motif && <div className="line-clamp-2 text-xs">{d.motif}</div>}
                {d.statut === "EN_ATTENTE" && d.disponiblesEstimes != null && (
                  <div className={d.disponiblesEstimes >= d.quantite ? "text-xs text-badge-successFg" : "text-xs text-destructive"}>
                    {d.disponiblesEstimes} véhicule(s) de ce type libre(s) sur la période
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={VARIANT_PRIORITE[d.priorite]}>{LIBELLES_PRIORITE[d.priorite]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={VARIANT_STATUT_DEMANDE[d.statut]}>{LIBELLES_STATUT_DEMANDE[d.statut]}</Badge>
                {d.reponse && <div className="mt-1 text-xs text-muted-foreground">{d.reponse}</div>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                <div>Réponse : {libelleDelai(d.delaiReponseHeures, "h")}</div>
                <div>Service : {libelleDelai(d.delaiServiceJours, "j")}</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {gestion && peutRepondre(d) && (
                    <>
                      <Button type="button" size="sm" onClick={() => setReponse({ demande: d, accepter: true })}>
                        Accepter
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setReponse({ demande: d, accepter: false })}>
                        Refuser
                      </Button>
                    </>
                  )}
                  {peutAnnuler(d, idUtilisateur, gestion) && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => surAnnuler(d)}>
                      Annuler
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {reponse && <ReponseDialog demande={reponse.demande} accepter={reponse.accepter} onClose={() => setReponse(null)} />}
    </div>
  );
}

function ReponseDialog({ demande, accepter, onClose }: { demande: DemandeMateriel; accepter: boolean; onClose: () => void }) {
  const repondre = useRepondreDemande();
  const [texte, setTexte] = useState("");
  const probleme = !accepter && !texte.trim() ? "Indiquez le motif du refus." : null;

  const valider = async () => {
    if (probleme) return;
    try {
      await repondre.mutateAsync({ id: demande.idDemande, accepter, reponse: texte.trim() || undefined });
      toast.success(accepter ? "Demande acceptée — prévoyez les véhicules sur la fiche du chantier" : "Demande refusée");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Réponse impossible");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{accepter ? "Accepter la demande" : "Refuser la demande"}</DialogTitle>
          <DialogDescription>
            {demande.quantite} × {demande.typeEngin} pour « {demande.nomChantier} », du {formatDate(demande.dateDebut)} au{" "}
            {formatDate(demande.dateFin)}. Le demandeur est prévenu par message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reponse-demande">{accepter ? "Message (facultatif)" : "Motif du refus"}</Label>
          <Textarea id="reponse-demande" rows={3} maxLength={500} value={texte} onChange={(e) => setTexte(e.target.value)} />
          {probleme && <p className="text-sm text-destructive">{probleme}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" variant={accepter ? "default" : "destructive"} onClick={valider} disabled={!!probleme || repondre.isPending}>
            {accepter ? "Accepter" : "Refuser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
