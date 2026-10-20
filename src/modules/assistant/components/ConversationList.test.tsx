import { useQueryClient } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useLayoutEffect, useMemo } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import type { AssistantConversationSummaryResponse } from "@/modules/assistant/api/types";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import type { AssistantScope } from "../api/assistant";
import { AssistantLifetime } from "../runtime/assistantLifetime";
import { ConversationList } from "./ConversationList";

const scope: AssistantScope = { access: "business", userId: "person", tenantId: "organization" };
const row = (id: string, title: string): AssistantConversationSummaryResponse => ({ id, title, isSaved: false, version: 1,
  createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" });
function OwnedList({ enabled, onSelect, onOwner }: { enabled: boolean; onSelect: (id: string) => void; onOwner?: (lifetime: AssistantLifetime) => void }) {
  const client = useQueryClient();
  const lifetime = useMemo(() => new AssistantLifetime(client, ["test-history-owner"]), [client]);
  useLayoutEffect(() => { lifetime.attach(); onOwner?.(lifetime); return () => lifetime.close(); }, [lifetime, onOwner]);
  return <ConversationList scope={scope} lifetime={lifetime} enabled={enabled} selectedId={null} retentionDays={30}
    onSelect={onSelect} onNew={() => {}} actions={() => []} onRetentionInfo={() => {}} />;
}
beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); });

it("el SDK conserva selección y carga la tanda siguiente con el cursor opaco del grupo", async () => {
  const requests: Array<{ saved: string | null; cursor: string | null }> = [];
  const cursor = "opaque /+?=";
  server.use(http.get("/api/organization/assistant/conversations", ({ request }) => {
    const params = new URL(request.url).searchParams; const sent = { saved: params.get("saved"), cursor: params.get("cursor") }; requests.push(sent);
    if (sent.saved === "true") return HttpResponse.json({ items: [], hasMore: false });
    return HttpResponse.json(sent.cursor ? { items: [row("older", "Consulta anterior")], hasMore: false }
      : { items: [row("newer", "Consulta reciente")], hasMore: true, nextCursor: cursor });
  }));
  const onSelect = vi.fn();
  renderWithProviders(<MemoryRouter><OwnedList enabled onSelect={onSelect} /></MemoryRouter>);
  await userEvent.click(await screen.findByRole("button", { name: "Consulta reciente" }));
  expect(onSelect).toHaveBeenCalledWith("newer");
  await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
  expect(await screen.findByRole("button", { name: "Consulta anterior" })).toBeVisible();
  expect(requests).toContainEqual({ saved: "false", cursor });
  expect(requests.filter((request) => request.saved === "true")).toEqual([{ saved: "true", cursor: null }]);
  expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
});
it("deshabilitado no consulta el historial", async () => {
  let requests = 0;
  server.use(http.get("/api/organization/assistant/conversations", () => { requests++; return HttpResponse.json({ items: [], hasMore: false }); }));
  renderWithProviders(<MemoryRouter><OwnedList enabled={false} onSelect={() => {}} /></MemoryRouter>);
  const create = await screen.findByRole("button", { name: "Nueva conversación" });
  expect(create).toBeVisible();
  // «Criterio · Botones»: el único ícono es el «+» de crear, delante del texto.
  expect(create.querySelector("svg.lucide-plus")).not.toBeNull();
  expect(requests).toBe(0);
});
it("cerrar el dueño cancela la lectura y una respuesta tardía no publica metadatos", async () => {
  let release!: () => void; let requests = 0;
  const held = new Promise<void>((resolve) => { release = resolve; });
  server.use(http.get("/api/organization/assistant/conversations", async () => {
    requests++; await held; return HttpResponse.json({ items: [row("late", "Título privado tardío")], hasMore: false });
  }));
  let owner: AssistantLifetime | undefined;
  const onOwner = (lifetime: AssistantLifetime) => { owner = lifetime; };
  const app = renderWithProviders(<MemoryRouter><OwnedList enabled onSelect={() => {}} onOwner={onOwner} /></MemoryRouter>);
  await waitFor(() => expect(requests).toBe(2));
  await act(async () => { owner!.close(); release(); });
  await waitFor(() => expect(app.queryClient.isFetching()).toBe(0));
  expect(screen.queryByRole("button", { name: "Título privado tardío" })).not.toBeInTheDocument();
  expect(JSON.stringify(app.queryClient.getQueryCache().getAll().map((query) => query.state.data))).not.toContain("Título privado tardío");
});
