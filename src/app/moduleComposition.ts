import type { ModuleRegistration } from "@/shared/modules/types";
import { assistantRegistration } from "@/modules/assistant/registration";
import { whatsappRegistration } from "@/modules/whatsapp/registration";

/** Único punto concreto: quitar un módulo requiere quitar su import y su entrada. El orden es el de Administración y Más. */
export const moduleComposition: readonly ModuleRegistration[] = [whatsappRegistration, assistantRegistration];
