// Archivos ficticios del arnés. Se construyen en memoria, nunca se guardan binarios.
export interface GalleryUploadFile { name: string; mimeType: string; base64: string; byteLength: number }
export const galleryImage: GalleryUploadFile = {
  name: "captura-usuarios.png", mimeType: "image/png", byteLength: 240_000,
  base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
};
export const galleryPdf: GalleryUploadFile = {
  name: "planilla-ventas.pdf", mimeType: "application/pdf", byteLength: 1_200_000,
  // PDF válido de una página vacía. El padding conserva su estructura y offsets.
  base64: "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAwID4+CnN0cmVhbQoKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMDIgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA1IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgoyNTEKJSVFT0YK",
};
export const galleryPdfTooLarge: GalleryUploadFile = { ...galleryPdf, byteLength: 14_800_000 };
export function galleryUploadBytes(file: GalleryUploadFile): Uint8Array<ArrayBuffer> {
  if (!Number.isSafeInteger(file.byteLength) || file.byteLength <= 0 || file.byteLength > 15 * 1024 * 1024) throw new Error("Archivo ficticio fuera del límite de memoria de 15 MiB");
  const decoded = atob(file.base64);
  if (decoded.length > file.byteLength) throw new Error("Archivo ficticio truncado");
  const bytes = new Uint8Array(file.byteLength);
  // PDF permite whitespace después de EOF. PNG tolera padding posterior a IEND.
  bytes.fill(file.mimeType === "application/pdf" ? 32 : 0);
  for (let index = 0; index < decoded.length; index++) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}
