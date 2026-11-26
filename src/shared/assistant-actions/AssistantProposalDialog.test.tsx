import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetHttpClient } from "@/shared/api/httpClient";
import type { AssistantProposalResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { assistantProposalQueryKey } from "./api";
import { AssistantProposalDialog } from "./AssistantProposalDialog";
import { AssistantActionRegistryProvider, type AssistantActionAdapter } from "./registry";

const proposalPath = "/api/organization/assistant/proposals/p-1";

const invite = (overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse => ({
  id: "p-1", conversationId: "c-1", kind: "action", action: "users.invite", version: 1, state: "new",
  values: [{ field: "email", value: "ana@example.test" }],
  ...overrides,
});

// El diálogo de un área: «Invitar» guarda y avisa a la pantalla de abajo; «Cerrar» lo cierra.
function FakeDialog({ onClose, onSaved }: { onClose: () => void; onSaved?: () => Promise<unknown> }) {
  return <div role="dialog" aria-label="Invitar usuario">
    <button type="button" onClick={() => { void onSaved?.(); onClose(); }}>{"Invitar"}</button>
    <button type="button" onClick={onClose}>{"Cerrar"}</button>
  </div>;
}

const adapters: AssistantActionAdapter[] = [{ action: "users.invite@1", href: () => "/org", Dialog: FakeDialog }];

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

function mount(options: { cached?: AssistantProposalResponse; onSaved?: () => Promise<unknown> } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (options.cached) client.setQueryData(assistantProposalQueryKey("p-1"), options.cached);
  render(<QueryClientProvider client={client}>
    <AssistantActionRegistryProvider value={adapters}>
      <MemoryRouter initialEntries={["/org?proposal=p-1"]}><AssistantProposalDialog onSaved={options.onSaved} /><Where /></MemoryRouter>
    </AssistantActionRegistryProvider>
  </QueryClientProvider>);
  return client;
}

afterEach(() => resetHttpClient());

describe("AssistantProposalDialog", () => {
  it("abre el diálogo de la acción con la propuesta nueva; después de guardar avisa a la pantalla de abajo y cerrarlo saca ?proposal", async () => {
    const user = userEvent.setup();
    server.use(http.get(proposalPath, () => HttpResponse.json(invite())));
    const onSaved = vi.fn(async () => undefined);
    mount({ onSaved });

    await user.click(await screen.findByRole("button", { name: "Invitar" }));

    expect(onSaved).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/org$/);
  });

  it.each([
    ["sin permiso", invite({ state: "unavailable", unavailableReason: "permission" })],
    ["ya no disponible", invite({ state: "unavailable", unavailableReason: "target" })],
    ["reemplazada", invite({ state: "replaced" })],
    ["sin confirmar", invite({ state: "unconfirmed" })],
    ["ya guardada", invite({ state: "applied" })],
  ])("con la propuesta %s no abre el diálogo, como la tarjeta no ofrece el botón", async (_name, read) => {
    let reads = 0;
    server.use(http.get(proposalPath, () => { reads += 1; return HttpResponse.json(read); }));
    mount();

    await waitFor(() => expect(reads).toBe(1));
    // Una vuelta más para que la lectura llegue a la pantalla.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("vuelve a preguntar al abrir: con la lectura vieja «nueva» y la de ahora sin permiso, no abre", async () => {
    let reads = 0;
    server.use(http.get(proposalPath, () => { reads += 1; return HttpResponse.json(invite({ state: "unavailable", unavailableReason: "permission" })); }));
    const client = mount({ cached: invite() });

    await waitFor(() => expect(reads).toBe(1));
    await waitFor(() => expect(client.getQueryData<AssistantProposalResponse>(assistantProposalQueryKey("p-1"))?.state).toBe("unavailable"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abierto, sigue abierto si otra pestaña la guarda: el diálogo dice «Ya se guardó»", async () => {
    let state: AssistantProposalResponse["state"] = "new";
    server.use(http.get(proposalPath, () => HttpResponse.json(invite({ state }))));
    const client = mount();
    expect(await screen.findByRole("dialog", { name: "Invitar usuario" })).toBeInTheDocument();

    state = "applied";
    await act(async () => { await client.invalidateQueries({ queryKey: assistantProposalQueryKey("p-1") }); });

    expect(client.getQueryData<AssistantProposalResponse>(assistantProposalQueryKey("p-1"))?.state).toBe("applied");
    expect(screen.getByRole("dialog", { name: "Invitar usuario" })).toBeInTheDocument();
  });
});
