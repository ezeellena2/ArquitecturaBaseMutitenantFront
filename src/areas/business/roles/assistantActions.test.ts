import { describe, expect, it } from "vitest";
import { findAssistantActionAdapter } from "@/shared/assistant-actions";
import { createdRoleId, rolesAssistantActions } from "./assistantActions";

describe("las acciones de Roles del asistente", () => {
  it("el rol creado sale del Location de POST api/roles, absoluto o relativo", () => {
    expect(createdRoleId("https://grupo-delta.ejemplo.com/api/roles/0b6e6e62-1c2d-4e5f-8a9b-0c1d2e3f4a5b")).toBe("0b6e6e62-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
    expect(createdRoleId("/api/roles/role-created?x=1")).toBe("role-created");
    expect(createdRoleId("/api/users/member-1")).toBeUndefined();
    expect(createdRoleId(null)).toBeUndefined();
  });

  it("crear y cambiar abren el editor; dar de baja, la lista; la aplicada lleva al rol si se puede ver", () => {
    const create = findAssistantActionAdapter(rolesAssistantActions, "roles.create", 1)!;
    const edit = findAssistantActionAdapter(rolesAssistantActions, "roles.edit", 1)!;
    const remove = findAssistantActionAdapter(rolesAssistantActions, "roles.remove", 1)!;
    expect(create.href({ id: "p-1" })).toBe("/org/roles/nuevo?proposal=p-1");
    expect(create.appliedHref?.({ appliedLocation: "/api/roles/role-created" })).toBe("/org/roles/role-created");
    expect(create.appliedHref?.({ appliedLocation: null })).toBeUndefined();
    expect(create.reviewHref).toBe("/org/roles");
    expect(edit.href({ id: "p-1", target: { id: "role-custom" } })).toBe("/org/roles/role-custom?proposal=p-1");
    expect(edit.appliedHref?.({ target: { id: "role-custom" } })).toBe("/org/roles/role-custom");
    expect(remove.href({ id: "p-1", target: { id: "role-custom" } })).toBe("/org/roles?proposal=p-1");
    expect(remove.appliedHref).toBeUndefined();
  });
});
