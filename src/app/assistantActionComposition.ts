import type { AssistantActionAdapter } from "@/shared/assistant-actions";
import { rolesAssistantActions } from "@/areas/business/roles/assistantActions";
import { usersAssistantActions } from "@/areas/business/users/assistantActions";

/**
 * Los adaptadores de las acciones del asistente (ADR 0068): cada área presta el de las acciones que se confirman en sus
 * pantallas, y la tarjeta del hilo los lee por `shared/assistant-actions`, sin importar áreas. Un adaptador por acción
 * del contrato (F5 lo vigila).
 */
export const assistantActionComposition: readonly AssistantActionAdapter[] = [...usersAssistantActions, ...rolesAssistantActions];
