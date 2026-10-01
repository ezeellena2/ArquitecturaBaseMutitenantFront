import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");
const readBack = (file: string) => readFileSync(path.join(back, file), "utf8");
const readFront = (file: string) => readFileSync(path.join(front, file), "utf8");

describe("contrato funcional de cuenta entre repos", () => {
  it("usa las rutas y cuerpos de métodos, reauth, términos y baja publicados por el back", () => {
    const contract = readFront("src/shared/api/accountContract.ts");
    const schema = readFront("src/shared/api/generated/schema.d.ts");
    const openapiSource = readBack("docs/contracts/openapi.json");
    const openapi = JSON.parse(openapiSource) as {
      paths: Record<string, { post?: { requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> } } }>;
      components: { schemas: Record<string, { properties?: Record<string, unknown>; enum?: unknown[] }> };
    };
    for (const route of ["/api/me", "/api/me/login-methods", "/api/me/reauth", "/api/me/reauth/verify",
      "/api/me/external/google", "/api/legal/accept", "/api/me/deletion", "/api/auth/deletion/pending", "/api/auth/deletion/cancel"]) {
      expect(contract).toContain(`"${route}"`);
      expect(openapiSource).toContain(`"${route}"`);
      expect(schema).toContain(`"${route}"`);
    }
    for (const route of ["/api/me/login-methods/{methodId}/code", "/api/me/login-methods/{methodId}/verify", "/api/me/login-methods/{methodId}/primary"]) {
      expect(contract).toContain(route);
      expect(openapiSource).toContain(`"${route}"`);
    }
    expect(openapi.paths["/api/me/login-methods"].post?.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/AddLoginEmailHttpRequest");
    expect(openapi.components.schemas.AddLoginEmailHttpRequest.properties).toHaveProperty("reauthTicket");
    expect(openapi.paths["/api/me/external/google"].post?.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/ChangeLoginMethodHttpRequest");
    expect(openapi.components.schemas.ChangeLoginMethodHttpRequest.properties).toHaveProperty("reauthTicket");
    expect(openapi.components.schemas.ReauthAction.enum).toEqual(expect.arrayContaining(["AddEmail", "LinkGoogle"]));
    expect(readFront("src/areas/personal/account/components/AddLoginMethodDialog.tsx"))
      .toContain("addLoginEmail({ email, reauthTicket }, key)");
    expect(readFront("src/areas/personal/account/api/loginMethods.ts"))
      .toContain("linkGoogle(request: ChangeLoginMethodRequest)");
    expect(readFront("src/areas/personal/account/components/ChangeLoginMethodDialog.tsx"))
      .toContain('action === "addEmail" ? "AddEmail" : "LinkGoogle"');
    for (const field of ["version", "pendingLegalDocuments", "needsPersonalLoginMethod", "sourceMethodId", "targetMethodId",
      "reauthTicket", "cancelTicket", "scheduledForUtc", "timeZoneId", "returnUrl"]) expect(schema).toContain(`${field}`);
    expect(readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Account/UpdateMeHttpRequest.cs")).toContain("uint? Version");
    expect(readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Auth/CancelAccountDeletionHttpRequest.cs")).toContain("RawText");
  });

  it("conserva claims, puerta OAuth, códigos y metadata de la cancelación sin token en URL", () => {
    const contract = readFront("src/shared/api/accountContract.ts");
    const claims = readBack("src/ArquitecturaBaseMultitenant.Api/Tenancy/TenantClaimTypes.cs");
    for (const claim of ["access", "tenant_id", "tenant_kind"]) expect(claims).toContain(`"${claim}"`);
    expect(readFront("src/auth/AccessRoute.tsx")).toContain("profile.access");
    const errors = readBack("src/ArquitecturaBaseMultitenant.Application/Resources/Errors.resx");
    for (const code of ["Identity.Account.PendingDeletion", "Legal.AcceptanceRequired", "Legal.AccountDeletion.GraceExpired"]) {
      expect(contract).toContain(code);
      expect(errors).toContain(code);
    }
    const issuer = readBack("src/ArquitecturaBaseMultitenant.Application/Services/Legal/AccountDeletionCancelIssuer.cs");
    for (const field of ["cancelTicket", "scheduledForUtc", "timeZoneId", "returnUrl", "cancelTicketExpiresAtUtc"]) {
      expect(issuer).toContain(`"${field}"`);
      expect(contract).toContain(`"${field}"`);
    }
    const callback = readBack("src/ArquitecturaBaseMultitenant.Api/Controllers/Auth/ExternalLoginController.cs");
    expect(callback).toContain('"/cuenta?google=linked"');
    expect(callback).toContain("pendingCookie.Write(HttpContext, result.Error)");
    expect(callback).toContain('"/login/empresa"');
    expect(contract).toContain('"/cuenta"');
    expect(contract).toContain('"/login/empresa"');
    expect(readBack("src/ArquitecturaBaseMultitenant.Application/Services/Legal/AccountDeletionCanceller.cs")).toContain("ticket.ReturnUrl!");
  });

  it("preserva el claim de inicio en el token que el front envía como bearer", () => {
    const keys = readBack("src/ArquitecturaBaseMultitenant.Application/Configuration/Auth/BrowserSessionKeys.cs");
    const principal = readBack("src/ArquitecturaBaseMultitenant.Api/Authentication/OpenIdPrincipalFactory.cs");
    const context = readBack("src/ArquitecturaBaseMultitenant.Api/RequestContext/CurrentUser.cs");
    const frontAuth = readFront("src/auth/AuthProvider.tsx");
    expect(keys).toContain('StartedAtUtc = "session_started_at"');
    expect(principal).toContain("BrowserSessionKeys.StartedAtUtc");
    expect(context).toContain("SessionStartedAtUtc");
    expect(frontAuth).toContain("session?.user?.access_token");
    expect(readFront("src/shared/api/httpClient.ts")).toContain("Bearer ${token}");
  });
});
