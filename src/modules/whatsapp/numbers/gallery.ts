import { api, galleryApp, galleryCase, page, type GalleryCase, type GalleryPending } from "../test/gallery";

const signup = { appId: "gallery-app", configId: "gallery-config", sdkVersion: "v26.0" };

/** Galería de la E11 de esta área: un caso por tablero y estado que se fotografía, y lo pendiente con su motivo. */
export const numbersGalleryCases: readonly GalleryCase[] = [
  galleryCase("numeros", "WA-Admin-Vacio", "Sin números", galleryApp("business", "/org/whatsapp/numeros", [
    api("GET", "/api/organization/whatsapp/numbers", { numbers: page([]), paymentMissing: 0, signup }),
  ], { readyText: "Conectar número" }), { props: {} }),
];
export const numbersGalleryPending: readonly GalleryPending[] = [];
