import { ChoisirPhotoDialog } from "@/features/photo-profil/ChoisirPhotoDialog";
import {
  useChangerMaPhoto,
  useChangerPhotoCompte,
  useChangerPhotoConducteur,
  useMonProfil,
  useRetirerMaPhoto,
  useRetirerPhotoCompte,
  useRetirerPhotoConducteur,
} from "@/features/photo-profil/api";
import { initiales, initialesDepuisEmail } from "@/lib/utils";
import type { Conducteur } from "@/types/conducteur";
import type { Utilisateur } from "@/types/utilisateur";

/** Initiales prénom + nom, à défaut celles de l'e-mail. */
export function initialesPersonne(nom: string | null | undefined, prenom: string | null | undefined, email?: string | null): string {
  const lettres = initiales(nom, prenom);
  return lettres !== "?" || !email ? lettres : initialesDepuisEmail(email);
}

/** « Changer ma photo » (menu utilisateur). */
export function MaPhotoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: profil } = useMonProfil();
  const changer = useChangerMaPhoto();
  const retirer = useRetirerMaPhoto();
  return (
    <ChoisirPhotoDialog
      open={open}
      onOpenChange={onOpenChange}
      titre="Ma photo"
      description="Visible dans le menu, la messagerie et, pour un conducteur, sur sa fiche."
      nom={profil?.nomComplet ?? ""}
      initiales={initialesPersonne(profil?.nom, profil?.prenom, profil?.email)}
      urlPhotoActuelle={profil?.urlPhoto}
      enregistrer={(photo) => changer.mutateAsync(photo)}
      retirer={() => retirer.mutateAsync()}
    />
  );
}

/** Photo d'une fiche conducteur (gestion du parc) ; partagée avec son compte relié. */
export function PhotoConducteurDialog({ conducteur, onOpenChange }: { conducteur: Conducteur | null; onOpenChange: (o: boolean) => void }) {
  const changer = useChangerPhotoConducteur();
  const retirer = useRetirerPhotoConducteur();
  const nom = conducteur ? `${conducteur.prenom} ${conducteur.nom}`.trim() : "";
  return (
    <ChoisirPhotoDialog
      open={conducteur !== null}
      onOpenChange={onOpenChange}
      titre={`Photo — ${nom}`}
      description="Sert à reconnaître le conducteur ; son compte de l'appli mobile, s'il en a un, affiche la même photo."
      nom={nom}
      initiales={initialesPersonne(conducteur?.nom, conducteur?.prenom)}
      urlPhotoActuelle={conducteur?.urlPhoto}
      enregistrer={(photo) => changer.mutateAsync({ idConducteur: conducteur!.idConducteur, photo })}
      retirer={() => retirer.mutateAsync(conducteur!.idConducteur)}
    />
  );
}

/** Photo d'un compte utilisateur (administration). */
export function PhotoCompteDialog({ utilisateur, onOpenChange }: { utilisateur: Utilisateur | null; onOpenChange: (o: boolean) => void }) {
  const changer = useChangerPhotoCompte();
  const retirer = useRetirerPhotoCompte();
  const nom = utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}`.trim() : "";
  return (
    <ChoisirPhotoDialog
      open={utilisateur !== null}
      onOpenChange={onOpenChange}
      titre={`Photo — ${nom || utilisateur?.email || ""}`}
      description="Par exemple pour remplacer ou retirer une photo inappropriée. L'utilisateur peut aussi changer la sienne."
      nom={nom}
      initiales={initialesPersonne(utilisateur?.nom, utilisateur?.prenom, utilisateur?.email)}
      urlPhotoActuelle={utilisateur?.urlPhoto}
      enregistrer={(photo) => changer.mutateAsync({ idUtilisateur: utilisateur!.idUtilisateur, photo })}
      retirer={() => retirer.mutateAsync(utilisateur!.idUtilisateur)}
    />
  );
}
