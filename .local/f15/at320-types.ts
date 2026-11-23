import { at320, galleryApp, galleryCase, type GalleryCase } from "../../src/test/gallery";
import { botGalleryCases } from "../../src/modules/whatsapp/bot/gallery";
const core = galleryCase("bot", "M-WA-Editar", "Editar opción", galleryApp("visual-owner", "/org/whatsapp/bot", [], { now: "2026-11-08T12:00:00Z" }));
const narrow: GalleryCase = at320(core);
const fromModule = botGalleryCases.filter((entry) => entry.viewport.width === 390).map(at320);
export { narrow, fromModule };
