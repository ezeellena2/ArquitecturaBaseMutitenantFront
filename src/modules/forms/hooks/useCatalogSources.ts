import { usePermissions } from "@/auth/usePermissions";
import type { FormCatalogSource } from "../api/types";

/// La fuente «Contactos» la da WhatsApp por un puerto neutral (C12): sin su módulo o con su funcionalidad apagada, el origen
/// no se ofrece. Formularios no importa el módulo de WhatsApp: mira solo su llave en `/api/me`.
export const contactsChannelFeature = "whatsapp";

const sources: readonly FormCatalogSource[] = ["Manual", "Members", "Contacts"];

/** Los orígenes que se pueden elegir al crear un catálogo: «De los contactos de WhatsApp», solo con WhatsApp. */
export function useCatalogSources(): readonly FormCatalogSource[] {
  const { hasFeature } = usePermissions();
  return hasFeature(contactsChannelFeature) ? sources : sources.filter((source) => source !== "Contacts");
}
