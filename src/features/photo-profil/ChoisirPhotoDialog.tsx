import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Camera, Loader2, Trash2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarPersonne } from "@/features/photo-profil/AvatarPersonne";
import {
  cadreCentre,
  deplacer,
  erreurDimensions,
  erreurFichierPhoto,
  glisser,
  tailleExport,
  TYPES_ACCEPTES,
  ZOOM_MAX,
  zoomBorne,
  zoomer,
  type Cadre,
} from "@/features/photo-profil/recadrage";
import { ApiError } from "@/lib/api-client";

/** Côté de la zone d'aperçu du recadrage, en pixels d'écran. */
const APERCU = 256;

interface Source {
  url: string;
  image: HTMLImageElement;
  largeur: number;
  hauteur: number;
}

/**
 * Choisir, recadrer et enregistrer une photo de profil (2026-09-29).
 * Recadrage carré dans le navigateur (glisser l'image, curseur de zoom,
 * flèches et + / - au clavier), export JPEG 512 px ; le serveur réencode
 * ensuite l'image (métadonnées supprimées). Composant commun à « Mon compte »,
 * aux fiches conducteur et aux comptes utilisateurs.
 */
export function ChoisirPhotoDialog({
  open,
  onOpenChange,
  titre,
  description,
  nom,
  initiales,
  urlPhotoActuelle,
  enregistrer,
  retirer,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  titre: string;
  description: string;
  nom: string;
  initiales: string;
  urlPhotoActuelle: string | null | undefined;
  enregistrer: (photo: Blob) => Promise<unknown>;
  /** Absent : pas de bouton « Retirer la photo ». */
  retirer?: () => Promise<unknown>;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [cadre, setCadre] = useState<Cadre | null>(null);
  const [zoom, setZoom] = useState(1);
  const [enCours, setEnCours] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const glissement = useRef<{ x: number; y: number } | null>(null);

  // Libère l'image choisie quand on en change ou qu'on ferme.
  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source.url);
  }, [source]);

  const fermer = (ouvert: boolean) => {
    if (!ouvert) {
      setSource(null);
      setCadre(null);
      setZoom(1);
      if (champ.current) champ.current.value = "";
    }
    onOpenChange(ouvert);
  };

  const choisir = (fichier: File | null) => {
    const erreur = erreurFichierPhoto(fichier);
    if (erreur || !fichier) {
      if (fichier) toast.error(erreur);
      return;
    }
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    image.onload = () => {
      const probleme = erreurDimensions(image.naturalWidth, image.naturalHeight);
      if (probleme) {
        URL.revokeObjectURL(url);
        toast.error(probleme);
        return;
      }
      setSource({ url, image, largeur: image.naturalWidth, hauteur: image.naturalHeight });
      setCadre(cadreCentre(image.naturalWidth, image.naturalHeight));
      setZoom(1);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Image illisible : choisissez une autre photo");
    };
    image.src = url;
  };

  const changerZoom = (valeur: number) => {
    if (!source || !cadre) return;
    const z = zoomBorne(valeur);
    setZoom(z);
    setCadre(zoomer(cadre, z, source.largeur, source.hauteur));
  };

  const surAppui = (e: PointerEvent<HTMLDivElement>) => {
    glissement.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const surDeplacement = (e: PointerEvent<HTMLDivElement>) => {
    if (!glissement.current || !source || !cadre) return;
    const dx = e.clientX - glissement.current.x;
    const dy = e.clientY - glissement.current.y;
    glissement.current = { x: e.clientX, y: e.clientY };
    setCadre(glisser(cadre, dx, dy, APERCU, source.largeur, source.hauteur));
  };

  const surClavier = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!source || !cadre) return;
    const pas = cadre.cote * 0.05;
    const mouvements: Record<string, [number, number]> = {
      ArrowLeft: [-pas, 0],
      ArrowRight: [pas, 0],
      ArrowUp: [0, -pas],
      ArrowDown: [0, pas],
    };
    if (mouvements[e.key]) {
      e.preventDefault();
      const [dx, dy] = mouvements[e.key];
      setCadre(deplacer(cadre, dx, dy, source.largeur, source.hauteur));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      changerZoom(zoom + 0.25);
    } else if (e.key === "-") {
      e.preventDefault();
      changerZoom(zoom - 0.25);
    }
  };

  const exporter = (): Promise<Blob> =>
    new Promise((resoudre, rejeter) => {
      if (!source || !cadre) return rejeter(new Error("Aucune photo"));
      const taille = tailleExport(cadre);
      const toile = document.createElement("canvas");
      toile.width = taille;
      toile.height = taille;
      const contexte = toile.getContext("2d");
      if (!contexte) return rejeter(new Error("Traitement de l'image impossible"));
      contexte.fillStyle = "#ffffff";
      contexte.fillRect(0, 0, taille, taille);
      contexte.imageSmoothingQuality = "high";
      contexte.drawImage(source.image, cadre.x, cadre.y, cadre.cote, cadre.cote, 0, 0, taille, taille);
      toile.toBlob((blob) => (blob ? resoudre(blob) : rejeter(new Error("Export impossible"))), "image/jpeg", 0.9);
    });

  const surEnregistrer = async () => {
    setEnCours(true);
    try {
      await enregistrer(await exporter());
      toast.success("Photo enregistrée");
      fermer(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    } finally {
      setEnCours(false);
    }
  };

  const surRetirer = async () => {
    if (!retirer) return;
    setEnCours(true);
    try {
      await retirer();
      toast.success("Photo retirée");
      fermer(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Retrait impossible");
    } finally {
      setEnCours(false);
    }
  };

  const echelle = cadre ? APERCU / cadre.cote : 1;

  return (
    <Dialog open={open} onOpenChange={fermer}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <input
          ref={champ}
          type="file"
          accept={TYPES_ACCEPTES.join(",")}
          className="sr-only"
          aria-label="Choisir une photo"
          onChange={(e) => choisir(e.target.files?.[0] ?? null)}
        />

        {source && cadre ? (
          <div className="flex flex-col items-center gap-3">
            <div
              role="img"
              aria-label="Recadrage de la photo : glissez l'image ou utilisez les flèches, ainsi que + et − pour agrandir ou réduire"
              tabIndex={0}
              onPointerDown={surAppui}
              onPointerMove={surDeplacement}
              onPointerUp={() => (glissement.current = null)}
              onPointerCancel={() => (glissement.current = null)}
              onKeyDown={surClavier}
              className="relative cursor-grab touch-none overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              style={{ width: APERCU, height: APERCU }}
            >
              <img
                src={source.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                style={{
                  width: source.largeur * echelle,
                  height: source.hauteur * echelle,
                  transform: `translate(${-cadre.x * echelle}px, ${-cadre.y * echelle}px)`,
                }}
              />
              {/* Repère du rond affiché dans l'application. */}
              <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" aria-hidden="true" />
            </div>
            <label className="flex w-full items-center gap-2 text-sm text-muted-foreground">
              <ZoomIn className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Zoom</span>
              <input
                type="range"
                min={1}
                max={ZOOM_MAX}
                step={0.01}
                value={zoom}
                onChange={(e) => changerZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <AvatarPersonne urlPhoto={urlPhotoActuelle} initiales={initiales} nom={nom} className="h-32 w-32 text-3xl" />
            <p className="text-center text-xs text-muted-foreground">
              JPEG, PNG ou WebP. La photo est recadrée en carré ; sa position et l'appareil utilisé ne sont pas conservés.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={enCours} onClick={() => champ.current?.click()}>
              <Camera className="h-4 w-4" />
              {source ? "Autre photo" : "Choisir une photo…"}
            </Button>
            {!source && retirer && urlPhotoActuelle && (
              <Button type="button" variant="ghost" disabled={enCours} onClick={surRetirer} className="text-destructive">
                <Trash2 className="h-4 w-4" />
                Retirer
              </Button>
            )}
          </div>
          <Button type="button" disabled={!source || enCours} onClick={surEnregistrer}>
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
