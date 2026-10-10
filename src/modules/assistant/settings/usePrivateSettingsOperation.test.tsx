import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { createQueryClient } from "@/shared/api/queryClient";
import { toastError } from "@/shared/ui/sonner";
import { businessManager } from "./settingsTestSupport";
import { usePrivateSettingsOperation } from "./usePrivateSettingsOperation";

vi.mock("@/shared/ui/sonner", () => ({ toastError: vi.fn(), toastErrorWithCode: vi.fn() }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

it.each([false, true])("agotamiento avisa una vez y Retry conserva el original o respeta abandono=%s", async (abandoned) => {
  vi.useFakeTimers();
  const client = createQueryClient(); client.setQueryData(currentUserQueryKey, businessManager);
  const owner = new AbortController();
  const failure = vi.fn(); const success = vi.fn(); const wire: Array<{ body: { apiKey: string; version: number }; key: string }> = [];
  let finished = false;
  const hook = renderHook(() => usePrivateSettingsOperation({
    scope: { access: "business", tenantId: businessManager.activeTenantId ?? null, userId: businessManager.id },
    cancellationSignal: owner.signal, queryRoot: ["owned"], allowed: () => true,
    execute: async (body: { apiKey: string; version: number }, key) => {
      wire.push({ body: structuredClone(body), key });
      if (!finished) throw new ApiError(409, { code: "Request.InProgress", detail: "La solicitud sigue en curso.", retryAfter: 1 });
      return { version: 11 };
    }, success, failure,
  }), { wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children) });
  await act(async () => { hook.result.current.submit({ apiKey: "private-exhaustion-key", version: 10 }); await vi.advanceTimersByTimeAsync(1000); });
  expect(wire).toHaveLength(2); expect(hook.result.current.pending).toBe(true);
  expect(toastError).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
  const mutation = client.getMutationCache().getAll()[0];
  expect(wire).toHaveLength(31); expect(mutation.state.status).toBe("error"); expect(hook.result.current.pending).toBe(false);
  expect(JSON.stringify({ queries: client.getQueryCache().getAll().map((query) => query.state), state: mutation.state, meta: mutation.meta })).not.toContain("private-exhaustion-key");
  expect(wire.every((row) => JSON.stringify(row) === JSON.stringify(wire[0]))).toBe(true);
  expect(toastError).toHaveBeenCalledTimes(1);
  expect(vi.mocked(toastError).mock.calls[0][0]).toBe("La solicitud sigue en curso.");
  const action = vi.mocked(toastError).mock.calls[0][1]?.action;
  expect(action).toMatchObject({ label: "Reintentar" });
  if (abandoned) act(() => owner.abort());
  finished = true;
  await act(async () => { if (action && typeof action === "object" && "onClick" in action) action.onClick({} as never); await vi.advanceTimersByTimeAsync(0); });
  expect(wire).toHaveLength(abandoned ? 31 : 32);
  if (!abandoned) { expect(wire[31]).toEqual(wire[0]); expect(success).toHaveBeenCalledOnce(); }
  else expect(success).not.toHaveBeenCalled();
  hook.unmount(); client.clear();
});
