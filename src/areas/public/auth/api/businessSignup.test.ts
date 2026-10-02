import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { configureHttpClient, resetHttpClient } from "@/shared/api/httpClient";
import {
  checkBusinessSlug,
  createBusinessOrganization,
  requestBusinessSignupCode,
  verifyBusinessSignupCode,
} from "./businessSignup";

describe("alta empresarial API", () => {
  it("usa código por correo, consulta el slug y crea con cookie, antiforgery e idempotencia", async () => {
    const requests: Array<{ path: string; body?: unknown; authorization: string | null;
      key: string | null; csrf: string | null }> = [];
    server.use(
      http.post("/api/auth/business-signup/code", async ({ request }) => {
        requests.push({ path: "/code", body: await request.json(), authorization: request.headers.get("authorization"),
          key: request.headers.get("Idempotency-Key"), csrf: request.headers.get("RequestVerificationToken") });
        return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
      }),
      http.post("/api/auth/business-signup/verify", async ({ request }) => {
        requests.push({ path: "/verify", body: await request.json(), authorization: request.headers.get("authorization"),
          key: request.headers.get("Idempotency-Key"), csrf: request.headers.get("RequestVerificationToken") });
        return new HttpResponse(null, { status: 204 });
      }),
      http.get("/api/public-site/slug-availability", ({ request }) => {
        requests.push({ path: new URL(request.url).pathname + new URL(request.url).search,
          authorization: request.headers.get("authorization"), key: null, csrf: null });
        return HttpResponse.json({ slug: "acme", availability: "Available" });
      }),
      http.post("/api/auth/business-signup", async ({ request }) => {
        requests.push({ path: "/create", body: await request.json(), authorization: request.headers.get("authorization"),
          key: request.headers.get("Idempotency-Key"), csrf: request.headers.get("RequestVerificationToken") });
        return HttpResponse.json({ tenantId: "tenant-id", status: "Active" });
      }),
    );
    configureHttpClient({ getAccessToken: () => "consumer-token" });
    try {
      await expect(requestBusinessSignupCode({ email: "ana@example.com", acceptedTerms: true }, "code-key"))
        .resolves.toEqual({ resendAfterSeconds: 60 });
      await expect(verifyBusinessSignupCode({ email: "ana@example.com", code: "123456", acceptedTerms: true }, "verify-key"))
        .resolves.toBeUndefined();
      await expect(checkBusinessSlug("acme")).resolves.toEqual({ slug: "acme", availability: "Available" });
      await expect(createBusinessOrganization({ organizationName: "Acme", slug: "acme",
        firstCompanyName: "Acme AR", taxId: { type: "AR-CUIT", number: "20123456786" }, acceptedTerms: true },
      "create-key", "csrf-token")).resolves.toMatchObject({ tenantId: "tenant-id", status: "Active" });

      expect(requests).toEqual([
        { path: "/code", body: { email: "ana@example.com", acceptedTerms: true }, authorization: "Bearer consumer-token", key: "code-key", csrf: null },
        { path: "/verify", body: { email: "ana@example.com", code: "123456", acceptedTerms: true }, authorization: "Bearer consumer-token", key: "verify-key", csrf: null },
        { path: "/api/public-site/slug-availability?slug=acme", authorization: "Bearer consumer-token", key: null, csrf: null },
        { path: "/create", body: { organizationName: "Acme", slug: "acme", firstCompanyName: "Acme AR",
          taxId: { type: "AR-CUIT", number: "20123456786" }, acceptedTerms: true }, authorization: null,
        key: "create-key", csrf: "csrf-token" },
      ]);
    } finally {
      resetHttpClient();
    }
  });
});
