"use client";

import Image from "next/image";
import { useState } from "react";

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ServiceImage({
  src,
  alt,
  width = 80,
  height = 80,
  className = "",
}: ServiceImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Função para validar se a URL é válida
  const isValidUrl = (url: string): boolean => {
    try {
      // Verifica se é uma URL absoluta válida
      new URL(url);
      return true;
    } catch {
      // Verifica se é um caminho relativo válido (começa com /)
      return url.startsWith("/") && url.length > 1;
    }
  };

  // Determina a fonte da imagem com validação
  const getImageSrc = (): string => {
    if (!src || imageError) {
      return "/img-generic.png";
    }

    const trimmedSrc = src.trim();
    if (trimmedSrc === "" || !isValidUrl(trimmedSrc)) {
      return "/img-generic.png";
    }

    return trimmedSrc;
  };

  const imageSrc = getImageSrc();

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`}
      style={{ width, height }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover transition-opacity duration-200"
        style={{
          opacity: isLoading ? 0 : 1,
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
        sizes="(max-width: 768px) 80px, 80px"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
