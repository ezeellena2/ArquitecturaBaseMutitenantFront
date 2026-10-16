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
