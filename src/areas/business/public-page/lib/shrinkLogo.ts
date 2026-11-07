/** El lado mayor del logo que se envía: se muestra entre 40 y 84 px, y 256 alcanza también para la vista previa del enlace. */
export const logoMaxSide = 256;

export interface ShrunkLogo {
  dataUri: string;
  base64: string;
  contentType: "image/png" | "image/jpeg";
}

/**
 * Achica el logo elegido a 256 px como máximo del lado mayor, sin agrandarlo. PNG y WebP salen como PNG (conserva la
 * transparencia) y JPEG sale como JPEG: en la Etapa 10 el logo es el `og:image` del subdominio, y WhatsApp lee PNG y
 * JPEG pero no garantiza WebP. Si la imagen no se puede decodificar, rechaza.
 */
export async function shrinkLogo(file: Blob): Promise<ShrunkLogo> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, logoMaxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo dibujar el logo.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    const contentType = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const dataUri = canvas.toDataURL(contentType, 0.9);
    const prefix = `data:${contentType};base64,`;
    if (!dataUri.startsWith(prefix)) throw new Error("No se pudo codificar el logo.");
    return { dataUri, base64: dataUri.slice(prefix.length), contentType };
  } finally {
    bitmap.close();
  }
}
