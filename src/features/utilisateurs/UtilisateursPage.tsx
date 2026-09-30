import { useState } from "react";
import { Camera, KeyRound, Plus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { useAuth } from "@/features/auth/useAuth";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import { initialesPersonne, PhotoCompteDialog } from "@/features/photo-profil/DialoguesPhoto";
import { ReinitialiserMotDePasseDialog } from "@/features/utilisateurs/ReinitialiserMotDePasseDialog";
import { UtilisateurFormDialog } from "@/features/utilisateurs/UtilisateurFormDialog";
import { useDesactiverUtilisateur, useUtilisateurs } from "@/features/utilisateurs/api";
import { libelleRole, ROLES_SENSIBLES } from "@/lib/droits";
import { ApiError } from "@/lib/api-client";
import type { RoleLibelle } from "@/types/auth";
import type { Utilisateur } from "@/types/utilisateur";
import { toast } from "sonner";

export function UtilisateursPage() {
  const { data: utilisateurs, isLoading, isError } = useUtilisateurs();
  const desactiver = useDesactiverUtilisateur();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [reinitialisation, setReinitialisation] = useState<Utilisateur | null>(null);
  const [photo, setPhoto] = useState<Utilisateur | null>(null);
  const { session } = useAuth();
  const connecteSensible = !!session && ROLES_SENSIBLES.includes(session.role);
  /** Un compte DG ou Administrateur ne peut être désactivé que par un DG ou un administrateur (règle serveur). */
  const peutDesactiver = (u: Utilisateur) =>
    u.statut !== "DESACTIVE" && (connecteSensible || !ROLES_SENSIBLES.includes(u.role.libelle as RoleLibelle));
  /** Même garde que le mot de passe : un compte DG ou Administrateur n'est modifiable que par eux. */
  const peutModifier = (u: Utilisateur) => connecteSensible || !ROLES_SENSIBLES.includes(u.role.libelle as RoleLibelle);

  const onDesactiver = async (utilisateur: Utilisateur) => {
    try {
      await desactiver.mutateAsync(utilisateur.idUtilisateur);
      toast.success("Utilisateur désactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<Utilisateur>[] = [
    {
      key: "nom",
      header: "Nom",
      render: (u) => (
        <span className="flex items-center gap-2.5 font-medium">
          <AvatarPersonne urlPhoto={u.urlPhoto} initiales={initialesPersonne(u.nom, u.prenom, u.email)} nom={`${u.prenom} ${u.nom}`} />
          {u.nom} {u.prenom}
        </span>
      ),
    },
    { key: "email", header: "Email", render: (u) => u.email },
    { key: "role", header: "Rôle", render: (u) => libelleRole(u.role.libelle) },
    { key: "statut", header: "Statut", render: (u) => <StatutBadge statut={u.statut} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Comptes applicatifs : DG, responsable du parc et administrateur."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={utilisateurs}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(u) => u.idUtilisateur}
        rowActions={(utilisateur) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={!peutModifier(utilisateur)} onClick={() => setPhoto(utilisateur)}>
              <Camera className="h-4 w-4" />
              Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={utilisateur.statut === "DESACTIVE" || !(connecteSensible || !ROLES_SENSIBLES.includes(utilisateur.role.libelle as RoleLibelle))}
              onClick={() => setReinitialisation(utilisateur)}
            >
              <KeyRound className="h-4 w-4" />
              Mot de passe
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!peutDesactiver(utilisateur)}
              onClick={() => onDesactiver(utilisateur)}
            >
              <UserX className="h-4 w-4" />
              Désactiver
            </Button>
          </div>
        )}
      />

      <UtilisateurFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <ReinitialiserMotDePasseDialog utilisateur={reinitialisation} onOpenChange={(o) => !o && setReinitialisation(null)} />
      <PhotoCompteDialog utilisateur={photo} onOpenChange={(o) => !o && setPhoto(null)} />
    </div>
  );
}
