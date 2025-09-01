/**
 * Retorna a URL da imagem do serviço ou a imagem genérica como fallback
 * @param imageUrl - URL da imagem do serviço
 * @returns URL da imagem ou fallback
 */
export function getServiceImageUrl(imageUrl?: string | null): string {
  if (!imageUrl || imageUrl.trim() === "") {
    return "/img-generic.png";
  }
  return imageUrl;
}

/**
 * Verifica se uma URL de imagem é válida
 * @param url - URL para verificar
 * @returns Promise que resolve com boolean
 */
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");
    return response.ok && contentType?.startsWith("image/") === true;
  } catch {
    return false;
  }
}
