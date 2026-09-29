import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { api, resetHttpClient } from "@/shared/api/httpClient";
import { AppAuthProvider } from "./AuthProvider";

const signinSilent = vi.hoisted(() => vi.fn());

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: { access_token: "test-token" }, signinSilent }),
}));

describe("AppAuthProvider", () => {
  afterEach(() => { resetHttpClient(); signinSilent.mockReset(); });

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
});
