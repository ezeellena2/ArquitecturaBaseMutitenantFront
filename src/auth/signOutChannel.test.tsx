import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { beginSignOut, cancelSignOut, useIsSigningOut } from "./signOutStatus";
import { useSignOut, useSignOutFromOtherTabs } from "./useSignOut";

const channelName = "arquitecturabasemt.sign-out";

/// Un BroadcastChannel como el del navegador: entrega en otra tarea a los canales del mismo nombre abiertos al momento de
/// mandar, nunca al que manda, y no guarda nada para los que se abren después.
class FakeBroadcastChannel {
  static readonly open = new Set<FakeBroadcastChannel>();
  static readonly posted: unknown[] = [];
  readonly name: string;
  readonly received: unknown[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.open.add(this);
  }

  postMessage(data: unknown): void {
    if (!FakeBroadcastChannel.open.has(this)) throw new DOMException("The channel is closed.", "InvalidStateError");
    FakeBroadcastChannel.posted.push(data);
    for (const target of FakeBroadcastChannel.open) {
      if (target === this || target.name !== this.name) continue;
      setTimeout(() => {
        if (!FakeBroadcastChannel.open.has(target)) return;
        target.received.push(data);
        target.onmessage?.(new MessageEvent("message", { data }));
      });
    }
  }

  close(): void {
    FakeBroadcastChannel.open.delete(this);
  }
}

/// Lo que haría otra pestaña del mismo navegador con su propio canal.
function openOtherTab(): FakeBroadcastChannel {
  return new FakeBroadcastChannel(channelName);
}

/// Deja correr las entregas pendientes del canal, que salen en otra tarea.
async function deliverPendingMessages(): Promise<void> {
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
}

type Session = Partial<Pick<AuthContextProps, "user" | "isLoading" | "activeNavigator" | "signoutRedirect" | "removeUser">>;

function sessionOf(access: string | undefined, changes: Session = {}): AuthContextProps {
  return {
    isAuthenticated: access !== undefined,
    isLoading: false,
    user: access === undefined ? undefined : { access_token: `token-${access}`, profile: { sub: "ana", access } },
    signoutRedirect: vi.fn(() => new Promise<void>(() => {})),
    removeUser: vi.fn(async () => {}),
    ...changes,
  } as unknown as AuthContextProps;
}

/// Una pestaña de la app: la sesión en memoria, su caché, lo que escucha de las otras y su Salir.
function renderTab(initial: AuthContextProps, access?: "consumer" | "business" | "platform") {
  const client = new QueryClient();
  client.setQueryData(["current-user"], { id: "ana" });
  const leave = vi.fn();
  let auth = initial;
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}><AuthContext.Provider value={auth}>{children}</AuthContext.Provider></QueryClientProvider>;
  }
  const hook = renderHook(() => {
    useSignOutFromOtherTabs(leave);
    return { signOut: useSignOut(access), signingOut: useIsSigningOut() };
  }, { wrapper: Wrapper });
  return {
    ...hook, client, leave,
    /// La sesión cambia como la publica react-oidc-context: un objeto nuevo.
    setSession(next: AuthContextProps) { auth = next; hook.rerender(); },
  };
}

beforeEach(() => vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel));

afterEach(() => {
  cancelSignOut();
  FakeBroadcastChannel.open.clear();
  FakeBroadcastChannel.posted.length = 0;
  vi.unstubAllGlobals();
});

describe("Salir avisa a las demás pestañas de su lado (N12)", () => {
  it.each([
    { name: "una persona", session: "consumer", access: undefined, side: "public" },
    { name: "una empresa", session: "business", access: undefined, side: "public" },
    { name: "un operador", session: "platform", access: undefined, side: "platform" },
    // PlatformAccessResult: el operador probó una puerta pública y sale de esa, nunca de Plataforma.
    { name: "la puerta pública con la sesión de Plataforma en memoria", session: "platform", access: "consumer", side: "public" },
    { name: "sin sesión en memoria", session: undefined, access: undefined, side: "public" },
  ] as const)("$name avisa que cerró el lado $side, antes de ir al servidor de ingreso", async ({ session, access, side }) => {
    const order: string[] = [];
    const signoutRedirect = vi.fn(() => { order.push(`redirect after ${FakeBroadcastChannel.posted.length} notice`); return new Promise<void>(() => {}); });
    const tab = renderTab(sessionOf(session, { signoutRedirect }), access);
    const other = openOtherTab();

    act(() => { void tab.result.current.signOut(); });
    await deliverPendingMessages();

    expect(other.received).toEqual([{ type: "signed-out", side }]);
    expect(order).toEqual(["redirect after 1 notice"]);
    // La pestaña que sale no se escucha: sigue con su propio cierre.
    expect(tab.leave).not.toHaveBeenCalled();
  });
});

describe("otra pestaña que salió cierra esta (N12)", () => {
  it.each([
    { session: "consumer", side: "public" },
    { session: "business", side: "public" },
    { session: "platform", side: "platform" },
  ] as const)("una sesión $session cierra con el aviso del lado $side", async ({ session, side }) => {
    const tab = renderTab(sessionOf(session));

    openOtherTab().postMessage({ type: "signed-out", side });
    await deliverPendingMessages();

    expect(tab.leave).toHaveBeenCalledOnce();
    expect(tab.result.current.signingOut).toBe(true);
    expect(tab.client.getQueryData(["current-user"])).toBeUndefined();
    // No vuelve a avisar ni va al servidor de ingreso, que ya cerró ese lado.
    expect(FakeBroadcastChannel.posted).toHaveLength(1);
    expect(tab.result.current.signOut).toBeDefined();
  });

  it.each([
    { session: "platform", side: "public" },
    { session: "consumer", side: "platform" },
    { session: "business", side: "platform" },
  ] as const)("nunca cierra las dos: una sesión $session sigue con el aviso del lado $side", async ({ session, side }) => {
    const tab = renderTab(sessionOf(session));

    openOtherTab().postMessage({ type: "signed-out", side });
    await deliverPendingMessages();

    expect(tab.leave).not.toHaveBeenCalled();
    expect(tab.result.current.signingOut).toBe(false);
    expect(tab.client.getQueryData(["current-user"])).toEqual({ id: "ana" });
  });

  it("sin sesión en memoria, o con un aviso que no es de salir, no hace nada", async () => {
    const anonymous = renderTab(sessionOf(undefined));
    const other = openOtherTab();
    other.postMessage({ type: "signed-out", side: "public" });
    await deliverPendingMessages();
    expect(anonymous.leave).not.toHaveBeenCalled();
    anonymous.unmount();

    const signedIn = renderTab(sessionOf("consumer"));
    for (const data of ["signed-out", { type: "signed-out" }, { type: "signed-out", side: "both" }, { type: "other", side: "public" }, null]) other.postMessage(data);
    await deliverPendingMessages();
    expect(signedIn.leave).not.toHaveBeenCalled();
  });

  it("si esta pestaña ya estaba saliendo, sigue la suya", async () => {
    const tab = renderTab(sessionOf("consumer"));
    act(() => beginSignOut());

    openOtherTab().postMessage({ type: "signed-out", side: "public" });
    await deliverPendingMessages();

    expect(tab.leave).not.toHaveBeenCalled();
  });

  it("durante la recuperación silenciosa, cierra la sesión que llega si es del mismo lado", async () => {
    const tab = renderTab(sessionOf(undefined, { isLoading: true, activeNavigator: "signinSilent" }));

    openOtherTab().postMessage({ type: "signed-out", side: "platform" });
    await deliverPendingMessages();
    expect(tab.leave).not.toHaveBeenCalled();

    act(() => tab.setSession(sessionOf("platform")));
    await waitFor(() => expect(tab.leave).toHaveBeenCalledOnce());
  });

  it("una recuperación que termina sin sesión, o con la del otro lado, no deja nada pendiente", async () => {
    const tab = renderTab(sessionOf(undefined, { isLoading: true, activeNavigator: "signinSilent" }));
    openOtherTab().postMessage({ type: "signed-out", side: "public" });
    await deliverPendingMessages();

    act(() => tab.setSession(sessionOf(undefined)));
    act(() => tab.setSession(sessionOf("consumer")));
    await deliverPendingMessages();
    expect(tab.leave).not.toHaveBeenCalled();

    const other = renderTab(sessionOf(undefined, { isLoading: true, activeNavigator: "signinSilent" }));
    openOtherTab().postMessage({ type: "signed-out", side: "public" });
    await deliverPendingMessages();
    act(() => other.setSession(sessionOf("platform")));
    await deliverPendingMessages();
    expect(other.leave).not.toHaveBeenCalled();
  });

  it("sin BroadcastChannel, Salir sale igual y nadie escucha", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const signoutRedirect = vi.fn(() => new Promise<void>(() => {}));
    const tab = renderTab(sessionOf("consumer", { signoutRedirect }));

    act(() => { void tab.result.current.signOut(); });

    expect(signoutRedirect).toHaveBeenCalledOnce();
    expect(FakeBroadcastChannel.open.size).toBe(0);
  });

  it("cierra el canal al desmontar", () => {
    const tab = renderTab(sessionOf("consumer"));
    expect(FakeBroadcastChannel.open.size).toBe(1);
    tab.unmount();
    expect(FakeBroadcastChannel.open.size).toBe(0);
  });

  it("la app lo escucha en cualquier pantalla y va al inicio, adonde lleva Salir", async () => {
    const assign = vi.fn();
    const { origin, host, hostname, protocol, pathname, search, hash, href } = globalThis.location;
    vi.stubGlobal("location", { origin, host, hostname, protocol, pathname, search, hash, href, assign, replace: vi.fn() });
    renderWithProviders(<p>{"Organizaciones"}</p>, { as: "platform-operator" });
    await waitFor(() => expect(FakeBroadcastChannel.open.size).toBe(1));

    openOtherTab().postMessage({ type: "signed-out", side: "platform" });
    await deliverPendingMessages();

    expect(assign).toHaveBeenCalledWith("/");
  });
});
