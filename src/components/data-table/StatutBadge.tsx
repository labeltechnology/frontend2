import { Badge, type BadgeProps } from "@/components/ui/badge";
import { libelleEnum } from "@/lib/utils";

/**
 * Associe chaque valeur d'énumération de statut (tous modules confondus) à
 * une variante de couleur cohérente, centralisée ici plutôt que dupliquée
 * dans chaque écran de liste.
 */
const VARIANTE_PAR_STATUT: Record<string, BadgeProps["variant"]> = {
  // Engin
  DISPONIBLE: "success",
  AFFECTE: "secondary",
  EN_MISSION: "default",
  EN_PANNE: "destructive",
  EN_MAINTENANCE: "warning",
  REFORME: "outline",
  VENDU: "outline",
  // Conducteur
  EN_SERVICE: "success",
  SUSPENDU: "destructive",
  CONGE: "secondary",
  INACTIF: "outline",
  // Mission / Affectation
  PLANIFIEE: "secondary",
  EN_COURS: "default",
  TERMINEE: "success",
  ANNULEE: "destructive",
  ACTIVE: "default",
  // Utilisateur
  ACTIF: "success",
  DESACTIVE: "destructive",
  // DispositifGps
  HORS_SERVICE: "destructive",
  // Maintenance
  // (PLANIFIEE/EN_COURS/TERMINEE déjà couverts ci-dessus)
  // Incident
  DECLARE: "warning",
  EN_TRAITEMENT: "secondary",
  CLOTURE: "success",
  // Zone
  // (actif est un booléen, traité séparément par les écrans zone)
  // Priorité alerte
  FAIBLE: "outline",
  MOYENNE: "secondary",
  ELEVEE: "warning",
  CRITIQUE: "destructive",
  // Contrat de location externe (ACTIF déjà couvert ci-dessus)
  TERMINE: "outline",
  // Facture de location (ANNULEE déjà couvert ci-dessus)
  EMISE: "secondary",
  PAYEE: "success",
};

export function StatutBadge({ statut }: { statut: string | null | undefined }) {
  if (!statut) return <span className="text-muted-foreground">—</span>;
  return <Badge variant={VARIANTE_PAR_STATUT[statut] ?? "outline"}>{libelleEnum(statut)}</Badge>;
}
