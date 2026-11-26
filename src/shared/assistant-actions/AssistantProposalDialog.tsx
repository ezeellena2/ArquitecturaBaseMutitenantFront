import { useState } from "react";
import { useSearchParams } from "react-router";
import { assistantProposalParam, findAssistantActionAdapter, useAssistantActionAdapters } from "./registry";
import { useAssistantProposalQuery } from "./useAssistantProposal";
import { useDropAssistantProposal } from "./useAssistantProposalLifecycle";

/**
 * El diálogo de la propuesta de `?proposal=<id>`, sobre la pantalla donde está la tarjeta: el Inicio, o el asistente del
 * teléfono. Solo si la acción se confirma en un diálogo; el diálogo lee la propuesta de la dirección. Cerrarlo saca el
 * parámetro y deja la pantalla como estaba; `onSaved` es lo que la pantalla de abajo vuelve a leer después de guardar (el
 * Inicio, sus conteos).
 *
 * Abre como el botón de la tarjeta: solo si la lectura de ahora (con los permisos de ahora, no la que ya estaba) dice que
 * la propuesta es nueva. Sin permiso, reemplazada, ya no disponible, sin confirmar o ya guardada no abre, y la tarjeta dice
 * por qué. Abierto, sigue hasta que se cierra: si otra pestaña la guarda, el diálogo dice «Ya se guardó».
 */
export function AssistantProposalDialog({ onSaved }: { readonly onSaved?: () => Promise<unknown> }) {
  const [params] = useSearchParams();
  const proposalId = params.get(assistantProposalParam);
  const { data, isFetching } = useAssistantProposalQuery(proposalId);
  const adapters = useAssistantActionAdapters();
  const close = useDropAssistantProposal();
  const Dialog = data?.kind === "action" ? findAssistantActionAdapter(adapters, data.action, data.version)?.Dialog : undefined;
  const [opened, setOpened] = useState<string | null>(null);
  if (proposalId === null && opened !== null) setOpened(null);
  else if (proposalId !== null && opened !== proposalId && Dialog && data?.state === "new" && !isFetching) setOpened(proposalId);
  if (!proposalId || opened !== proposalId || !Dialog) return null;
  return <Dialog key={proposalId} onClose={close} onSaved={onSaved} />;
}
