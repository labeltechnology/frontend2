export type ActionAudit = "CREATION" | "MODIFICATION" | "SUPPRESSION" | "CONSULTATION_SENSIBLE";

export interface JournalAudit {
  idJournalAudit: number;
  entite: string;
  idEntite: number;
  action: ActionAudit;
  idUtilisateur: number | null;
  details: string | null;
  dateAction: string;
}
