import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Camera, Car, FileText, ImagePlus, Loader2, ShieldCheck, Wallet, Wrench, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { peut } from "@/lib/droits";
import { useAuth } from "@/features/auth/useAuth";
import { CoutsVehiculeFiche } from "@/features/couts/CoutsVehiculeFiche";
import { useCreerEngin, useEngins, useModifierEngin, useTypesEngin } from "@/features/engins/api";
import { GaleriePhotosEngin } from "@/features/engins/GaleriePhotosEngin";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { useEnginPhotos } from "@/features/engins/photos-api";
import { BanniereVehicule } from "@/features/engins/fiche/BanniereVehicule";
import { SelectionPhotosInitiales } from "@/features/engins/fiche/SelectionPhotosInitiales";
import { TuilesFiche, type TuileFiche } from "@/features/engins/fiche/TuilesFiche";
import { MiseEnPageFiche } from "@/features/engins/fiche/MiseEnPageFiche";
import { televerserPhotosInitiales } from "@/features/engins/fiche/photos-initiales";
import { CLASSES_TEINTE, type TeinteRubrique } from "@/features/engins/fiche/teintes";
import { usePhotosInitiales } from "@/features/engins/fiche/usePhotosInitiales";
import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import { ChecklistEquipementsBord, type ValeurEquipementBord } from "@/features/equipements-bord/ChecklistEquipementsBord";
import { EquipementsBordEngin } from "@/features/equipements-bord/EquipementsBordEngin";
import { useElementsBord, useEquipementsBord } from "@/features/equipements-bord/api";
import { saisiesRenseignees } from "@/features/equipements-bord/saisies";
import { EcheancesEntretienEngin } from "@/features/entretien/EcheancesEntretienEngin";
import { SaisieEntretienInitial, type ValeurEntretienInitial } from "@/features/entretien/SaisieEntretienInitial";
import { useEcheancesEntretien, usePostesEntretien } from "@/features/entretien/api";
import { porteeConcerne } from "@/features/referentiels-fiche/libelles";
import { ApiError } from "@/lib/api-client";
import { cn, formatNombre, libelleEnum, normaliserNombre } from "@/lib/utils";
import type {
  DocumentInitialRequest,
  Energie,
  Engin,
  FicheTechniqueEnginRequest,
} from "@/types/engin";
import type { EntretienInitialRequest } from "@/types/entretien";
import { toast } from "sonner";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";
import { accord, pluriel } from "@/lib/pluriel";
import { BandeauNonEnregistre } from "@/components/confirmation/BandeauNonEnregistre";
import { useGardeModifications } from "@/components/confirmation/useGardeModifications";
import { useTitreFilAriane } from "@/components/layout/fil-ariane/ContexteFilAriane";

/**
 * Page « Fiche véhicule » — création ET correction d'un engin sur une seule
 * page découpée comme une fiche papier (ajoutée le 2026-09-24, demande
 * explicite de l'utilisateur : « au moment de création d'un véhicule une
 * formulaire comme ça pour éviter la saisie », choix validés via
 * AskUserQuestion : page pleine plutôt que dialogue ; caractéristiques
 * techniques + compteurs initiaux + documents à l'entrée).
 *
 * Remplace EnginFormDialog (même règles d'identifiant selon la catégorie du
 * type, reprises telles quelles). Ce que la page évite de ressaisir :
 *  - les compteurs d'entrée (un véhicule d'occasion n'arrive pas à 0 km —
 *    jusqu'ici il fallait le corriger ensuite via « Mettre à jour le
 *    kilométrage ») ;
 *  - carte grise / assurance / visite technique, créés dans la même
 *    transaction que l'engin (voir EnginService#creer) au lieu de trois
 *    passages par l'écran Documents.
 *
 * En correction (/engins/:idEngin/fiche), compteurs et documents ne sont pas
 * affichés : ils ont leurs propres actions (kilométrage, écran Documents,
 * avec versionnage) — les modifier ici contournerait ces règles.
 *
 * Complétée le même jour d'après la fiche de suivi papier de l'utilisateur
 * (choix validés : documents supplémentaires, éléments de bord, entretien
 * périodique ; listes modifiables ; échéances calculées) : dossier complet
 * du véhicule (6 documents), éléments de sécurité / boîte à outils
 * (ChecklistEquipementsBord) et dernières interventions d'entretien
 * (SaisieEntretienInitial). En correction, ces deux dernières rubriques
 * deviennent des onglets autonomes (EquipementsBordEngin,
 * EcheancesEntretienEngin), chacun avec son propre enregistrement.
 *
 * Photos (ajoutées le 2026-09-24 — « la photo du véhicule on a oublié ») :
 * à la création, choisies localement puis envoyées juste après la création
 * de l'engin (SelectionPhotosInitiales, televerserPhotosInitiales) ; en
 * correction, onglet « Photos » (GaleriePhotosEngin, partagé avec le
 * dialogue de la liste des engins).
 *
 * Mise en page (2026-09-24, d'après une maquette « Car Assistance » fournie
 * par l'utilisateur — « image du véhicule en haut ») : bannière avec la
 * photo principale en grand (BanniereVehicule), puis une rangée de
 * rubriques colorées (TuilesFiche). En création, « Détails… » fait défiler
 * jusqu'à la section ; en correction, les tuiles remplacent la barre
 * d'onglets. Chaque section reprend la couleur et l'icône de sa tuile.
 *
 * Tous les contrôles faits ici (identifiant selon catégorie, dates, nombres)
 * sont refaits côté backend : ce n'est qu'un confort pour éviter un
 * aller-retour réseau.
 */

const ENERGIES: { valeur: Energie; libelle: string }[] = [
  { valeur: "GASOIL", libelle: "Gasoil" },
  { valeur: "ESSENCE", libelle: "Essence" },
  { valeur: "ELECTRIQUE", libelle: "Électrique" },
  { valeur: "HYBRIDE", libelle: "Hybride" },
  { valeur: "AUTRE", libelle: "Autre" },
];
/** Valeur technique du Select pour « non renseigné » (Radix Select n'accepte pas une valeur vide). */
const AUCUNE_ENERGIE = "AUCUNE";

/**
 * Lignes du « Dossier complet du véhicule » de la fiche papier, dans son
 * ordre (AUTRE reste saisissable depuis l'écran Documents).
 */
type TypeDocumentFiche = Exclude<DocumentInitialRequest["type"], "AUTRE">;
const DOCUMENTS_VEHICULE: TypeDocumentFiche[] = [
  "ASSURANCE",
  "VISITE_TECHNIQUE",
  "CARTE_GRISE",
  "CONFORMITE_FISCALE",
  "LICENCE_TRANSPORT",
  "CARTE_CARBURANT",
];
/** Un engin de chantier n'a ni carte grise, ni visite technique routière, ni licence de transport. */
const DOCUMENTS_ENGIN_CHANTIER: TypeDocumentFiche[] = ["ASSURANCE", "CONFORMITE_FISCALE", "CARTE_CARBURANT"];

function versNombre(valeur: string | undefined): number | undefined {
  if (!valeur || !valeur.trim()) return undefined;
  return Number(normaliserNombre(valeur));
}

function versTexte(valeur: string | undefined): string | undefined {
  return valeur && valeur.trim() ? valeur.trim() : undefined;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const nombreFacultatif = (options: { entier?: boolean; zeroAutorise?: boolean }) =>
  z
    .string()
    .optional()
    .refine((v) => {
      if (!v || !v.trim()) return true;
      const n = Number(normaliserNombre(v));
      if (!Number.isFinite(n)) return false;
      if (options.entier && !Number.isInteger(n)) return false;
      return options.zeroAutorise ? n >= 0 : n > 0;
    }, options.entier ? "Nombre entier positif attendu" : options.zeroAutorise ? "Nombre positif ou nul attendu" : "Nombre positif attendu");

const dateNonFuture = z
  .string()
  .optional()
  .refine((v) => !v || v <= aujourdhui(), "La date ne peut pas être dans le futur");

const documentSchema = z
  .object({
    numeroReference: z.string().optional(),
    dateDebut: z.string().optional(),
    dateExpiration: z.string().optional(),
  })
  .refine((d) => !d.dateDebut || !d.dateExpiration || d.dateExpiration >= d.dateDebut, {
    message: "La date d'expiration ne peut pas précéder la date de début",
    path: ["dateExpiration"],
  });

const schema = z.object({
  idTypeEngin: z.string().min(1, "Requis"),
  immatriculation: z.string().optional(),
  numeroSerie: z.string().optional(),
  numeroChassis: z.string().optional(),
  marque: z.string().trim().min(1, "Requis"),
  modele: z.string().trim().min(1, "Requis"),
  energie: z.string().optional(),
  capaciteReservoirLitres: nombreFacultatif({}),
  consommationReferenceL100km: nombreFacultatif({}),
  dateMiseEnCirculation: dateNonFuture,
  dateAcquisition: dateNonFuture,
  couleur: z.string().max(30, "30 caractères maximum").optional(),
  puissanceFiscaleCv: nombreFacultatif({ entier: true }),
  nombrePlaces: nombreFacultatif({ entier: true }),
  chargeUtileKg: nombreFacultatif({ zeroAutorise: true }),
  kilometrageInitial: nombreFacultatif({ zeroAutorise: true }),
  compteurHeuresInitial: nombreFacultatif({ zeroAutorise: true }),
  equipeGps: z.boolean(),
  documents: z.object({
    ASSURANCE: documentSchema,
    VISITE_TECHNIQUE: documentSchema,
    CARTE_GRISE: documentSchema,
    CONFORMITE_FISCALE: documentSchema,
    LICENCE_TRANSPORT: documentSchema,
    CARTE_CARBURANT: documentSchema,
  }),
});

type FormValues = z.infer<typeof schema>;

const DOCUMENT_VIDE = { numeroReference: "", dateDebut: "", dateExpiration: "" };

function valeursInitiales(engin: Engin | undefined): FormValues {
  const texteNombre = (n: number | null | undefined) => (n == null ? "" : String(n));
  return {
    idTypeEngin: engin ? String(engin.typeEngin.idTypeEngin) : "",
    immatriculation: engin?.immatriculation ?? "",
    numeroSerie: engin?.numeroSerie ?? "",
    numeroChassis: engin?.numeroChassis ?? "",
    marque: engin?.marque ?? "",
    modele: engin?.modele ?? "",
    energie: engin?.energie ?? AUCUNE_ENERGIE,
    capaciteReservoirLitres: texteNombre(engin?.capaciteReservoirLitres),
    consommationReferenceL100km: texteNombre(engin?.consommationReferenceL100km),
    dateMiseEnCirculation: engin?.dateMiseEnCirculation ?? "",
    dateAcquisition: engin?.dateAcquisition ?? "",
    couleur: engin?.couleur ?? "",
    puissanceFiscaleCv: texteNombre(engin?.puissanceFiscaleCv),
    nombrePlaces: texteNombre(engin?.nombrePlaces),
    chargeUtileKg: texteNombre(engin?.chargeUtileKg),
    kilometrageInitial: "",
    compteurHeuresInitial: "",
    equipeGps: false,
    documents: {
      ASSURANCE: DOCUMENT_VIDE,
      VISITE_TECHNIQUE: DOCUMENT_VIDE,
      CARTE_GRISE: DOCUMENT_VIDE,
      CONFORMITE_FISCALE: DOCUMENT_VIDE,
      LICENCE_TRANSPORT: DOCUMENT_VIDE,
      CARTE_CARBURANT: DOCUMENT_VIDE,
    },
  };
}

/** Message d'erreur sous un champ — même style que les autres formulaires du projet. */
function Erreur({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

function Champ({ id, label, children, erreur }: { id: string; label: string; children: ReactNode; erreur?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <Erreur message={erreur} />
    </div>
  );
}

function Section({
  titre,
  description,
  children,
  id,
  icone: Icone,
  teinte,
}: {
  titre: string;
  description?: string;
  children: ReactNode;
  /** Ancre visée par la tuile correspondante (création). */
  id?: string;
  icone?: LucideIcon;
  teinte?: TeinteRubrique;
}) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-4">
        {Icone && teinte && (
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", CLASSES_TEINTE[teinte].pastille)}>
            <Icone className="h-5 w-5" aria-hidden />
          </span>
        )}
        <div className="space-y-1">
          <CardTitle className="text-base">{titre}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FicheEnginPage() {
  const navigate = useNavigate();
  const { idEngin } = useParams<{ idEngin: string }>();
  const enEdition = idEngin != null;

  const { data: engins, isLoading: enginsEnChargement } = useEngins();
  const { data: typesEngin } = useTypesEngin();
  const creerEngin = useCreerEngin();
  const modifierEngin = useModifierEngin();
  const { data: elementsBord } = useElementsBord();
  const { data: postesEntretien } = usePostesEntretien();

  // Rubriques à listes variables (référentiels) : hors react-hook-form, validées à l'enregistrement.
  const [equipements, setEquipements] = useState<Record<number, ValeurEquipementBord>>({});
  const [entretiens, setEntretiens] = useState<Record<number, ValeurEntretienInitial>>({});
  const [erreursEntretien, setErreursEntretien] = useState<Record<number, string>>({});
  const photosInitiales = usePhotosInitiales();
  // ?onglet=couts : ouverture directe d'une rubrique (lien « Coûts fixes à saisir » de la page Coûts, 2026-09-29).
  const [parametresUrl] = useSearchParams();
  const [onglet, setOnglet] = useState(parametresUrl.get("onglet") ?? "fiche");
  const { session } = useAuth();
  const voitCouts = peut(session?.role, "CONSULTER_GESTION");

  const engin = useMemo(
    () => (enEdition ? engins?.find((e) => String(e.idEngin) === idEngin) : undefined),
    [enEdition, engins, idEngin],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: valeursInitiales(undefined) });
  // Ergonomie (2026-09-30) : garde de saisie non enregistrée et libellé du fil d'Ariane.
  const modifie = isDirty && !isSubmitting;
  useGardeModifications(modifie, "La fiche du véhicule a des modifications non enregistrées.");
  useTitreFilAriane(engin ? libelleVehicule(engin) : enEdition ? null : "Nouveau véhicule");

  // En correction, la fiche n'est pré-remplie qu'une fois l'engin trouvé dans la liste — et UNE seule
  // fois par véhicule (2026-09-29) : une mise à jour reçue en temps réel ne doit pas effacer la saisie
  // en cours ; l'avis « modifié par un autre » prévient à la place.
  const enginPreRempli = useRef<number | null>(null);
  useEffect(() => {
    if (engin && enginPreRempli.current !== engin.idEngin) {
      enginPreRempli.current = engin.idEngin;
      reset(valeursInitiales(engin));
    }
  }, [engin, reset]);
  useEditionEnCours("engins", engin?.idEngin);

  const idTypeEnginSelectionne = watch("idTypeEngin");
  const typeSelectionne = useMemo(
    () => typesEngin?.find((t) => String(t.idTypeEngin) === idTypeEnginSelectionne),
    [typesEngin, idTypeEnginSelectionne],
  );
  const estEnginChantier = typeSelectionne?.categorie === "ENGIN_CHANTIER";
  const documentsProposes = estEnginChantier ? DOCUMENTS_ENGIN_CHANTIER : DOCUMENTS_VEHICULE;
  const categorie = typeSelectionne?.categorie;

  // Seuls les éléments / postes actifs qui concernent la catégorie du type choisi.
  const lignesEquipements = useMemo(
    () => (elementsBord ?? []).filter((e) => e.actif && porteeConcerne(e.portee, categorie)),
    [elementsBord, categorie],
  );
  const postesProposes = useMemo(
    () => (postesEntretien ?? []).filter((p) => p.actif && porteeConcerne(p.portee, categorie)),
    [postesEntretien, categorie],
  );
  const compteurInitial = versNombre(watch(estEnginChantier ? "compteurHeuresInitial" : "kilometrageInitial")) ?? 0;

  /**
   * Mêmes contrôles que EcheanceEntretienService : date non future, compteur
   * positif et pas au-delà du compteur d'entrée de l'engin. Renvoie les
   * lignes à envoyer, ou null si une erreur est affichée.
   */
  const entretiensAEnvoyer = (): EntretienInitialRequest[] | null => {
    const erreurs: Record<number, string> = {};
    const lignes: EntretienInitialRequest[] = [];
    const unite = estEnginChantier ? "h" : "km";
    for (const poste of postesProposes) {
      const valeur = entretiens[poste.idPosteEntretien];
      if (!valeur) continue;
      const date = versTexte(valeur.dateDerniereIntervention);
      const compteur = versNombre(valeur.compteurDerniereIntervention);
      if (!date && compteur === undefined) continue;
      if (date && date > aujourdhui()) {
        erreurs[poste.idPosteEntretien] = "La date ne peut pas être dans le futur";
      } else if (compteur !== undefined && (!Number.isFinite(compteur) || compteur < 0)) {
        erreurs[poste.idPosteEntretien] = "Compteur invalide";
      } else if (compteur !== undefined && compteur > compteurInitial) {
        erreurs[poste.idPosteEntretien] = `Supérieur au compteur d'entrée du véhicule (${compteurInitial} ${unite})`;
      }
      lignes.push({
        idPosteEntretien: poste.idPosteEntretien,
        dateDerniereIntervention: date,
        compteurDerniereIntervention: compteur,
        observation: versTexte(valeur.observation),
      });
    }
    setErreursEntretien(erreurs);
    return Object.keys(erreurs).length > 0 ? null : lignes;
  };

  const retourListe = () => navigate("/engins");

  // Correction : photo principale et résumés des onglets (mêmes clés de cache que les onglets eux-mêmes).
  const { data: photosEngin } = useEnginPhotos(engin?.idEngin);
  const { data: etatBord } = useEquipementsBord(engin?.idEngin);
  const { data: echeances } = useEcheancesEntretien(engin?.idEngin);

  const onSubmit = async (values: FormValues) => {
    if (!typeSelectionne) {
      toast.error("Choisissez d'abord le type de véhicule");
      return;
    }
    if (!estEnginChantier && !values.immatriculation?.trim()) {
      toast.error("L'immatriculation est requise pour ce type de véhicule");
      return;
    }
    if (estEnginChantier && !values.numeroSerie?.trim()) {
      toast.error("Le numéro de série est requis pour ce type de véhicule (pas de plaque routière)");
      return;
    }

    const ficheTechnique: FicheTechniqueEnginRequest = {
      energie: values.energie && values.energie !== AUCUNE_ENERGIE ? (values.energie as Energie) : undefined,
      capaciteReservoirLitres: versNombre(values.capaciteReservoirLitres),
      consommationReferenceL100km: versNombre(values.consommationReferenceL100km),
      dateMiseEnCirculation: versTexte(values.dateMiseEnCirculation),
      couleur: versTexte(values.couleur),
      // Pas de puissance fiscale pour un engin de chantier (pas de carte grise).
      puissanceFiscaleCv: estEnginChantier ? undefined : versNombre(values.puissanceFiscaleCv),
      nombrePlaces: versNombre(values.nombrePlaces),
      chargeUtileKg: versNombre(values.chargeUtileKg),
    };
    const identification = {
      // Seul l'identifiant de la catégorie choisie est envoyé : changer de type
      // en cours de saisie ne laisse pas une valeur fantôme dans l'autre champ.
      immatriculation: estEnginChantier ? undefined : versTexte(values.immatriculation),
      numeroSerie: estEnginChantier ? versTexte(values.numeroSerie) : undefined,
      numeroChassis: versTexte(values.numeroChassis),
      marque: values.marque.trim(),
      modele: values.modele.trim(),
      dateAcquisition: versTexte(values.dateAcquisition),
      idTypeEngin: Number(values.idTypeEngin),
    };

    try {
      if (enEdition && engin) {
        await modifierEngin.mutateAsync({ id: engin.idEngin, requete: { ...identification, ...ficheTechnique } });
        toast.success("Fiche mise à jour");
      } else {
        const entretiensInitiaux = entretiensAEnvoyer();
        if (entretiensInitiaux === null) {
          toast.error("Vérifiez la rubrique « Entretien du véhicule »");
          return;
        }
        const idsElementsProposes = new Set(lignesEquipements.map((l) => l.idElementBord));
        const equipementsBord = saisiesRenseignees(equipements).filter((s) => idsElementsProposes.has(s.idElementBord));
        const documents: DocumentInitialRequest[] = documentsProposes
          .map((type) => ({
            type,
            numeroReference: versTexte(values.documents[type].numeroReference),
            dateDebut: versTexte(values.documents[type].dateDebut),
            dateExpiration: versTexte(values.documents[type].dateExpiration),
          }))
          .filter((d) => d.numeroReference || d.dateDebut || d.dateExpiration);
        const enginCree = await creerEngin.mutateAsync({
          ...identification,
          ...ficheTechnique,
          equipeGps: values.equipeGps,
          kilometrageInitial: estEnginChantier ? undefined : versNombre(values.kilometrageInitial),
          compteurHeuresInitial: estEnginChantier ? versNombre(values.compteurHeuresInitial) : undefined,
          documents,
          equipementsBord,
          entretiens: entretiensInitiaux,
        });
        toast.success(
          documents.length > 0 ? `Véhicule créé avec ${pluriel(documents.length, "document")}` : "Véhicule créé",
        );
        // Les photos ne peuvent partir qu'une fois l'engin créé (il leur faut son identifiant).
        if (photosInitiales.photos.length > 0) {
          const echecs = await televerserPhotosInitiales(
            enginCree.idEngin,
            photosInitiales.photos,
            photosInitiales.idPrincipale,
          );
          if (echecs > 0) {
            toast.warning(
              `${pluriel(echecs, "photo")} sur ${photosInitiales.photos.length} ${accord(echecs, "n'a pas pu être envoyée — ajoutez-la", "n'ont pas pu être envoyées — ajoutez-les")} depuis l'onglet « Photos » de la fiche.`,
            );
          }
        }
      }
      retourListe();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  if (enEdition && enginsEnChargement) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Chargement de la fiche…</p>;
  }
  if (enEdition && !engin) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Ce véhicule est introuvable.</p>
        <Button variant="outline" onClick={retourListe}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const erreursDocuments = errors.documents;

  // --- Bannière : valeurs saisies en direct en création, fiche enregistrée en correction ---
  const [marqueSaisie, modeleSaisi, immatSaisie, serieSaisie, energieSaisie, kmSaisi, heuresSaisies] = watch([
    "marque",
    "modele",
    "immatriculation",
    "numeroSerie",
    "energie",
    "kilometrageInitial",
    "compteurHeuresInitial",
  ]);
  const identifiant = estEnginChantier ? serieSaisie : immatSaisie;
  // Titre = identifiant unique (immatriculation ou n° de série) ; le code interne n'est plus affiché (2026-09-25).
  const sousTitre = [marqueSaisie, modeleSaisi].filter(Boolean).join(" ");
  const energieLibelle = ENERGIES.find((e) => e.valeur === energieSaisie)?.libelle;
  const compteurBanniere = enEdition
    ? estEnginChantier
      ? `${formatNombre(engin?.compteurHeures ?? 0)} h`
      : `${formatNombre(engin?.kilometrage ?? 0)} km`
    : estEnginChantier
      ? heuresSaisies && `${heuresSaisies} h`
      : kmSaisi && `${kmSaisi} km`;
  const puces = [
    typeSelectionne?.libelle,
    energieLibelle,
    compteurBanniere || undefined,
    enEdition && engin ? libelleEnum(engin.statut) : undefined,
  ].filter((p): p is string => !!p);

  const photoPrincipaleEngin = photosEngin?.find((p) => p.estPrincipale) ?? photosEngin?.[0];
  const photoBanniere = enEdition ? (
    photoPrincipaleEngin && (
      <AuthenticatedImage url={photoPrincipaleEngin.url} alt={`Photo ${engin ? "de " + libelleVehicule(engin) : "du véhicule"}`} className="h-full w-full" />
    )
  ) : (
    photosInitiales.principale && (
      <img src={photosInitiales.principale.apercu} alt="Photo principale du véhicule" className="h-full w-full object-cover" />
    )
  );

  const banniere = (
    <BanniereVehicule
      titre={identifiant?.trim() || (enEdition && engin ? identifiantVehicule(engin) : "Nouveau véhicule")}
      sousTitre={sousTitre || (enEdition ? undefined : "Toute la fiche en une fois : identification, photos, documents, éléments de bord et entretien.")}
      puces={puces}
      photo={photoBanniere || undefined}
      onClicPhoto={enEdition ? () => setOnglet("photos") : photosInitiales.ouvrirSelecteur}
      disposition="colonne"
      libelleClicPhoto={enEdition ? "Aucune photo — cliquez pour en ajouter" : "Cliquez pour ajouter la photo du véhicule"}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={retourListe}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          {!enEdition && (
            <Button type="button" variant="secondary" onClick={photosInitiales.ouvrirSelecteur}>
              <ImagePlus className="h-4 w-4" />
              {photosInitiales.photos.length > 0 ? `Photos (${photosInitiales.photos.length})` : "Ajouter des photos"}
            </Button>
          )}
        </>
      }
    />
  );

  // --- Tuiles (rubriques) ---
  const documentsSaisis = watch("documents");
  const nbDocumentsRenseignes = documentsProposes.filter((type) => {
    const d = documentsSaisis?.[type];
    return !!(d?.numeroReference?.trim() || d?.dateDebut || d?.dateExpiration);
  }).length;
  const nbEntretiensRenseignes = postesProposes.filter((p) => {
    const v = entretiens[p.idPosteEntretien];
    return !!(v?.dateDerniereIntervention || v?.compteurDerniereIntervention.trim());
  }).length;
  const nbEquipementsControles = saisiesRenseignees(equipements).filter((e) =>
    lignesEquipements.some((l) => l.idElementBord === e.idElementBord),
  ).length;

  const tuilesCreation: TuileFiche[] = [
    {
      cle: "rubrique-identification",
      titre: "Identification",
      description: "Type, immatriculation ou n° de série, marque, modèle, caractéristiques et compteur d'entrée.",
      icone: Car,
      teinte: "info",
      resume: typeSelectionne?.libelle ?? "Type à choisir",
    },
    {
      cle: "rubrique-documents",
      titre: "Documents",
      description: "Assurance, visite technique, carte grise, conformité fiscale, licence, carte carburant.",
      icone: FileText,
      teinte: "succes",
      resume: `${nbDocumentsRenseignes} / ${documentsProposes.length} ${accord(nbDocumentsRenseignes, "renseigné")}`,
    },
    {
      cle: "rubrique-bord",
      titre: "Sécurité",
      description: "Éléments de sécurité et boîte à outils présents à bord.",
      icone: ShieldCheck,
      teinte: "danger",
      resume: `${nbEquipementsControles} / ${lignesEquipements.length} ${accord(nbEquipementsControles, "contrôlé")}`,
    },
    {
      cle: "rubrique-entretien",
      titre: "Entretien",
      description: "Dernières vidanges et derniers contrôles connus : les échéances sont calculées automatiquement.",
      icone: Wrench,
      teinte: "alerte",
      resume: `${nbEntretiensRenseignes} / ${postesProposes.length} ${accord(nbEntretiensRenseignes, "renseigné")}`,
    },
  ];

  const nbEnRetard = echeances?.filter((e) => e.statut === "EN_RETARD").length ?? 0;
  const nbBientot = echeances?.filter((e) => e.statut === "BIENTOT").length ?? 0;
  const tuilesCorrection: TuileFiche[] = [
    {
      cle: "fiche",
      titre: "Identification",
      description: "Identification et caractéristiques techniques du véhicule.",
      icone: Car,
      teinte: "info",
    },
    {
      cle: "photos",
      titre: "Photos",
      description: "Photos du véhicule et choix de la photo principale.",
      icone: Camera,
      teinte: "succes",
      resume: photosEngin ? pluriel(photosEngin.length, "photo") : undefined,
    },
    {
      cle: "bord",
      titre: "Sécurité",
      description: "Contrôle des éléments de sécurité et de la boîte à outils.",
      icone: ShieldCheck,
      teinte: "danger",
      resume: etatBord ? pluriel(etatBord.filter((l) => l.present === false).length, "manquant") : undefined,
    },
    {
      cle: "entretien",
      titre: "Entretien",
      description: "Échéancier d'entretien et interventions effectuées.",
      icone: Wrench,
      teinte: "alerte",
      resume: echeances ? (nbEnRetard > 0 ? `${nbEnRetard} en retard` : nbBientot > 0 ? `${nbBientot} à échéance proche` : "À jour") : undefined,
    },
    // Coûts fixes du véhicule (TCO, 2026-09-29) : visible des rôles de gestion seulement.
    ...(voitCouts
      ? [
          {
            cle: "couts",
            titre: "Coûts",
            description: "Achat ou location, amortissement, assurance, taxes et vignette.",
            icone: Wallet,
            teinte: "neutre" as const,
          },
        ]
      : []),
  ];

  const allerARubrique = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const formulaire = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      <BandeauNonEnregistre visible={modifie} />

      <Section
        id="rubrique-identification"
        icone={Car}
        teinte="info"
        titre="Identification"
        description="Le type choisi détermine l'identifiant exigé."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Champ id="idTypeEngin" label="Type de véhicule" erreur={errors.idTypeEngin?.message}>
            <Controller
              control={control}
              name="idTypeEngin"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="idTypeEngin">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesEngin
                      ?.filter((type) => type.actif || String(type.idTypeEngin) === field.value)
                      .map((type) => (
                        <SelectItem key={type.idTypeEngin} value={String(type.idTypeEngin)}>
                          {type.libelle}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Champ>
          {estEnginChantier ? (
            <Champ id="numeroSerie" label="Numéro de série">
              <Input id="numeroSerie" {...register("numeroSerie")} />
            </Champ>
          ) : (
            <Champ id="immatriculation" label="Immatriculation">
              <Input id="immatriculation" {...register("immatriculation")} />
            </Champ>
          )}
          <Champ id="marque" label="Marque" erreur={errors.marque?.message}>
            <Input id="marque" {...register("marque")} />
          </Champ>
          <Champ id="modele" label="Modèle" erreur={errors.modele?.message}>
            <Input id="modele" {...register("modele")} />
          </Champ>
          <Champ id="numeroChassis" label="Numéro de châssis">
            <Input id="numeroChassis" {...register("numeroChassis")} />
          </Champ>
        </div>
      </Section>

      {!enEdition && (
        <Section
          icone={Camera}
          teinte="succes"
          titre="Photos du véhicule"
          description="Facultatif — la photo principale s'affiche en haut de la fiche ; elle sera envoyée dès la création du véhicule."
        >
          <SelectionPhotosInitiales selection={photosInitiales} />
        </Section>
      )}

      <Section titre="Caractéristiques techniques" description="Facultatif — informations figurant sur la carte grise ou la plaque constructeur.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Champ id="energie" label="Énergie">
            <Controller
              control={control}
              name="energie"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="energie">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUCUNE_ENERGIE}>Non renseignée</SelectItem>
                    {ENERGIES.map((e) => (
                      <SelectItem key={e.valeur} value={e.valeur}>
                        {e.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Champ>
          <Champ id="capaciteReservoirLitres" label="Réservoir (litres)" erreur={errors.capaciteReservoirLitres?.message}>
            <Input id="capaciteReservoirLitres" inputMode="decimal" {...register("capaciteReservoirLitres")} />
          </Champ>
          <Champ
            id="consommationReferenceL100km"
            label="Consommation de référence (L/100 km)"
            erreur={errors.consommationReferenceL100km?.message}
          >
            <Input
              id="consommationReferenceL100km"
              inputMode="decimal"
              placeholder="ex. 9,5"
              title="Chaque plein, appoint ou bidon est contrôlé par rapport à cette valeur. Si le champ est vide, la moyenne habituelle du véhicule est retenue."
              {...register("consommationReferenceL100km")}
            />
          </Champ>
          <Champ id="dateMiseEnCirculation" label="1re mise en circulation" erreur={errors.dateMiseEnCirculation?.message}>
            <Input id="dateMiseEnCirculation" type="date" max={aujourdhui()} {...register("dateMiseEnCirculation")} />
          </Champ>
          <Champ id="dateAcquisition" label="Date d'acquisition" erreur={errors.dateAcquisition?.message}>
            <Input id="dateAcquisition" type="date" max={aujourdhui()} {...register("dateAcquisition")} />
          </Champ>
          <Champ id="couleur" label="Couleur" erreur={errors.couleur?.message}>
            <Input id="couleur" {...register("couleur")} />
          </Champ>
          {!estEnginChantier && (
            <Champ id="puissanceFiscaleCv" label="Puissance fiscale (CV)" erreur={errors.puissanceFiscaleCv?.message}>
              <Input id="puissanceFiscaleCv" inputMode="numeric" {...register("puissanceFiscaleCv")} />
            </Champ>
          )}
          <Champ id="nombrePlaces" label="Nombre de places" erreur={errors.nombrePlaces?.message}>
            <Input id="nombrePlaces" inputMode="numeric" {...register("nombrePlaces")} />
          </Champ>
          <Champ id="chargeUtileKg" label="Charge utile (kg)" erreur={errors.chargeUtileKg?.message}>
            <Input id="chargeUtileKg" inputMode="decimal" {...register("chargeUtileKg")} />
          </Champ>
        </div>
      </Section>

      {!enEdition && (
        <Section
          titre="Entrée dans le parc"
          description="Relevé du compteur le jour où le véhicule rejoint le parc — il ne pourra ensuite qu'augmenter."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {estEnginChantier ? (
              <Champ id="compteurHeuresInitial" label="Compteur d'heures" erreur={errors.compteurHeuresInitial?.message}>
                <Input id="compteurHeuresInitial" inputMode="decimal" placeholder="0" {...register("compteurHeuresInitial")} />
              </Champ>
            ) : (
              <Champ id="kilometrageInitial" label="Kilométrage (km)" erreur={errors.kilometrageInitial?.message}>
                <Input id="kilometrageInitial" inputMode="decimal" placeholder="0" {...register("kilometrageInitial")} />
              </Champ>
            )}
            <div className="space-y-2">
              <Label htmlFor="equipeGps">Équipé d'un GPS</Label>
              <div className="flex h-10 items-center gap-3">
                <Controller
                  control={control}
                  name="equipeGps"
                  render={({ field }) => (
                    <Switch id="equipeGps" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <span className="text-sm text-muted-foreground">{watch("equipeGps") ? "Oui" : "Non"}</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {!enEdition && (
        <Section
          id="rubrique-documents"
          icone={FileText}
          teinte="succes"
          titre="Dossier complet du véhicule"
          description="Laissez une ligne vide si le document n'est pas encore disponible : vous pourrez l'ajouter plus tard depuis l'écran Documents. Les alertes d'expiration s'appliquent automatiquement."
        >
          <div className="space-y-4">
            {documentsProposes.map((type) => (
              <div key={type} className="grid gap-4 border-b pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[160px_1fr_1fr_1fr] sm:items-start">
                <p className="pt-1 text-sm font-medium sm:pt-8">{LIBELLES_TYPE_DOCUMENT[type]}</p>
                <Champ id={`${type}-numero`} label="Référence">
                  <Input id={`${type}-numero`} {...register(`documents.${type}.numeroReference`)} />
                </Champ>
                <Champ id={`${type}-debut`} label="Date d'émission">
                  <Input id={`${type}-debut`} type="date" {...register(`documents.${type}.dateDebut`)} />
                </Champ>
                <Champ
                  id={`${type}-expiration`}
                  label="Date d'expiration"
                  erreur={erreursDocuments?.[type]?.dateExpiration?.message}
                >
                  <Input id={`${type}-expiration`} type="date" {...register(`documents.${type}.dateExpiration`)} />
                </Champ>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!enEdition && (
        <Section
          id="rubrique-bord"
          icone={ShieldCheck}
          teinte="danger"
          titre="Éléments de sécurité et boîte à outils"
          description="Inventaire à l'entrée dans le parc. Les lignes laissées sans réponse ne sont pas enregistrées."
        >
          {typeSelectionne ? (
            <ChecklistEquipementsBord
              lignes={lignesEquipements}
              valeurs={equipements}
              onChange={(id, valeur) => setEquipements((v) => ({ ...v, [id]: valeur }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Choisissez d'abord le type de véhicule.</p>
          )}
        </Section>
      )}

      {!enEdition && (
        <Section
          id="rubrique-entretien"
          icone={Wrench}
          teinte="alerte"
          titre="Entretien du véhicule"
          description="Dernière intervention connue pour chaque poste : la prochaine échéance est calculée automatiquement et suivie par des alertes. Laissez vide si inconnue."
        >
          {typeSelectionne ? (
            <SaisieEntretienInitial
              postes={postesProposes}
              categorie={categorie}
              valeurs={entretiens}
              erreurs={erreursEntretien}
              versNombre={versNombre}
              onChange={(id, valeur) => setEntretiens((v) => ({ ...v, [id]: valeur }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Choisissez d'abord le type de véhicule.</p>
          )}
        </Section>
      )}

      {/* bottom-20 : reste au-dessus de la barre de navigation flottante du bas. */}
      <div className="sticky bottom-20 z-10 -mx-1 flex justify-end gap-2 rounded-xl border bg-background/95 px-3 py-3 shadow-sm backdrop-blur">
        <Button type="button" variant="outline" onClick={retourListe}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {enEdition ? "Enregistrer la fiche" : "Créer le véhicule"}
        </Button>
      </div>
    </form>
  );

  if (enEdition && engin) {
    const compteurActuel = engin.typeEngin.categorie === "ENGIN_CHANTIER" ? engin.compteurHeures : engin.kilometrage;
    return (
      <MiseEnPageFiche
        colonneGauche={
          <>
            {banniere}
            <TuilesFiche tuiles={tuilesCorrection} active={onglet} onDetails={setOnglet} disposition="colonne" />
          </>
        }
      >
        <Tabs value={onglet} onValueChange={setOnglet}>
          <TabsContent value="fiche" className="mt-0">
            {formulaire}
          </TabsContent>
          <TabsContent value="photos" className="mt-0">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Photos du véhicule</CardTitle>
              </CardHeader>
              <CardContent>
                <GaleriePhotosEngin idEngin={engin.idEngin} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bord" className="mt-0">
            <EquipementsBordEngin idEngin={engin.idEngin} />
          </TabsContent>
          <TabsContent value="entretien" className="mt-0">
            <EcheancesEntretienEngin idEngin={engin.idEngin} compteurActuel={compteurActuel} />
          </TabsContent>
          {voitCouts && (
            <TabsContent value="couts" className="mt-0">
              <CoutsVehiculeFiche idEngin={engin.idEngin} peutModifier={peut(session?.role, "GERER_PARC")} />
            </TabsContent>
          )}
        </Tabs>
      </MiseEnPageFiche>
    );
  }

  return (
    <MiseEnPageFiche
      colonneGauche={
        <>
          <input {...photosInitiales.propsChamp} />
          {banniere}
          <TuilesFiche tuiles={tuilesCreation} onDetails={allerARubrique} disposition="colonne" />
        </>
      }
    >
      {formulaire}
    </MiseEnPageFiche>
  );
}
