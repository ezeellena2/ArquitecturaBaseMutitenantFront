import type { ModuleRegistration } from "@/shared/modules/types";
import { assistantRegistration } from "@/modules/assistant/registration";

/** Único punto concreto: quitar un módulo requiere quitar su import y su entrada. */
export const moduleComposition: readonly ModuleRegistration[] = [assistantRegistration];
