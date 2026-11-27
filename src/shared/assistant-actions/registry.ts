import { createContext, useContext, type ComponentType } from "react";
import type { AssistantActionKey } from "@/shared/api/generated/assistant-actions";

/** El parámetro con que se abre la pantalla de una acción: solo el id, nunca valores (ADR 0068 §9). */
export const assistantProposalParam = "proposal";

/**
 * Lo que un área presta para una acción del contrato: adónde lleva el botón de la tarjeta y, si se confirma en un diálogo,
 * ese diálogo, que abre sobre el Inicio. La pantalla carga la propuesta con `useAssistantProposal`.
 */
export interface AssistantActionAdapter {
  /** `<id>@<versión>`, como la publica `assistant-actions.json`. */
  readonly action: AssistantActionKey;
  /**
   * La pantalla de la acción, sin la propuesta: la tarjeta le suma `?proposal=<id>` (`withAssistantProposal`). La de editar o
   * quitar, la de su destino. Así un registro solo importa el tipo y no carga nada de esta carpeta al arrancar.
   */
  readonly href: (proposal: { readonly id: string; readonly target?: { readonly id: string } | null }) => string;
  /**
   * Solo si la acción se confirma en un diálogo: el diálogo, que lee la propuesta de la dirección. La tarjeta lo abre donde
   * está, sobre el Inicio (o el asistente del teléfono), con `?proposal=<id>` (`AssistantProposalDialog`), y no usa `href`.
   * Después de guardar, además de lo suyo, espera `onSaved`: lo que vuelve a leer la pantalla de abajo (los conteos del
   * Inicio).
   */
  readonly Dialog?: ComponentType<{ readonly onClose: () => void; readonly onSaved?: () => Promise<unknown> }>;
  /** El enlace de la tarjeta aplicada a lo hecho («Ver el rol»), si se puede ver; sin él, la tarjeta no lleva enlace. */
  readonly appliedHref?: (proposal: { readonly target?: { readonly id: string } | null; readonly appliedLocation?: string | null }) => string | undefined;
  /** Solo al crear: el listado donde se revisa una propuesta «Sin confirmar» («Revisar en Usuarios»). */
  readonly reviewHref?: string;
}

export const assistantActionKey = (action: string, version: number) => `${action}@${version}`;

/** La dirección de una pantalla con la propuesta, conservando lo que ya traía. */
export function withAssistantProposal(path: string, proposalId: string): string {
  const [pathname, search = ""] = path.split("?", 2);
  const params = new URLSearchParams(search);
  params.set(assistantProposalParam, proposalId);
  return `${pathname}?${params.toString()}`;
}

/** El adaptador de una acción. Dos para la misma acción es un error de la composición. */
export function findAssistantActionAdapter(adapters: readonly AssistantActionAdapter[], action: string, version: number): AssistantActionAdapter | undefined {
  const key = assistantActionKey(action, version);
  const found = adapters.filter((adapter) => adapter.action === key);
  if (found.length > 1) throw new Error(`Hay dos adaptadores para ${key}.`);
  return found[0];
}

export const AssistantActionRegistryContext = createContext<readonly AssistantActionAdapter[]>([]);
export const AssistantActionRegistryProvider = AssistantActionRegistryContext.Provider;

export const useAssistantActionAdapters = () => useContext(AssistantActionRegistryContext);

export function useAssistantActionAdapter(action: string, version: number): AssistantActionAdapter | undefined {
  return findAssistantActionAdapter(useAssistantActionAdapters(), action, version);
}
