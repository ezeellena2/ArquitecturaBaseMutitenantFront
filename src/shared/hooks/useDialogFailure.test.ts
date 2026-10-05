import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { useDialogFailure } from "./useDialogFailure";

const queryRoot = ["accounts"] as const;
const stateCodes = ["Users.User.InvalidTransition", "Legal.AccountDeletion.AlreadyPending"];
function setup() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const onClose = vi.fn();
  const view = renderHook(() => useDialogFailure(onClose, queryRoot, stateCodes), {
    wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children),
  });
  return { ...view, invalidate, onClose };
}

describe("useDialogFailure (E5)", () => {
  it.each(["General.ConcurrencyConflict", ...stateCodes])("%s invalida la raíz indicada al cerrar, también después de clear", (code) => {
    const { result, invalidate, onClose } = setup();
    const error = new ApiError(409, { code });
    act(() => result.current.fail(error));
    expect(result.current.failure).toBe(error);
    expect(invalidate).not.toHaveBeenCalled();
    act(() => result.current.clear());
    expect(result.current.failure).toBeUndefined();
    act(() => result.current.close());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryRoot });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each([new ApiError(409, { code: "Other.Conflict" }), new ApiError(422, { code: stateCodes[0] }), ApiError.network(), new Error("bug")])("no relee por un error que no declara un cambio de estado (%s)", (error) => {
    const { result, invalidate, onClose } = setup();
    act(() => result.current.fail(error));
    expect(result.current.failure).toBe(error);
    act(() => result.current.close());
    expect(invalidate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
