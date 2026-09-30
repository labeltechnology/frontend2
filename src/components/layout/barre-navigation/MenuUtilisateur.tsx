import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, KeyRound, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/useAuth";
import { ChangerMotDePasseDialog } from "@/features/mon-compte/ChangerMotDePasseDialog";
import { useMonProfil } from "@/features/photo-profil/api";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import { initialesPersonne, MaPhotoDialog } from "@/features/photo-profil/DialoguesPhoto";
import { libelleRole } from "@/lib/droits";
import type { NavItem } from "@/routes/nav-config";
import type { ControleMenu } from "@/components/layout/barre-navigation/useMenuUnique";

/**
 * Avatar de la barre du bas : e-mail, rôle, lien « Paramètres » (s'il est
 * autorisé pour le rôle) et « Se déconnecter » — ce que contenait le bas de
 * l'ancienne barre latérale. « Changer mon mot de passe » : 2026-09-29.
 * Photo de profil et nom complet (« Changer ma photo ») : 2026-09-29.
 */
export function MenuUtilisateur({ parametres, controle }: { parametres: NavItem | undefined; controle?: ControleMenu }) {
  const { session, seDeconnecter } = useAuth();
  const [motDePasse, setMotDePasse] = useState(false);
  const [photo, setPhoto] = useState(false);
  const { data: profil } = useMonProfil();
  const lettres = initialesPersonne(profil?.nom, profil?.prenom, profil?.email ?? session?.email);
  return (
    <>
      <DropdownMenu open={controle?.open} onOpenChange={controle?.onOpenChange} modal={controle ? false : undefined}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={session?.email}
            aria-label="Menu utilisateur"
            className="rounded-full transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <AvatarPersonne urlPhoto={profil?.urlPhoto} initiales={lettres} nom={profil?.nomComplet} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={10} className="w-60">
          <DropdownMenuLabel>
            {profil?.nomComplet && profil.nomComplet !== session?.email && (
              <span className="block truncate">{profil.nomComplet}</span>
            )}
            <span className="block truncate text-xs font-normal">{session?.email}</span>
            <span className="block text-xs font-normal text-muted-foreground">{libelleRole(session?.role)}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {parametres && (
            <DropdownMenuItem asChild>
              <Link to={parametres.to} className="flex cursor-pointer items-center">
                <parametres.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                {parametres.label}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setPhoto(true)} className="cursor-pointer">
            <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
            Changer ma photo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMotDePasse(true)} className="cursor-pointer">
            <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
            Changer mon mot de passe
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={seDeconnecter} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangerMotDePasseDialog open={motDePasse} onOpenChange={setMotDePasse} />
      <MaPhotoDialog open={photo} onOpenChange={setPhoto} />
    </>
  );
}
