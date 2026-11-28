function sanitizeFileName(name: string, fallback: string): string {
  const cleaned = Array.from(name.trim(), (char) => (char.charCodeAt(0) < 32 || char === "/" || char === "\\" ? "_" : char)).join("");
  return cleaned || fallback;
}

function decodeRfc5987(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/// Lee el nombre sugerido en `Content-Disposition` (RFC 6266): prioriza `filename*=UTF-8''…` sobre `filename=`,
/// y no pasa el `filename=` plano por `decodeURIComponent` (un `%` literal en el nombre no rompe la descarga).
export function contentDispositionFileName(disposition: string | null | undefined, fallback: string): string {
  if (!disposition) return fallback;
  const extended = /(?:^|;)\s*filename\*\s*=\s*utf-8''([^;]+)/i.exec(disposition);
  if (extended) {
    const decoded = decodeRfc5987(extended[1].trim().replace(/^"(.*)"$/, "$1"));
    if (decoded) return sanitizeFileName(decoded, fallback);
  }
  const plain = /(?:^|;)\s*filename\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;]+))/i.exec(disposition);
  if (plain) {
    const raw = (plain[1] !== undefined ? plain[1].replace(/\\(.)/g, "$1") : plain[2]).trim();
    if (raw) return sanitizeFileName(raw, fallback);
  }
  return fallback;
}

/// Guarda en el equipo un archivo armado en el navegador, con el nombre que se le da y sin abrirlo en otra pestaña (como
/// `saveResponseAs` de WhatsApp). El enlace temporal desaparece enseguida; la URL del Blob se libera después de un plazo
/// acotado, porque Firefox y Safari la leen después del clic.
export function saveBlobAs(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

/// Guarda un binario devuelto por la API con el nombre de `Content-Disposition` (o `fallback` si no viene).
export async function saveResponseAs(response: Response, fallback: string): Promise<void> {
  const name = contentDispositionFileName(response.headers.get("content-disposition"), fallback);
  saveBlobAs(await response.blob(), name);
}
