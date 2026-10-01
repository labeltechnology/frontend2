import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BandeauNonEnregistre } from "@/components/confirmation/BandeauNonEnregistre";
import { useGardeModifications } from "@/components/confirmation/useGardeModifications";
import { useTitreFilAriane } from "@/components/layout/fil-ariane/ContexteFilAriane";
import { z } from "zod";
import { ArrowLeft, ClipboardList, Flag, Loader2, Map as IconeCarte, MapPin, Save, Truck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/useAuth";
import { BoutonDiscussion } from "@/features/messagerie/BoutonDiscussion";
import { LIBELLE_STATUT, VARIANT_STATUT } from "@/features/chantiers/ChantiersPage";
import { useZonesChantier } from "@/features/chantiers/api";
import { CartePositionChantier } from "@/features/chantiers/fiche/CartePositionChantier";
import {
  problemePeriodeConducteur,
  requeteConducteurs,
  synchroniserConducteurs,
  type ConducteurFiche,
} from "@/features/chantiers/fiche/conducteurs-chantier";
import {
  besoinsDepuisEngins,
  problemePeriode,
  synchroniserAvecChantier,
  type PeriodeChantier,
  type VehiculeFiche,
} from "@/features/chantiers/fiche/engins-chantier";
import {
  useConducteursCandidats,
  useCreerFicheChantier,
  useEnginsCandidats,
  useFicheChantier,
  useModifierFicheChantier,
} from "@/features/chantiers/fiche/fiche-api";
import { PlanificationConducteurs } from "@/features/chantiers/fiche/PlanificationConducteurs";
import { PlanificationEngins } from "@/features/chantiers/fiche/PlanificationEngins";
import { OngletJournalChantier } from "@/features/chantiers/journal/OngletJournalChantier";
import { OngletCoutsChantier } from "@/features/chantiers/suivi/OngletCoutsChantier";
import { OngletDefaillancesChantier } from "@/features/chantiers/defaillances/OngletDefaillancesChantier";
import { OngletDemandesChantier } from "@/features/chantiers/demandes/OngletDemandesChantier";
import { OrganisationChantierEditeur } from "@/features/chantiers/organisation/OrganisationChantierEditeur";
import {
  estResponsable,
  organisationParDefaut,
  problemeOrganisation,
  requeteOrganisation,
  saisieDepuis,
  type OrganisationSaisie,
} from "@/features/chantiers/organisation/organisation";
import { OngletTerrainChantier } from "@/features/chantiers/terrain/OngletTerrainChantier";
import type { PositionCarte } from "@/features/chantiers/fiche/position";
import { useTypesEngin } from "@/features/engins/api";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { ApiError } from "@/lib/api-client";
import type { FicheChantierRequest } from "@/types/chantier";
import { toast } from "sonner";
import { peut } from "@/lib/droits";

const schema = z
  .object({
    nom: z.string().trim().min(1, "Requis").max(150, "150 caractères maximum"),
    lieu: z.string().max(255, "255 caractères maximum").optional(),
    dateDebutPrevue: z.string().min(1, "Requis"),
    dateFinPrevue: z.string().min(1, "Requis"),
    description: z.string().max(2000, "2 000 caractères maximum").optional(),
  })
  .refine((v) => v.dateFinPrevue >= v.dateDebutPrevue, {
    message: "La date de fin ne peut pas précéder la date de début",
    path: ["dateFinPrevue"],
  });

type Valeurs = z.infer<typeof schema>;

const ID_FORMULAIRE = "fiche-chantier";

function Rubrique({
  icone,
  titre,
  description,
  children,
  className,
}: {
  icone: ReactNode;
  titre: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icone}</span>
          {titre}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * Fiche chantier (2026-09-24) — même principe que la fiche véhicule : une
 * page unique au lieu de quatre dialogues (chantier, besoins, engins, plan).
 * Carte de position en haut, identification, puis glisser-déposer des
 * véhicules à employer. Depuis le 2026-09-24, les besoins en matériel ne se
 * saisissent plus : la liste des véhicules EST le besoin (voir
 * engins-chantier.ts#besoinsDepuisEngins), envoyée au backend pour garder la
 * table des besoins à jour. Tout est enregistré en une fois
 * (« Enregistrer la fiche ») par FicheChantierService — une transaction :
 * si un engin est refusé (déjà sur un autre chantier, indisponible), rien
 * n'est enregistré et le message l'indique.
 *
 * Lecture seule pour les profils sans GERER_PARC (DG, responsable du parc — lib/droits.ts)
 * et pour un chantier terminé ou annulé (le backend refuse de toute façon).
 *
 * Depuis le 2026-09-29 (V63) : les conducteurs se déposent aussi ici, chacun
 * avec sa période (conducteurs-chantier.ts) ; ils ne sont envoyés que si leur
 * liste est chargée (absents = inchangés côté serveur). Un chantier existant
 * a trois onglets : Fiche, Journal et Coûts. Le journal et les coûts sont
 * HORS du <form> (leurs dialogues ne doivent pas soumettre la fiche). Le plan
 * détaillé (zones) reste sur son écran.
 *
 * V64 (2026-09-29) : rubrique « Organisation » (type, priorité, chef de
 * chantier, rayon de présence, budget, client) envoyée avec la fiche ; un
 * véhicule réservé ne se dépose que sur un chantier critique ; onglets
 * Terrain (présence GPS, sorties / retours, préventif), Incidents (causes,
 * remplacement) et Demandes. Le chef de chantier ne suit que ses chantiers.
 */
export function FicheChantierPage() {
  const navigate = useNavigate();
  const { idChantier: parametre } = useParams<{ idChantier: string }>();
  const idChantier = parametre !== undefined ? Number(parametre) : undefined;
  const enEdition = idChantier !== undefined;

  const { session } = useAuth();
  const autorise = peut(session?.role, "GERER_PARC");
  // Avis si ce chantier est modifié ailleurs pendant la saisie de la fiche (temps réel, 2026-09-29).
  useEditionEnCours("chantiers", autorise ? idChantier : undefined);
  const consultation = peut(session?.role, "CONSULTER_GESTION");
  const chefDeChantier = session?.role === "CHEF_CHANTIER";

  const fiche = useFicheChantier(idChantier);
  const { data: tousTypes } = useTypesEngin();
  const { data: zones } = useZonesChantier(idChantier);
  const creer = useCreerFicheChantier();
  const modifier = useModifierFicheChantier(idChantier ?? 0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<Valeurs>({
    resolver: zodResolver(schema),
    defaultValues: { nom: "", lieu: "", dateDebutPrevue: "", dateFinPrevue: "", description: "" },
  });

  // Période du chantier saisie : bornes de la période de chaque véhicule
  // (« date de mission du véhicule », 2026-09-24).
  const dateDebut = watch("dateDebutPrevue");
  const dateFin = watch("dateFinPrevue");
  const periode = useMemo<PeriodeChantier | null>(
    () => (dateDebut && dateFin && dateFin >= dateDebut ? { debut: dateDebut, fin: dateFin } : null),
    [dateDebut, dateFin],
  );
  const candidats = useEnginsCandidats(idChantier);
  const candidatsConducteurs = useConducteursCandidats(idChantier, consultation);

  const [position, setPosition] = useState<PositionCarte | null>(null);
  const [selection, setSelection] = useState<VehiculeFiche[]>([]);
  const [conducteurs, setConducteurs] = useState<ConducteurFiche[]>([]);
  const [onglet, setOnglet] = useState("fiche");
  const [organisation, setOrganisation] = useState<OrganisationSaisie>(organisationParDefaut);
  const [initialisee, setInitialisee] = useState(!enEdition);

  // Les véhicules qui suivent la période du chantier prennent ses nouvelles dates.
  useEffect(() => {
    if (!periode) return;
    setSelection((actuelle) => synchroniserAvecChantier(actuelle, periode));
    setConducteurs((actuels) => synchroniserConducteurs(actuels, periode));
  }, [periode]);

  // Chargement unique de la fiche existante dans l'état local (les rechargements
  // ultérieurs du cache ne doivent pas écraser une saisie en cours).
  useEffect(() => {
    if (!enEdition || initialisee || !fiche.data) return;
    const { chantier, engins, conducteurs: rattaches } = fiche.data;
    reset({
      nom: chantier.nom,
      lieu: chantier.lieu ?? "",
      dateDebutPrevue: chantier.dateDebutPrevue,
      dateFinPrevue: chantier.dateFinPrevue,
      description: chantier.description ?? "",
    });
    setPosition(chantier.latitude != null && chantier.longitude != null ? [chantier.latitude, chantier.longitude] : null);
    setSelection(
      engins.map((a) => ({
        idEngin: a.engin.idEngin,
        dateDebut: a.dateDebutPrevue,
        dateFin: a.dateFinPrevue,
        suitChantier: a.dateDebutPrevue === chantier.dateDebutPrevue && a.dateFinPrevue === chantier.dateFinPrevue,
      })),
    );
    setConducteurs(
      (rattaches ?? []).map((a) => {
        const debut = a.dateDebutPrevue ?? chantier.dateDebutPrevue;
        const fin = a.dateFinPrevue ?? chantier.dateFinPrevue;
        return {
          idConducteur: a.conducteur.idConducteur,
          dateDebut: debut,
          dateFin: fin,
          suitChantier: debut === chantier.dateDebutPrevue && fin === chantier.dateFinPrevue,
          multiSites: a.multiSites ?? false,
        };
      }),
    );
    setOrganisation(saisieDepuis(fiche.data.organisation));
    setInitialisee(true);
  }, [enEdition, initialisee, fiche.data, reset]);

  const chantier = fiche.data?.chantier;
  const figee = chantier?.statut === "TERMINE" || chantier?.statut === "ANNULE";
  const lectureSeule = !autorise || figee;
  // Chef de chantier (V64) : suivi et écritures limités aux chantiers dont il est responsable.
  const surSesChantiers = !chefDeChantier || estResponsable(fiche.data?.organisation, session?.idUtilisateur);
  const suivi = peut(session?.role, "SUIVI_CHANTIER") && surSesChantiers;

  const typesEngin = useMemo(() => (tousTypes ?? []).filter((t) => t.actif), [tousTypes]);
  const enginsDeposes = useMemo(() => {
    const parId = new Map((candidats.data ?? []).map((c) => [c.engin.idEngin, c.engin]));
    return selection.flatMap((v) => {
      const engin = parId.get(v.idEngin);
      return engin ? [engin] : [];
    });
  }, [candidats.data, selection]);

  const enregistrement = creer.isPending || modifier.isPending;
  // Ergonomie (2026-09-30) : garde de saisie non enregistrée (champs du formulaire) et fil d'Ariane.
  useGardeModifications(isDirty && !enregistrement, "La fiche du chantier a des modifications non enregistrées.");
  useTitreFilAriane(fiche.data?.chantier.nom ?? (enEdition ? null : "Nouveau chantier"));

  const enregistrer = async (valeurs: Valeurs) => {
    // Les besoins sont déduits des véhicules : sans la liste du parc, on ne peut pas les compter.
    if (!candidats.data) {
      toast.error("La liste des véhicules n'est pas encore chargée — réessayez dans un instant.");
      return;
    }
    const periodeChantier = { debut: valeurs.dateDebutPrevue, fin: valeurs.dateFinPrevue };
    const occupationsParEngin = new Map(candidats.data.map((c) => [c.engin.idEngin, c.occupations]));
    const aCorriger = selection.filter((v) => problemePeriode(v, periodeChantier, occupationsParEngin.get(v.idEngin) ?? []));
    if (aCorriger.length > 0) {
      toast.error("Corrigez la période des véhicules signalés en rouge avant d'enregistrer.");
      return;
    }
    const problemeOrga = problemeOrganisation(organisation);
    if (problemeOrga) {
      toast.error(`Organisation du chantier : ${problemeOrga}`);
      return;
    }
    // Conducteurs : envoyés seulement si leur liste est chargée (sinon le serveur les laisse tels quels).
    const listeConducteurs = candidatsConducteurs.data;
    if (listeConducteurs) {
      const occupationsParConducteur = new Map(listeConducteurs.map((c) => [c.conducteur.idConducteur, c.occupations]));
      const conducteursACorriger = conducteurs.filter((c) =>
        problemePeriodeConducteur(c, periodeChantier, occupationsParConducteur.get(c.idConducteur) ?? []),
      );
      if (conducteursACorriger.length > 0) {
        toast.error("Corrigez la période des conducteurs signalés en rouge avant d'enregistrer.");
        return;
      }
    }
    const requete: FicheChantierRequest = {
      nom: valeurs.nom.trim(),
      lieu: valeurs.lieu?.trim() || undefined,
      dateDebutPrevue: valeurs.dateDebutPrevue,
      dateFinPrevue: valeurs.dateFinPrevue,
      description: valeurs.description?.trim() || undefined,
      latitude: position?.[0],
      longitude: position?.[1],
      // Besoins = véhicules déposés, comptés par type (plus de saisie séparée).
      besoins: besoinsDepuisEngins(enginsDeposes),
      engins: selection.map((v) => ({ idEngin: v.idEngin, dateDebut: v.dateDebut, dateFin: v.dateFin })),
      ...(listeConducteurs ? { conducteurs: requeteConducteurs(conducteurs) } : {}),
      organisation: requeteOrganisation(organisation),
    };
    try {
      if (enEdition && idChantier !== undefined) {
        await modifier.mutateAsync(requete);
        toast.success("Fiche chantier enregistrée");
        reset(valeurs);
      } else {
        const cree = await creer.mutateAsync(requete);
        toast.success("Chantier créé");
        navigate(`/chantiers/${cree.chantier.idChantier}/fiche`, { replace: true });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible d'enregistrer la fiche — rien n'a été modifié.");
    }
  };

  if (enEdition && (fiche.isLoading || !initialisee)) {
    if (fiche.isError) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-destructive">Chantier introuvable ou inaccessible.</p>
          <Button variant="outline" onClick={() => navigate("/chantiers")}>
            <ArrowLeft className="h-4 w-4" />
            Retour aux chantiers
          </Button>
        </div>
      );
    }
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de la fiche…
      </p>
    );
  }

  const boutonEnregistrer = !lectureSeule && (
    <Button type="submit" form={ID_FORMULAIRE} disabled={enregistrement}>
      {enregistrement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {enEdition ? "Enregistrer la fiche" : "Créer le chantier"}
    </Button>
  );

  const entete = (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 font-display text-2xl font-semibold">
            {enEdition ? chantier?.nom : "Nouveau chantier"}
            {chantier && <Badge variant={VARIANT_STATUT[chantier.statut]}>{LIBELLE_STATUT[chantier.statut]}</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lectureSeule
              ? figee
                ? "Chantier terminé ou annulé : la fiche est en lecture seule."
                : "Consultation — la modification est réservée aux administrateurs et responsables de parc."
              : "Placez le chantier sur la carte et déposez les véhicules à employer, puis enregistrez l'ensemble en une seule fois."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/chantiers")}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          {enEdition && (
            <Button type="button" variant="secondary" onClick={() => navigate(`/chantiers/${idChantier}/plan`)}>
              <IconeCarte className="h-4 w-4" />
              Plan du chantier
            </Button>
          )}
          {idChantier !== undefined && <BoutonDiscussion type="CHANTIER" idObjet={idChantier} />}
          {onglet === "fiche" && boutonEnregistrer}
        </div>
      </div>
  );

  const formulaire = (
    <form id={ID_FORMULAIRE} onSubmit={handleSubmit(enregistrer)} className="space-y-6 pb-20" noValidate>
      <BandeauNonEnregistre visible={isDirty && !enregistrement} />
      <Rubrique
        icone={<MapPin className="h-4 w-4" />}
        titre="Position du chantier"
        description={zones && zones.length > 0 ? "Les éléments du plan du chantier sont affichés pour vous repérer." : undefined}
      >
        <CartePositionChantier position={position} onChange={setPosition} zones={zones} lectureSeule={lectureSeule} />
      </Rubrique>

      <Rubrique icone={<ClipboardList className="h-4 w-4" />} titre="Identification">
        <fieldset disabled={lectureSeule} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du chantier</Label>
            <Input id="nom" {...register("nom")} aria-invalid={Boolean(errors.nom)} />
            {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lieu">Lieu (commune, quartier…)</Label>
            <Input id="lieu" {...register("lieu")} />
            {errors.lieu && <p className="text-sm text-destructive">{errors.lieu.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebutPrevue">Début prévu</Label>
              <Input id="dateDebutPrevue" type="date" {...register("dateDebutPrevue")} />
              {errors.dateDebutPrevue && <p className="text-sm text-destructive">{errors.dateDebutPrevue.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFinPrevue">Fin prévue</Label>
              <Input id="dateFinPrevue" type="date" {...register("dateFinPrevue")} />
              {errors.dateFinPrevue && <p className="text-sm text-destructive">{errors.dateFinPrevue.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
        </fieldset>
      </Rubrique>

      <Rubrique
        icone={<Flag className="h-4 w-4" />}
        titre="Organisation"
        description="Type de chantier (conditions d'entretien, heures prévues par jour), priorité, chef de chantier, rayon de présence GPS, budget matériel et client refacturé."
      >
        <OrganisationChantierEditeur
          valeur={organisation}
          onChange={setOrganisation}
          lectureSeule={lectureSeule}
          nomResponsableActuel={fiche.data?.organisation?.nomResponsable}
        />
      </Rubrique>

      <Rubrique
        icone={<Truck className="h-4 w-4" />}
        titre="Véhicules à employer"
        description="Glissez les véhicules du parc vers le chantier (ou utilisez les boutons + et ×), puis ajustez si nécessaire la période de chaque véhicule. Tout véhicule est disponible, sauf s'il est en panne ou déjà prévu sur un autre chantier pendant la même période. Un véhicule retiré voit son rattachement terminé à l'enregistrement."
      >
        {!periode && (
          <p className="text-sm text-muted-foreground">
            Indiquez d'abord les dates prévues du chantier (rubrique « Identification ») : la période de chaque véhicule
            doit y être comprise.
          </p>
        )}
        {periode && candidats.isLoading && <p className="text-sm text-muted-foreground">Chargement du parc…</p>}
        {candidats.isError && <p className="text-sm text-destructive">Impossible de charger la liste des véhicules.</p>}
        {periode && candidats.data && (
          <PlanificationEngins
            candidats={candidats.data}
            selection={selection}
            onChange={setSelection}
            periode={periode}
            typesEngin={typesEngin}
            lectureSeule={lectureSeule}
            chantierCritique={organisation.priorite === "CRITIQUE"}
          />
        )}
      </Rubrique>

      <Rubrique
        icone={<Users className="h-4 w-4" />}
        titre="Conducteurs du chantier"
        description="Glissez les conducteurs vers le chantier et ajustez leur période. Un conducteur déjà sur un autre chantier à ces dates n'est accepté que si les deux rattachements sont « multi-sites » ; une mission sur la même période empêche toujours le rattachement."
      >
        {!consultation && <p className="text-sm text-muted-foreground">La liste des conducteurs n'est pas accessible à votre profil.</p>}
        {consultation && !periode && (
          <p className="text-sm text-muted-foreground">Indiquez d'abord les dates prévues du chantier.</p>
        )}
        {consultation && periode && candidatsConducteurs.isLoading && (
          <p className="text-sm text-muted-foreground">Chargement des conducteurs…</p>
        )}
        {candidatsConducteurs.isError && (
          <p className="text-sm text-destructive">
            Impossible de charger les conducteurs — ils ne seront pas modifiés à l'enregistrement.
          </p>
        )}
        {periode && candidatsConducteurs.data && (
          <PlanificationConducteurs
            candidats={candidatsConducteurs.data}
            selection={conducteurs}
            onChange={setConducteurs}
            periode={periode}
            lectureSeule={lectureSeule}
          />
        )}
      </Rubrique>

      {boutonEnregistrer && (
        <div className="sticky bottom-0 z-10 -mx-2 flex justify-end rounded-lg border border-border bg-background/90 p-3 backdrop-blur">
          {boutonEnregistrer}
        </div>
      )}
    </form>
  );

  // Création : la fiche seule. Chantier existant : onglets Fiche | Journal | Coûts.
  if (!enEdition || !chantier || idChantier === undefined) {
    return (
      <div className="space-y-6">
        {entete}
        {formulaire}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {entete}
      <Tabs value={onglet} onValueChange={setOnglet}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="fiche">Fiche</TabsTrigger>
          {suivi && <TabsTrigger value="terrain">Terrain</TabsTrigger>}
          {suivi && <TabsTrigger value="journal">Journal</TabsTrigger>}
          {suivi && <TabsTrigger value="incidents">Incidents</TabsTrigger>}
          {suivi && <TabsTrigger value="demandes">Demandes</TabsTrigger>}
          {consultation && <TabsTrigger value="couts">Coûts</TabsTrigger>}
        </TabsList>
        {/* forceMount : la saisie en cours de la fiche survit au changement d'onglet. */}
        <TabsContent value="fiche" forceMount className="data-[state=inactive]:hidden">
          {formulaire}
        </TabsContent>
        {suivi && (
          <TabsContent value="terrain">
            <OngletTerrainChantier idChantier={idChantier} peutGerer={autorise} />
          </TabsContent>
        )}
        {suivi && (
          <TabsContent value="journal">
            <OngletJournalChantier chantier={chantier} peutEcrire={peut(session?.role, "ECRIRE_JOURNAL_CHANTIER") && surSesChantiers} />
          </TabsContent>
        )}
        {suivi && (
          <TabsContent value="incidents">
            <OngletDefaillancesChantier idChantier={idChantier} peutGererParc={autorise}
              peutGererMaintenance={peut(session?.role, "GERER_MAINTENANCE")} />
          </TabsContent>
        )}
        {suivi && (
          <TabsContent value="demandes">
            <OngletDemandesChantier chantier={chantier} prioriteChantier={organisation.priorite}
              peutDemander={peut(session?.role, "DEMANDER_MATERIEL") && surSesChantiers} gestion={autorise}
              idUtilisateur={session?.idUtilisateur} />
          </TabsContent>
        )}
        {consultation && (
          <TabsContent value="couts">
            <OngletCoutsChantier idChantier={idChantier} peutGerer={autorise} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
