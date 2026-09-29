import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { api, resetHttpClient } from "@/shared/api/httpClient";
import { AppAuthProvider } from "./AuthProvider";

vi.mock("react-oidc-context", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: { access_token: "test-token" } }),
}));

describe("AppAuthProvider", () => {
  afterEach(() => resetHttpClient());

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
});
