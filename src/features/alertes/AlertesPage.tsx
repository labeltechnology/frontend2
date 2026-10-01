import { useMemo, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { useAuth } from "@/features/auth/useAuth";
import { useAlertes, useTraiterAlertesGroupe, useVerifierCauses } from "@/features/alertes/api";
import { LIBELLES_PRIORITE_ALERTE, libelleTypeAlerte } from "@/features/alertes/libelles";
import { grouperAlertes, periodeGroupe, type GroupeAlertes } from "@/features/alertes/regroupement";
import { StatutTraitementAlerte } from "@/features/alertes/StatutTraitementAlerte";
import { etatTraitement, LIBELLES_ETAT_TRAITEMENT, messageVerification } from "@/features/alertes/traitement";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import { toast } from "sonner";

/**
 * Page Alertes. Depuis le 2026-09-28, les alertes répétées (même véhicule ou
 * conducteur, même type) sont affichées en UNE ligne : nombre d'occurrences,
 * « depuis le … — dernière le … », priorité la plus haute, description la
 * plus récente (features/alertes/regroupement.ts). « Traiter » traite tout
 * le groupe en un appel (POST /api/alertes/traitement-groupe).
 *
 * Depuis le 2026-09-30, le serveur clôt seul une alerte dont la cause a
 * disparu (document renouvelé, maintenance planifiée, stock réapprovisionné,
 * sortie enregistrée…) : Statut « Close auto » avec le motif. « Vérifier les
 * causes » lance ce contrôle tout de suite (sinon toutes les 15 minutes).
 */
export function AlertesPage() {
  const { session } = useAuth();
  const [filtre, setFiltre] = useState<"toutes" | "nonTraitees">("nonTraitees");
  const { data: alertes, isLoading, isError } = useAlertes(filtre === "nonTraitees");
  const traiter = useTraiterAlertesGroupe();
  const verifier = useVerifierCauses();
  const groupes = useMemo(() => (alertes ? grouperAlertes(alertes) : undefined), [alertes]);

  const peutTraiter = peut(session?.role, "GERER_PARC");

  const onTraiter = async (groupe: GroupeAlertes) => {
    const ids = groupe.alertes.filter((a) => !a.traitee).map((a) => a.idAlerte);
    try {
      const traitees = await traiter.mutateAsync(ids);
      toast.success(traitees.length > 1 ? `${traitees.length} alertes traitées` : "Alerte traitée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onVerifier = async () => {
    try {
      const resultat = await verifier.mutateAsync();
      toast.success(messageVerification(resultat.alertesCloses));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Vérification impossible");
    }
  };

  const columns: DataTableColumn<GroupeAlertes>[] = [
    {
      key: "type",
      header: "Type",
      render: (g) => (
        <span className="font-medium">
          {libelleTypeAlerte(g.type)}
          {g.nombre > 1 && (
            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">×{g.nombre}</span>
          )}
        </span>
      ),
    },
    {
      key: "priorite",
      header: "Priorité",
      render: (g) => (
        <span className="inline-flex flex-col items-start gap-0.5">
          <StatutBadge statut={g.prioriteMax} />
          {g.prioriteInitiale && g.prioriteInitiale !== g.prioriteMax && (
            <span
              className="text-[11px] text-muted-foreground"
              title="Priorité relevée automatiquement : alerte non traitée dans le délai (réglage dans Paramètres)"
            >
              ↑ depuis {LIBELLES_PRIORITE_ALERTE[g.prioriteInitiale]}
            </span>
          )}
        </span>
      ),
    },
    { key: "description", header: "Dernière description", render: (g) => g.description },
    { key: "cible", header: "Concerne", render: (g) => g.libelleCible ?? "—", sortValue: (g) => g.libelleCible },
    { key: "periode", header: "Période", render: (g) => <span className="whitespace-nowrap text-sm">{periodeGroupe(g)}</span> },
    {
      key: "traitee",
      header: "Statut",
      render: (g) => <StatutTraitementAlerte alertes={g.alertes} />,
      sortValue: (g) => LIBELLES_ETAT_TRAITEMENT[etatTraitement(g.alertes)],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes"
        description="Alertes générées automatiquement par le système ; les alertes répétées sont regroupées, et celles dont la cause a disparu sont closes automatiquement."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {peutTraiter && (
              <Button
                variant="outline"
                size="sm"
                disabled={verifier.isPending}
                onClick={onVerifier}
                title="Clore immédiatement les alertes dont la cause a disparu (opération également effectuée automatiquement toutes les 15 minutes)"
              >
                <RefreshCw className={verifier.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Vérifier les causes
              </Button>
            )}
            <Tabs value={filtre} onValueChange={(v) => setFiltre(v as typeof filtre)}>
              <TabsList>
                <TabsTrigger value="nonTraitees">Non traitées</TabsTrigger>
                <TabsTrigger value="toutes">Toutes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={groupes}
        cleMemoire="alertes"
        recherche={{ texte: (g) => `${libelleTypeAlerte(g.type)} ${g.description ?? ""} ${g.libelleCible ?? ""}`, placeholder: "Type, véhicule, description…" }}
        libelles={["alerte", "alertes"]}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(g) => g.cle}
        rowActions={
          peutTraiter
            ? (groupe) => (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={groupe.traitee || traiter.isPending}
                  onClick={() => onTraiter(groupe)}
                >
                  <Check className="h-4 w-4" />
                  {groupe.alertes.length > 1 ? "Tout traiter" : "Traiter"}
                </Button>
              )
            : undefined
        }
      />
    </div>
  );
}
