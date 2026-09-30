import { peut, type Capacite } from "@/lib/droits";
import { pageVisible } from "@/routes/acces-pages";
import { normaliserRecherche } from "@/components/data-table/liste";
import type { RoleLibelle } from "@/types/auth";

/**
 * Actions rapides de la recherche globale (2026-09-30) : chacune ouvre la
 * page et sa fenêtre de création (`?action=nouveau`, voir PageHeader).
 * Proposées seulement si le rôle peut les faire. Logique pure, testée.
 */
export interface ActionRapide {
  libelle: string;
  chemin: string;
  capacite: Capacite;
  motsCles: string;
}

export const ACTIONS_RAPIDES: ActionRapide[] = [
  { libelle: "Ajouter un plein", chemin: "/carburant?action=nouveau", capacite: "SAISIE_TERRAIN", motsCles: "plein carburant gasoil essence appoint bidon" },
  { libelle: "Déclarer un incident", chemin: "/incidents?action=nouveau", capacite: "SAISIE_TERRAIN", motsCles: "incident panne accident vol" },
  { libelle: "Nouvelle mission", chemin: "/missions?action=nouveau", capacite: "GERER_PARC", motsCles: "mission trajet livraison" },
  { libelle: "Nouvelle maintenance", chemin: "/maintenance?action=nouveau", capacite: "GERER_MAINTENANCE", motsCles: "maintenance atelier reparation entretien vidange" },
  { libelle: "Nouveau véhicule", chemin: "/engins/nouveau", capacite: "GERER_PARC", motsCles: "vehicule engin camion voiture" },
  { libelle: "Nouveau conducteur", chemin: "/conducteurs?action=nouveau", capacite: "GERER_PARC", motsCles: "conducteur chauffeur operateur" },
  { libelle: "Nouveau document", chemin: "/documents?action=nouveau", capacite: "GERER_PARC", motsCles: "document assurance visite carte grise" },
  { libelle: "Nouveau chantier", chemin: "/chantiers/nouveau", capacite: "GERER_PARC", motsCles: "chantier site projet" },
];

/** Sans terme : toutes les actions permises ; avec : celles dont le libellé ou les mots-clés contiennent chaque mot. */
export function actionsPour(role: RoleLibelle | undefined, terme: string): ActionRapide[] {
  const mots = normaliserRecherche(terme).split(" ").filter(Boolean);
  return ACTIONS_RAPIDES.filter((a) => peut(role, a.capacite) && pageVisible(role, a.chemin)).filter((a) => {
    const texte = normaliserRecherche(`${a.libelle} ${a.motsCles}`);
    return mots.every((m) => texte.includes(m));
  });
}
