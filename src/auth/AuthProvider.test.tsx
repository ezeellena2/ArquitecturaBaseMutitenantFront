import type { ReactNode } from "react";
import { render, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { api, resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { AppAuthProvider } from "./AuthProvider";

const signinSilent = vi.hoisted(() => vi.fn());
const removeUser = vi.hoisted(() => vi.fn());

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: { access_token: "test-token", profile: { access: "business" } }, signinSilent, removeUser }),
}));

describe("AppAuthProvider", () => {
  afterEach(() => {
    resetHttpClient();
    signinSilent.mockReset();
    removeUser.mockReset();
    sessionStorage.removeItem("arquitecturabasemt.sessionExpired");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("entrega el token de memoria al cliente HTTP", async () => {
    let authorization: string | null = null;
    server.use(http.get("/api/auth-provider", ({ request }) => {
      authorization = request.headers.get("authorization");
      return HttpResponse.json({ ok: true });
    }));

    render(<AppAuthProvider><div /></AppAuthProvider>);
    await api.get("/api/auth-provider");

    expect(authorization).toBe("Bearer test-token");
  });

  it("inyecta la renovación OIDC y entrega el token renovado al reintento", async () => {
    signinSilent.mockResolvedValue({ access_token: "renewed-token" });
    const seen: string[] = [];
    server.use(http.get("/api/auth-provider", ({ request }) => {
      seen.push(request.headers.get("authorization") ?? "");
      return seen.length === 1
        ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })
        : HttpResponse.json({ ok: true });
    }));

    render(<AppAuthProvider><div /></AppAuthProvider>);
    await expect(api.get("/api/auth-provider")).resolves.toEqual({ ok: true });
    expect(signinSilent).toHaveBeenCalledOnce();
    expect(seen).toEqual(["Bearer test-token", "Bearer renewed-token"]);
  });

  it("limpia la sesión y la caché y abre la puerta empresa con el retorno y aviso al vencer", async () => {
    const navigate = vi.fn();
    vi.stubGlobal("location", {
      origin: "http://localhost:3000",
      pathname: "/org",
      search: "?tab=1",
      href: "http://localhost:3000/org?tab=1",
      assign: navigate,
    });
    signinSilent.mockResolvedValue(null);
    removeUser.mockResolvedValue(undefined);
    const clear = vi.spyOn(queryClient, "clear");
    server.use(http.get("/api/auth-provider", () => HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })));

    render(<AppAuthProvider><div /></AppAuthProvider>);
    await expect(api.get("/api/auth-provider")).rejects.toMatchObject({ status: 401 });

    await waitFor(() => expect(navigate).toHaveBeenCalledOnce());
    expect(removeUser).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem("arquitecturabasemt.sessionExpired")).toBe("1");
    expect(navigate).toHaveBeenCalledWith("/login/empresa?returnUrl=%2Forg%3Ftab%3D1&session=expired");
  });
});
