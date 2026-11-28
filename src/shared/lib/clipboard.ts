/// Copia un texto al portapapeles del navegador y devuelve si la operación tuvo éxito.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
