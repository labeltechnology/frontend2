import { FaireMaintenanceDialog } from "@/features/maintenance/FaireMaintenanceDialog";

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * « Nouvelle maintenance » de la page Maintenance. Depuis le 2026-09-28, un
 * seul formulaire pour toute l'application : FaireMaintenanceDialog (travaux,
 * commencer ou planifier avec date prévue, pièces et coûts garage), ouvert ici
 * sans véhicule imposé — le choix du véhicule est sa première étape.
 * Composant gardé pour ne pas changer les imports existants.
 */
export function MaintenanceFormDialog({ open, onOpenChange }: MaintenanceFormDialogProps) {
  return <FaireMaintenanceDialog engin={null} open={open} onOpenChange={onOpenChange} />;
}
