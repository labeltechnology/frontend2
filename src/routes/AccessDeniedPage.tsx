import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldAlert className="h-12 w-12 text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">Accès refusé</h1>
        <p className="text-muted-foreground">Votre rôle ne vous permet pas d'accéder à cette page.</p>
      </div>
      <Button asChild>
        <Link to="/">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
