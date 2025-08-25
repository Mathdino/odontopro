"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

interface ImageCropProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: string) => void;
  imageFile: File | null;
}

export function ImageCrop({
  isOpen,
  onClose,
  onCropComplete,
  imageFile,
}: ImageCropProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Carregar imagem quando o arquivo mudar
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleCropComplete = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = imageRef.current;

    if (!ctx) return;

    // Definir tamanho do canvas (quadrado para foto de perfil)
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Calcular dimensões da imagem com zoom
    const scaledWidth = image.naturalWidth * zoom;
    const scaledHeight = image.naturalHeight * zoom;

    // Salvar contexto para rotação
    ctx.save();

    // Aplicar rotação
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    // Desenhar imagem com crop
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      scaledWidth,
      scaledHeight,
      0,
      0,
      size,
      size
    );

    // Restaurar contexto
    ctx.restore();

    // Converter para base64
    const croppedImage = canvas.toDataURL("image/jpeg", 0.8);
    onCropComplete(croppedImage);
    onClose();
  }, [crop, zoom, rotation, onCropComplete, onClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startCropX = crop.x;
    const startCropY = crop.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setCrop({
        x: startCropX - deltaX,
        y: startCropY - deltaY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de preview */}
          <div className="relative">
            <div
              className="w-64 h-64 mx-auto border-2 border-dashed border-gray-300 rounded-full overflow-hidden bg-gray-100 cursor-move"
              onMouseDown={handleMouseDown}
            >
              {imageSrc && (
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg) translate(${-crop.x}px, ${-crop.y}px)`,
                    transformOrigin: "center",
                  }}
                  draggable={false}
                />
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Arraste para reposicionar a imagem
            </p>
          </div>

          {/* Controles */}
          <div className="space-y-3">
            {/* Zoom */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zoom</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(values: number[]) => setZoom(values[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotação */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rotação</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation(0)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {rotation}°
                  </span>
                </div>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(values: number[]) => setRotation(values[0])}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCropComplete} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>

        {/* Canvas oculto para processamento */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
