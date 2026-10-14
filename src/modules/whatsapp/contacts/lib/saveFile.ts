/// Guarda un binario de la API (el ejemplo para importar) con el nombre que se le da, sin abrirlo en otra pestaña. El
/// enlace temporal desaparece enseguida; la URL del Blob se libera después de un plazo acotado, porque Firefox y Safari
/// la leen después del clic.
export async function saveResponseAs(response: Response, name: string): Promise<void> {
  const blob = await response.blob();
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
