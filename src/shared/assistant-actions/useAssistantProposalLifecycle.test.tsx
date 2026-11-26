import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { useAssistantProposalConfirmation, useDropAssistantProposal, useLoadAssistantProposalOnce } from "./useAssistantProposalLifecycle";

function withRouter(entry: string) {
  return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
}

function useWhere() {
  const location = useLocation();
  return { url: `${location.pathname}${location.search}`, navigation: useNavigationType() };
}

describe("useDropAssistantProposal", () => {
  it("saca ?proposal y conserva lo demás de la dirección, sin sumar al historial", () => {
    const { result } = renderHook(() => ({ drop: useDropAssistantProposal(), ...useWhere() }), { wrapper: withRouter("/org/roles?companyId=c-1&proposal=p-1") });

    act(() => result.current.drop());

    expect(result.current.url).toBe("/org/roles?companyId=c-1");
    expect(result.current.navigation).toBe("REPLACE");
  });

  it("sin ?proposal no navega", () => {
    const { result } = renderHook(() => ({ drop: useDropAssistantProposal(), ...useWhere() }), { wrapper: withRouter("/org/roles?companyId=c-1") });

    act(() => result.current.drop());

    expect(result.current.url).toBe("/org/roles?companyId=c-1");
    expect(result.current.navigation).toBe("POP");
  });
});

describe("useLoadAssistantProposalOnce", () => {
  it("carga cada propuesta una sola vez, aunque se vuelva a leer, y dice cuál entró", () => {
    const load = vi.fn();
    const { result, rerender } = renderHook(({ ready }: { ready?: { proposalId: string; name: string } }) => useLoadAssistantProposalOnce(ready, load),
      { initialProps: { ready: undefined } as { ready?: { proposalId: string; name: string } } });
    expect(load).not.toHaveBeenCalled();

    rerender({ ready: { proposalId: "p-1", name: "Ventas" } });
    // Otra lectura de la misma propuesta (otro objeto) no pisa lo que la persona cambió después.
    rerender({ ready: { proposalId: "p-1", name: "Ventas y caja" } });
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith({ proposalId: "p-1", name: "Ventas" });
    expect(result.current("p-1")).toBe(true);
    expect(result.current("p-2")).toBe(false);

    rerender({ ready: { proposalId: "p-2", name: "Caja" } });
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current("p-2")).toBe(true);
  });
});

describe("useAssistantProposalConfirmation", () => {
  it("abre con la propuesta lista; cerrarla saca ?proposal y no la vuelve a abrir, pero otra propuesta sí", () => {
    const { result, rerender } = renderHook(({ ready }: { ready?: { proposalId: string } }) => ({ confirmation: useAssistantProposalConfirmation(ready), ...useWhere() }),
      { wrapper: withRouter("/org/roles?proposal=p-1"), initialProps: { ready: { proposalId: "p-1" } } });
    expect(result.current.confirmation.open).toEqual({ proposalId: "p-1" });

    act(() => result.current.confirmation.close("p-1"));
    // La misma propuesta, todavía lista (la dirección cambia después, o se vuelve a leer), queda cerrada.
    rerender({ ready: { proposalId: "p-1" } });
    expect(result.current.confirmation.open).toBeUndefined();
    expect(result.current.url).toBe("/org/roles");

    rerender({ ready: { proposalId: "p-2" } });
    expect(result.current.confirmation.open).toEqual({ proposalId: "p-2" });
  });
});
