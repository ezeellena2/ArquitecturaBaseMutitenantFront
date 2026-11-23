import { writeFileSync } from "node:fs";
import { at320, click, galleryApp, galleryCase } from "../../src/test/gallery.ts";
const app = galleryApp("business", "/org/whatsapp/bot", [], { actions: [click("Hacer un pedido")], readySelector: "[role=dialog]", readyText: "Editar opción 1", now: "2026-11-08T12:00:00Z" });
const phone = galleryCase("bot", "M-WA-Editar", "Cambiar a un texto", app);
const desk = galleryCase("bot", "WA-Admin-Editar", "Cambiar a un texto", app);
writeFileSync(".local/f15/prueba.json", JSON.stringify({ version: 1, stage: "12", issuer: "http://localtest.me:5192", evidence: "prueba local", cases: [desk, phone, at320(phone)], pending: [] }, null, 2));
