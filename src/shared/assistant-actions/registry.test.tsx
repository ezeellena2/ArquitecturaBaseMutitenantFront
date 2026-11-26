import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  AssistantActionRegistryProvider, findAssistantActionAdapter, useAssistantActionAdapter, withAssistantProposal, type AssistantActionAdapter,
} from "./registry";

const invite: AssistantActionAdapter = { action: "users.invite@1", href: (proposal) => withAssistantProposal("/org", proposal.id) };
const editUser: AssistantActionAdapter = { action: "users.edit@1", href: (proposal) => withAssistantProposal(`/org/usuarios/${proposal.target!.id}`, proposal.id) };

describe("el registro de adaptadores", () => {
  it("cada acción encuentra su adaptador por id y versión, y otra versión no tiene", () => {
    expect(findAssistantActionAdapter([invite, editUser], "users.edit", 1)).toBe(editUser);
    expect(findAssistantActionAdapter([invite, editUser], "users.edit", 2)).toBeUndefined();
  });

  it("dos adaptadores para la misma acción son un error de la composición", () => {
    expect(() => findAssistantActionAdapter([invite, { ...invite }], "users.invite", 1)).toThrow(/users\.invite@1/);
  });

  it("la dirección lleva solo el id de la propuesta y conserva lo que ya traía", () => {
    expect(invite.href({ id: "p 1" })).toBe("/org?proposal=p+1");
    expect(editUser.href({ id: "p-2", target: { id: "m-1" } })).toBe("/org/usuarios/m-1?proposal=p-2");
    expect(withAssistantProposal("/org/roles?tab=company&proposal=old", "p-3")).toBe("/org/roles?tab=company&proposal=p-3");
  });

  it("el módulo lee los adaptadores que compuso la app", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <AssistantActionRegistryProvider value={[invite, editUser]}>{children}</AssistantActionRegistryProvider>;
    const { result } = renderHook(() => useAssistantActionAdapter("users.invite", 1), { wrapper });
    expect(result.current).toBe(invite);
  });
});
