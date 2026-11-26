import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import type { AssistantProposalResponse } from "@/shared/api/types";
import { AssistantProposalDialog } from "@/shared/assistant-actions";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

const proposalPath = "/api/organization/assistant/proposals/p-1";
const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
const role = (id: string, name: string, scope: "Organization" | "AnyCompany", grantable = true) => ({
  id, name, isSystemRole: false, scope, companyId: null, description: null, userCount: 0, permissions: [], version: 1,
  createdAtUtc: "2026-09-27T12:00:00Z", grantable,
});
const company = (id: string, name: string) => ({
  id, name, taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active" as const, memberCount: 1, version: 3, createdAtUtc: "2026-09-27T12:00:00Z",
});

// Usuarios-Invitar-Propuesta: el correo, un rol de la organización con duda que no está en la página cargada, una
// empresa (tampoco cargada) y un rol en ella, todos con el nombre que trae la propuesta.
function proposal(overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse {
  return {
    id: "p-1", conversationId: "c-1", kind: "action", action: "users.invite", version: 1, state: "new",
    values: [
      { field: "email", value: "ana.lopez@delta.ejemplo.com" },
      { field: "roles", value: { op: "add", id: "role-sales" }, label: "Ventas", doubt: "Assistant.Action.Doubt.Similar" },
      { field: "company", value: "company-delta", label: "Delta S.A." },
      { field: "companyRoles", value: { op: "add", id: "role-readonly" }, label: "Solo lectura" },
    ],
    ...overrides,
  };
}

interface Sent { readonly key: string | null; readonly body: unknown }

function api(read: () => AssistantProposalResponse, writes: { invitations: Sent[]; attempts: number; applied: unknown[] }) {
  server.use(
    http.get(proposalPath, () => HttpResponse.json(read())),
    http.post(`${proposalPath}/attempts`, () => { writes.attempts += 1; return HttpResponse.json({ idempotencyKey: "key-of-the-proposal" }); }),
    http.post(`${proposalPath}/applied`, async ({ request }) => { writes.applied.push(await request.json()); return HttpResponse.json({ ...read(), state: "applied" }); }),
    // Las listas cargadas no traen lo propuesto: los nombres salen de la propuesta.
    http.get("/api/roles/paged", ({ request }) => HttpResponse.json(page(new URL(request.url).searchParams.get("scope") === "Organization"
      ? [role("role-owner", "Dueño", "Organization", false), role("role-support", "Soporte", "Organization")]
      : [role("role-admin", "Administrador", "AnyCompany")]))),
    http.get("/api/companies/paged", () => HttpResponse.json(page([company("company-beta", "Beta S.R.L.")]))),
    http.post("/api/users/invitations", async ({ request }) => {
      writes.invitations.push({ key: request.headers.get("Idempotency-Key"), body: await request.json() });
      return HttpResponse.json({ invitationId: "invitation-1", expiresAtUtc: "2026-10-10T15:00:00Z" }, { status: 201 });
    }),
  );
}

function renderOverHome() {
  return renderWithProviders(<MemoryRouter initialEntries={["/org?proposal=p-1"]}><AssistantProposalDialog /></MemoryRouter>, { as: "business-e6-admin" });
}

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("InviteUserDialog con una propuesta del asistente (Usuarios-Invitar-Propuesta)", () => {
  it("abre sobre el Inicio con todo lo propuesto a la vista y manda lo que se ve, con la clave de la propuesta", async () => {
    const user = userEvent.setup();
    const writes = { invitations: [] as Sent[], attempts: 0, applied: [] as unknown[] };
    api(() => proposal(), writes);
    renderOverHome();

    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    expect(within(dialog).getByText("Propuesta del asistente")).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: /Correo/ })).toHaveValue("ana.lopez@delta.ejemplo.com");
    // Lo propuesto se ve con el nombre de la propuesta aunque no esté en la página cargada de cada lista.
    const roles = within(dialog).getByRole("button", { name: /^Roles de la organización/ });
    expect(roles).toHaveAccessibleName("Roles de la organización Ventas");
    expect(roles).toHaveTextContent("Revisá");
    expect(roles).toHaveAccessibleDescription("Hay más de una opción parecida.");
    expect(within(dialog).getByRole("button", { name: /^Empresa/ })).toHaveAccessibleName("Empresa Delta S.A.");
    expect(within(dialog).getByRole("button", { name: /^Roles en la empresa/ })).toHaveAccessibleName("Roles en la empresa Solo lectura");
    expect(within(dialog).getByText("Se le manda la invitación por correo.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Invitar" }));

    await waitFor(() => expect(writes.applied).toHaveLength(1));
    expect(writes.attempts).toBe(1);
    expect(writes.invitations).toEqual([{ key: "key-of-the-proposal", body: {
      email: "ana.lopez@delta.ejemplo.com", roleIds: ["role-sales"], companies: [{ companyId: "company-delta", roleIds: ["role-readonly"] }],
    } }]);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Invitar usuario" })).not.toBeInTheDocument());
  });

  it("lo que la persona cambia antes de invitar también es lo que se manda", async () => {
    const user = userEvent.setup();
    const writes = { invitations: [] as Sent[], attempts: 0, applied: [] as unknown[] };
    api(() => proposal(), writes);
    renderOverHome();

    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    const email = within(dialog).getByRole("textbox", { name: /Correo/ });
    await user.clear(email);
    await user.type(email, "ana@delta.ejemplo.com");
    await user.click(within(dialog).getByRole("button", { name: "Invitar" }));

    await waitFor(() => expect(writes.invitations).toHaveLength(1));
    expect(writes.invitations[0].body).toMatchObject({ email: "ana@delta.ejemplo.com", roleIds: ["role-sales"] });
  });

  it("si otra pestaña ya la guardó, dice «Ya se guardó», no invita de nuevo y lleva a Usuarios", async () => {
    const user = userEvent.setup();
    const writes = { invitations: [] as Sent[], attempts: 0, applied: [] as unknown[] };
    api(() => proposal(), writes);
    server.use(http.post(`${proposalPath}/attempts`, () => HttpResponse.json({ status: 409, code: "Assistant.Proposal.AlreadyApplied", title: "Conflicto",
      location: "/api/users/member-9" }, { status: 409 })));
    renderOverHome();

    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    await user.click(within(dialog).getByRole("button", { name: "Invitar" }));

    expect(await within(dialog).findByText("Ya se guardó.")).toBeInTheDocument();
    expect(writes.invitations).toEqual([]);
    expect(within(dialog).queryByRole("button", { name: "Invitar" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Ver en Usuarios" })).toHaveAttribute("href", "/org/usuarios");
    expect(within(dialog).queryByText("Se le manda la invitación por correo.")).not.toBeInTheDocument();
  });

  it("si un valor no entra, es el diálogo de siempre, sin la propuesta", async () => {
    const writes = { invitations: [] as Sent[], attempts: 0, applied: [] as unknown[] };
    // Roles en la empresa sin la empresa: no se puede mostrar.
    api(() => proposal({ values: [{ field: "email", value: "ana@delta.ejemplo.com" }, { field: "companyRoles", value: { op: "add", id: "role-readonly" }, label: "Solo lectura" }] }), writes);
    renderOverHome();

    const dialog = await screen.findByRole("dialog", { name: "Invitar usuario" });
    expect(within(dialog).queryByText("Propuesta del asistente")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: /Correo/ })).toHaveValue("");
    expect(within(dialog).queryByText("Se le manda la invitación por correo.")).not.toBeInTheDocument();
  });
});
