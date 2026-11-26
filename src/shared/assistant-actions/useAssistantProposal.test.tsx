import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { resetHttpClient } from "@/shared/api/httpClient";
import type { AssistantProposalResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import type { AssistantProposalValues } from "./operations";
import { assistantProposalAlreadySaved, useAssistantProposal, type AssistantProposal } from "./useAssistantProposal";

const base = "/api/organization/assistant/proposals/p-1";

function proposal(overrides: Partial<AssistantProposalResponse> = {}): AssistantProposalResponse {
  return {
    id: "p-1", conversationId: "c-1", kind: "action", action: "users.invite", version: 1, state: "new",
    values: [
      { field: "email", value: "ana@example.test" },
      { field: "roles", value: { op: "add", id: "r-1" }, label: "Ventas", doubt: "Assistant.Action.Doubt.Similar" },
    ],
    ...overrides,
  };
}

interface InviteForm { email: string; roleIds: string[]; roleLabels: string[] }
const toInviteForm = (values: AssistantProposalValues): InviteForm | undefined => ({
  email: String(values.fields.email?.value ?? ""),
  roleIds: (values.lists.roles ?? []).map((role) => role.id),
  roleLabels: (values.lists.roles ?? []).map((role) => role.label),
});
const toRoleIds = (values: AssistantProposalValues) => (values.lists.roles ?? []).map((role) => role.id);

function render<TForm>(use: () => AssistantProposal<TForm>, entry = "/org?proposal=p-1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
  </QueryClientProvider>;
  return { ...renderHook(use, { wrapper }), client };
}

function ready<TForm>(state: AssistantProposal<TForm>) {
  if (state.status !== "ready") throw new Error(`La propuesta está ${state.status}.`);
  return state;
}

afterEach(() => resetHttpClient());

describe("useAssistantProposal", () => {
  it("sin ?proposal es la pantalla de siempre y no lee nada", () => {
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm), "/org");
    expect(result.current).toEqual({ status: "none" });
  });

  it("lee la propuesta por id y entrega lo propuesto con su forma, sus nombres y «Revisá»", async () => {
    server.use(http.get(base, () => HttpResponse.json(proposal())));
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const state = ready(result.current);
    expect(state.formValues).toEqual({ email: "ana@example.test", roleIds: ["r-1"], roleLabels: ["Ventas"] });
    expect(state.doubtOf("roles", "r-1")).toBe("Assistant.Action.Doubt.Similar");
    expect(state.doubtOf("email")).toBeUndefined();
  });

  it.each([
    ["de otra acción", proposal({ action: "roles.create" }), "none"],
    ["de otra versión", proposal({ version: 2 }), "none"],
    ["reemplazada", proposal({ state: "replaced" }), "unavailable"],
    ["sin confirmar", proposal({ state: "unconfirmed" }), "unavailable"],
    ["ya no disponible", proposal({ state: "unavailable", unavailableReason: "permission" }), "unavailable"],
    ["ya guardada", proposal({ state: "applied", appliedLocation: "/org/usuarios" }), "applied"],
    ["con un valor que no entra", proposal({ values: [{ field: "email", value: 42 }] }), "rejected"],
  ])("una propuesta %s no se abre como propuesta", async (_case, response, status) => {
    server.use(http.get(base, () => HttpResponse.json(response)));
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe(status));
  });

  it("si la pantalla no puede dibujar un valor, rechaza la propuesta", async () => {
    server.use(http.get(base, () => HttpResponse.json(proposal())));
    const { result } = render(() => useAssistantProposal("users.invite@1", () => undefined));
    await waitFor(() => expect(result.current.status).toBe("rejected"));
  });

  it("si no se puede leer, la pantalla sigue como siempre", async () => {
    server.use(http.get(base, () => HttpResponse.json({ code: "Assistant.Proposal.NotFound" }, { status: 404 })));
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("rejected"));
  });

  it("editar espera lo leído al abrir y aplica las operaciones sobre eso, con «Lo que cambia»", async () => {
    server.use(http.get(base, () => HttpResponse.json(proposal({
      action: "users.edit", target: { id: "m-1", label: "Kevin", version: 7 },
      values: [{ field: "roles", value: { op: "add", id: "r-2" }, label: "Compras" }, { field: "roles", value: { op: "remove", id: "r-1" }, label: "Ventas" }],
    }))));
    const read: AssistantProposalValues = { fields: {}, lists: { roles: [{ id: "r-1", label: "Ventas" }, { id: "r-3", label: "Depósito" }] }, rows: {} };
    let current: AssistantProposalValues | undefined;
    const { result, rerender } = render<string[]>(() => useAssistantProposal("users.edit@1", toRoleIds, current));

    await waitFor(() => expect(result.current.status).toBe("waiting"));
    current = read;
    rerender();
    const state = ready(result.current);
    expect(state.formValues).toEqual(["r-3", "r-2"]);
    expect(state.changes.lists).toEqual([{ field: "roles", added: [{ id: "r-2", label: "Compras" }], removed: [{ id: "r-1", label: "Ventas" }] }]);
  });

  it("crear guarda con la clave de la propuesta y después avisa que se aplicó", async () => {
    const calls: string[] = [];
    server.use(
      http.get(base, () => HttpResponse.json(proposal())),
      http.post(`${base}/attempts`, () => { calls.push("attempts"); return HttpResponse.json({ idempotencyKey: "k-1" }); }),
      http.post(`${base}/applied`, async ({ request }) => {
        calls.push(`applied ${JSON.stringify(await request.json())}`);
        return HttpResponse.json(proposal({ state: "applied", appliedLocation: "/org/usuarios" }));
      }),
    );
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const saved = await act(() => ready(result.current).send(async (key) => { calls.push(`save ${key}`); return { id: "i-1" }; }));
    expect(saved).toEqual({ id: "i-1" });
    expect(calls).toEqual(["attempts", "save k-1", "applied {}"]);
    await waitFor(() => expect(result.current.status).toBe("applied"));
  });

  it("un 422 de una clave que ya se guardó es «Ya se guardó», con el enlace a lo creado", async () => {
    const keys: string[] = [];
    let attempts = 0;
    let reads = 0;
    server.use(
      http.get(base, () => { reads++; return HttpResponse.json(reads === 1 ? proposal() : proposal({ state: "applied", appliedLocation: "/org/usuarios?invitation=i-1" })); }),
      http.post(`${base}/attempts`, () => (++attempts === 1
        ? HttpResponse.json({ idempotencyKey: "k-1" })
        : HttpResponse.json({ code: "Assistant.Proposal.AlreadyApplied", location: "/org/usuarios?invitation=i-1" }, { status: 409 }))),
    );
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const failure = await act(() => ready(result.current).send(async (key) => {
      keys.push(key);
      throw new ApiError(422, { code: "Request.IdempotencyKeyReused" });
    }).catch((error: unknown) => error));

    expect(keys).toEqual(["k-1"]);
    expect(attempts).toBe(2);
    expect(assistantProposalAlreadySaved(failure)).toEqual({ location: "/org/usuarios?invitation=i-1" });
    await waitFor(() => expect(result.current.status).toBe("applied"));
  });

  it("un 422 de una clave que no se guardó es otro intento, con la clave nueva", async () => {
    const keys: string[] = [];
    let attempts = 0;
    let applied = 0;
    server.use(
      http.get(base, () => HttpResponse.json(proposal())),
      http.post(`${base}/attempts`, () => HttpResponse.json({ idempotencyKey: `k-${++attempts}` })),
      http.post(`${base}/applied`, () => { applied++; return HttpResponse.json(proposal({ state: "applied" })); }),
    );
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const saved = await act(() => ready(result.current).send(async (key) => {
      keys.push(key);
      if (key === "k-1") throw new ApiError(422, { code: "Request.IdempotencyKeyReused" });
      return "created";
    }));

    expect(saved).toBe("created");
    expect(keys).toEqual(["k-1", "k-2"]);
    expect(applied).toBe(1);
  });

  it("si otra pestaña está guardando con la misma clave, espera y reintenta con esa clave", async () => {
    const keys: string[] = [];
    let applied = 0;
    server.use(
      http.get(base, () => HttpResponse.json(proposal())),
      http.post(`${base}/attempts`, () => HttpResponse.json({ idempotencyKey: "k-1" })),
      http.post(`${base}/applied`, () => { applied++; return HttpResponse.json(proposal({ state: "applied" })); }),
    );
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const saved = await act(async () => {
        const saving = ready(result.current).send(async (key) => {
          keys.push(key);
          if (keys.length === 1) throw new ApiError(409, { code: "Request.InProgress", retryAfter: 1 });
          return "created";
        });
        await vi.advanceTimersByTimeAsync(1_000);
        return saving;
      });
      expect(saved).toBe("created");
    } finally {
      vi.useRealTimers();
    }
    expect(keys).toEqual(["k-1", "k-1"]);
    expect(applied).toBe(1);
  });

  it("si después del 422 vuelve la misma clave, muestra el 422 de siempre sin repetir", async () => {
    let saves = 0;
    server.use(
      http.get(base, () => HttpResponse.json(proposal())),
      http.post(`${base}/attempts`, () => HttpResponse.json({ idempotencyKey: "k-1" })),
    );
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const failure = await act(() => ready(result.current).send(async () => {
      saves++;
      throw new ApiError(422, { code: "Request.IdempotencyKeyReused" });
    }).catch((error: unknown) => error));

    expect(saves).toBe(1);
    expect(failure).toBeInstanceOf(ApiError);
    expect((failure as ApiError).code).toBe("Request.IdempotencyKeyReused");
    expect(assistantProposalAlreadySaved(failure)).toBeUndefined();
  });

  it("otro error de la ruta es el de siempre, sin preguntar otra vez ni avisar que se aplicó", async () => {
    let attempts = 0;
    let applied = 0;
    server.use(
      http.get(base, () => HttpResponse.json(proposal())),
      http.post(`${base}/attempts`, () => HttpResponse.json({ idempotencyKey: `k-${++attempts}` })),
      http.post(`${base}/applied`, () => { applied++; return HttpResponse.json(proposal()); }),
    );
    const { result } = render(() => useAssistantProposal("users.invite@1", toInviteForm));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    const failure = await act(() => ready(result.current).send(async () => {
      throw new ApiError(422, { code: "Validation.Failed", errors: { email: ["Ya tiene una invitación."] } });
    }).catch((error: unknown) => error));

    expect((failure as ApiError).code).toBe("Validation.Failed");
    expect(attempts).toBe(1);
    expect(applied).toBe(0);
  });

  it("editar avisa que se aplicó con la versión nueva", async () => {
    let body: unknown;
    server.use(
      http.get(base, () => HttpResponse.json(proposal({ action: "users.edit", target: { id: "m-1", label: "Kevin", version: 7 }, values: [] }))),
      http.post(`${base}/applied`, async ({ request }) => { body = await request.json(); return HttpResponse.json(proposal({ action: "users.edit", state: "applied" })); }),
    );
    const read: AssistantProposalValues = { fields: {}, lists: {}, rows: {} };
    const { result } = render<string[]>(() => useAssistantProposal("users.edit@1", toRoleIds, read));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(() => ready(result.current).markApplied(8));
    expect(body).toEqual({ version: 8 });
    await waitFor(() => expect(result.current.status).toBe("applied"));
  });
});
