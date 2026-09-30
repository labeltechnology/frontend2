import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreerConducteur, useModifierConducteur } from "@/features/conducteurs/api";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { ApiError } from "@/lib/api-client";
import type { CategorieConducteur, Conducteur } from "@/types/conducteur";
import { toast } from "sonner";

const schema = z.object({
  matricule: z.string().min(1, "Requis"),
  nom: z.string().min(1, "Requis"),
  prenom: z.string().min(1, "Requis"),
  telephone: z.string().optional(),
  categorie: z.enum(["VEHICULE_ROUTIER", "ENGIN_CHANTIER"]),
  numeroPermis: z.string().optional(),
  categoriePermis: z.string().optional(),
  dateExpirationPermis: z.string().optional(),
  numeroCaces: z.string().optional(),
  categorieCaces: z.string().optional(),
  dateExpirationCaces: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const LIBELLES_CATEGORIE: Record<CategorieConducteur, string> = {
  VEHICULE_ROUTIER: "Conducteur véhicule (permis de conduire)",
  ENGIN_CHANTIER: "Conducteur d'engin de chantier (certificat CACES)",
};

interface ConducteurFormDialogProps {
  /** Présent = édition ; absent (null) = création — même patron que EnginFormDialog/TypeEnginFormDialog. */
  conducteur: Conducteur | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Depuis le 2026-09-22 (demande explicite de l'utilisateur — « il y a les
 * conducteurs de camion et voiture et il y a un conducteur d'engin, il faut
 * les dissocier ») : la catégorie choisie détermine si c'est le permis de
 * conduire ou le certificat CACES qui est demandé — même principe que le
 * choix immatriculation/numéro de série sur EnginFormDialog. Le sélecteur de
 * catégorie est donc placé en premier pour que le formulaire s'adapte au fur
 * et à mesure de la saisie. Le contrôle avant soumission est un confort
 * (évite un aller-retour réseau) : le backend applique la même règle via
 * BusinessRuleException.
 *
 * <p>Édition ajoutée dans le même mouvement (jusque-là aucun moyen de
 * modifier un conducteur déjà créé depuis l'écran Conducteurs, malgré un
 * endpoint PUT déjà fonctionnel côté backend) : même dialogue que la
 * création, patron « un seul dialogue création/édition » déjà utilisé pour
 * EnginFormDialog/TypeEnginFormDialog. Le statut (suspension, réactivation)
 * reste une action séparée, pas modifiable ici (voir ConducteursPage).
 */
export function ConducteurFormDialog({ conducteur, open, onOpenChange }: ConducteurFormDialogProps) {
  const creerConducteur = useCreerConducteur();
  const modifierConducteur = useModifierConducteur();
  const enEdition = conducteur != null;
  // Avis si ce conducteur est modifié ailleurs pendant la saisie (temps réel, 2026-09-29).
  useEditionEnCours("conducteurs", open ? conducteur?.idConducteur : undefined);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (conducteur) {
      reset({
        matricule: conducteur.matricule,
        nom: conducteur.nom,
        prenom: conducteur.prenom,
        telephone: conducteur.telephone ?? "",
        categorie: conducteur.categorie,
        numeroPermis: conducteur.numeroPermis ?? "",
        categoriePermis: conducteur.categoriePermis ?? "",
        dateExpirationPermis: conducteur.dateExpirationPermis ?? "",
        numeroCaces: conducteur.numeroCaces ?? "",
        categorieCaces: conducteur.categorieCaces ?? "",
        dateExpirationCaces: conducteur.dateExpirationCaces ?? "",
      });
    } else {
      reset({
        matricule: "",
        nom: "",
        prenom: "",
        telephone: "",
        categorie: "VEHICULE_ROUTIER",
        numeroPermis: "",
        categoriePermis: "",
        dateExpirationPermis: "",
        numeroCaces: "",
        categorieCaces: "",
        dateExpirationCaces: "",
      });
    }
  }, [open, conducteur, reset]);

  const categorieSelectionnee = watch("categorie");
  const estEnginChantier = categorieSelectionnee === "ENGIN_CHANTIER";

  const onSubmit = async (values: FormValues) => {
    if (
      !estEnginChantier &&
      (!values.numeroPermis?.trim() || !values.categoriePermis?.trim() || !values.dateExpirationPermis)
    ) {
      toast.error("Le numéro, la catégorie et la date d'expiration du permis sont requis pour ce type de conducteur");
      return;
    }
    if (
      estEnginChantier &&
      (!values.numeroCaces?.trim() || !values.categorieCaces?.trim() || !values.dateExpirationCaces)
    ) {
      toast.error(
        "Le numéro, la catégorie et la date d'expiration du certificat CACES sont requis pour ce type de conducteur",
      );
      return;
    }
    const requete = {
      matricule: values.matricule,
      nom: values.nom,
      prenom: values.prenom,
      telephone: values.telephone || undefined,
      categorie: values.categorie as CategorieConducteur,
      numeroPermis: values.numeroPermis || undefined,
      categoriePermis: values.categoriePermis || undefined,
      dateExpirationPermis: values.dateExpirationPermis || undefined,
      numeroCaces: values.numeroCaces || undefined,
      categorieCaces: values.categorieCaces || undefined,
      dateExpirationCaces: values.dateExpirationCaces || undefined,
    };
    try {
      if (enEdition) {
        await modifierConducteur.mutateAsync({ id: conducteur.idConducteur, requete });
        toast.success("Conducteur modifié");
      } else {
        await creerConducteur.mutateAsync(requete);
        toast.success("Conducteur créé");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{enEdition ? "Modifier le conducteur" : "Nouveau conducteur"}</DialogTitle>
          <DialogDescription>
            {enEdition ? "Corrige la fiche de ce conducteur." : "Ajoute un conducteur au personnel de conduite."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={watch("categorie")} onValueChange={(v) => setValue("categorie", v as CategorieConducteur)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LIBELLES_CATEGORIE) as CategorieConducteur[]).map((categorie) => (
                  <SelectItem key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE[categorie]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matricule">Matricule</Label>
              <Input id="matricule" {...register("matricule")} />
              {errors.matricule && <p className="text-sm text-destructive">{errors.matricule.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" {...register("telephone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" {...register("nom")} />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" {...register("prenom")} />
              {errors.prenom && <p className="text-sm text-destructive">{errors.prenom.message}</p>}
            </div>
          </div>
          {estEnginChantier ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroCaces">N° de certificat CACES</Label>
                  <Input id="numeroCaces" {...register("numeroCaces")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categorieCaces">Catégorie CACES</Label>
                  <Input id="categorieCaces" placeholder="ex. R482 B1" {...register("categorieCaces")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateExpirationCaces">Expiration du certificat CACES</Label>
                <Input id="dateExpirationCaces" type="date" {...register("dateExpirationCaces")} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroPermis">N° de permis</Label>
                  <Input id="numeroPermis" {...register("numeroPermis")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoriePermis">Catégorie de permis</Label>
                  <Input id="categoriePermis" placeholder="ex. B, C, CE" {...register("categoriePermis")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateExpirationPermis">Expiration du permis</Label>
                <Input id="dateExpirationPermis" type="date" {...register("dateExpirationPermis")} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {enEdition ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
