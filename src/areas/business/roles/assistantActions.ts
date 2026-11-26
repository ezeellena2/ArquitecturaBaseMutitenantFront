import { withAssistantProposal, type AssistantActionAdapter } from "@/shared/assistant-actions";

const rolesPath = "/org/roles";
const rolePath = (roleId: string) => `${rolesPath}/${encodeURIComponent(roleId)}`;

/** El id del rol que creó `POST api/roles`, de su `Location` (`…/api/roles/{id}`), que la propuesta guarda al aplicarse. */
export function createdRoleId(location: string | null | undefined): string | undefined {
  const match = location ? /\/api\/roles\/([^/?#]+)/.exec(location) : null;
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Adónde lleva lo creado: el rol nuevo, o la lista si no se sabe cuál es. */
export function createdRolePath(location: string | null | undefined): string {
  const id = createdRoleId(location);
  return id ? rolePath(id) : rolesPath;
}

/**
 * Las acciones de Roles que propone el asistente (ADR 0068), cada una con la pantalla de siempre: crear y cambiar, en el
 * editor de roles (`RoleEditorPage`), con lo propuesto cargado y sin guardar; dar de baja, en la confirmación de la lista
 * (`RolesPage`), que con `?proposal=<id>` abre sobre el rol que nombra.
 */
export const rolesAssistantActions: readonly AssistantActionAdapter[] = [
  {
    action: "roles.create@1",
    href: (proposal) => withAssistantProposal(`${rolesPath}/nuevo`, proposal.id),
    // «Ver el rol»: el que creó el guardado; una «Sin confirmar» se revisa en la lista.
    appliedHref: (proposal) => {
      const id = createdRoleId(proposal.appliedLocation);
      return id ? rolePath(id) : undefined;
    },
    reviewHref: rolesPath,
  },
  {
    action: "roles.edit@1",
    href: (proposal) => withAssistantProposal(proposal.target ? rolePath(proposal.target.id) : rolesPath, proposal.id),
    appliedHref: (proposal) => (proposal.target ? rolePath(proposal.target.id) : undefined),
  },
  {
    // Dado de baja, el rol ya no se ve: la tarjeta aplicada va sin enlace.
    action: "roles.remove@1",
    href: (proposal) => withAssistantProposal(rolesPath, proposal.id),
  },
];
