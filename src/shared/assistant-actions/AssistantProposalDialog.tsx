import { useSearchParams } from "react-router";
import { assistantProposalParam, findAssistantActionAdapter, useAssistantActionAdapters } from "./registry";
import { useAssistantProposalQuery } from "./useAssistantProposal";

/**
 * El diálogo de la propuesta de `?proposal=<id>`, sobre la pantalla donde está la tarjeta: el Inicio, o el asistente del
 * teléfono. Solo si la acción se confirma en un diálogo; el diálogo lee la propuesta de la dirección. Cerrarlo saca el
 * parámetro y deja la pantalla como estaba.
 */
export function AssistantProposalDialog() {
  const [params, setParams] = useSearchParams();
  const proposalId = params.get(assistantProposalParam);
  const { data } = useAssistantProposalQuery(proposalId);
  const adapters = useAssistantActionAdapters();
  const Dialog = data?.kind === "action" ? findAssistantActionAdapter(adapters, data.action, data.version)?.Dialog : undefined;
  if (!proposalId || !Dialog) return null;
  const close = () => setParams((current) => {
    const next = new URLSearchParams(current);
    next.delete(assistantProposalParam);
    return next;
  }, { replace: true });
  return <Dialog key={proposalId} onClose={close} />;
}
