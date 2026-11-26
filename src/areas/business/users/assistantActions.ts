import { withAssistantProposal, type AssistantActionAdapter } from "@/shared/assistant-actions";
import { InviteUserProposalDialog } from "./components/InviteUserDialog";

const usersPath = "/org/usuarios";
const memberPath = (target: { readonly id: string } | null | undefined) => (target ? `${usersPath}/${encodeURIComponent(target.id)}` : usersPath);

/**
 * Las acciones de Usuarios que propone el asistente (ADR 0068), cada una con la pantalla de siempre: invitar, en el
 * diálogo «Invitar usuario» sobre el Inicio; cambiar roles y quitar, en la ficha de la persona (`UserDetailPage`), que con
 * `?proposal=<id>` abre «Lo que cambia» o la confirmación de quitar.
 */
export const usersAssistantActions: readonly AssistantActionAdapter[] = [
  {
    action: "users.invite@1",
    href: (proposal) => withAssistantProposal("/org", proposal.id),
    Dialog: InviteUserProposalDialog,
    // La invitación se ve en la lista («Ver en Usuarios»), y ahí se revisa una «Sin confirmar».
    appliedHref: () => usersPath,
    reviewHref: usersPath,
  },
  {
    action: "users.edit@1",
    href: (proposal) => withAssistantProposal(memberPath(proposal.target), proposal.id),
    appliedHref: (proposal) => (proposal.target ? memberPath(proposal.target) : undefined),
  },
  {
    // Quitada, la persona ya no tiene ficha: la tarjeta aplicada va sin enlace.
    action: "users.remove@1",
    href: (proposal) => withAssistantProposal(memberPath(proposal.target), proposal.id),
  },
];
