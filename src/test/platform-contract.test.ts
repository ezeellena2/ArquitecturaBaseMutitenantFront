import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");

const versionedActions = [
  ...["approve", "reject", "suspend", "reactivate", "close", "retry-provisioning"]
    .map((action) => `/api/platform/tenants/{id}/${action}`),
  ...["allow-publish", "unpublish"].map((action) => `/api/platform/tenants/{id}/public-site/${action}`),
  "/api/platform/tenants/{id}/domains/{domain}/verify",
  ...["approve", "reject"].map((action) => `/api/platform/recoveries/{id}/${action}`),
];

type Schema = { $ref?: string; type?: string; items?: Schema };
type OpenApi = {
  paths: Record<string, Record<string, {
    requestBody?: { content: Record<string, { schema: Schema }> };
    parameters?: { name: string }[];
    responses: Record<string, { content?: Record<string, { schema?: Schema }> }>;
  }>>;
  components: { schemas: Record<string, { properties: Record<string, unknown> }> };
};

const openApi = JSON.parse(readFileSync(path.join(back, "docs/contracts/openapi.json"), "utf8")) as OpenApi;
const generated = readFileSync(path.join(front, "src/shared/api/generated/schema.d.ts"), "utf8");

function generatedRoute(route: string): string {
  const start = generated.indexOf(`    "${route}": {`);
  expect(start, route).toBeGreaterThanOrEqual(0);
  const end = generated.indexOf('\n    "/', start + 1);
  return generated.slice(start, end < 0 ? generated.indexOf("\n}\n", start) : end);
}

describe("contratos de Plataforma entre back y front", () => {
  it("los permisos de Plataforma viajan en effectivePermissions de /api/me (E5)", () => {
    const permissions = openApi.components.schemas.EffectivePermissions.properties;
    expect(Object.keys(permissions).sort()).toEqual(["companies", "organization", "platform"]);
    expect(permissions.platform).toMatchObject({ type: "array", items: { type: "string" } });
    const body = generated.match(/        EffectivePermissions: \{([\s\S]*?)\n        \};/u)?.[1];
    expect(body).toContain("platform: string[];");
    expect(openApi.paths["/api/me"].get.responses["200"].content?.["application/json"].schema?.$ref).toBe("#/components/schemas/MeResponse");
  });

  it.each([
    ["/api/platform/tenants/paged", "get", 200, null, "PagedResultOfPlatformTenantResponse"],
    ["/api/platform/tenants/filter-counts", "get", 200, null, "PlatformTenantFilterCounts"],
    ["/api/platform/tenants", "post", 201, "CreatePlatformTenantHttpRequest", "CreatedPlatformTenantResponse"],
    ["/api/platform/tenants/{id}", "get", 200, null, "PlatformTenantResponse"],
    ...["approve", "reject", "suspend", "reactivate", "close"].map((action) => [`/api/platform/tenants/{id}/${action}`, "post", 200, "PlatformTenantStateHttpRequest", "VersionResponse"]),
    ["/api/platform/tenants/{id}/retry-provisioning", "post", 200, "PlatformTenantRetryHttpRequest", "VersionResponse"],
    ["/api/platform/tenants/{id}/features", "get", 200, null, "PlatformFeatureResponse[]"],
    ["/api/platform/tenants/{id}/features/{featureKey}", "put", 200, "UpdatePlatformFeatureHttpRequest", "VersionResponse"],
    ["/api/platform/tenants/{id}/domains", "get", 200, null, "OrganizationDomainResponse[]"],
    ["/api/platform/tenants/{id}/domains/{domain}/verify", "post", 200, "PlatformTenantStateHttpRequest", "VersionResponse"],
    ["/api/platform/tenants/{id}/domains/{domain}", "delete", 204, "PlatformTenantStateHttpRequest", null],
    ["/api/platform/tenants/{id}/public-site", "get", 200, null, "PlatformPublicSiteResponse"],
    ...["unpublish", "allow-publish"].map((action) => [`/api/platform/tenants/{id}/public-site/${action}`, "post", 200, "PlatformTenantStateHttpRequest", "VersionResponse"]),
    ["/api/platform/accounts/paged", "get", 200, null, "PagedResultOfPlatformAccountResponse"],
    ["/api/platform/accounts/filter-counts", "get", 200, null, "PlatformAccountFilterCounts"],
    ["/api/platform/accounts/{id}", "get", 200, null, "PlatformAccountDetailResponse"],
    ...["suspend", "reactivate", "revoke-sessions", "deletion"].map((action) => [`/api/platform/accounts/{id}/${action}`, "post", 204, "PlatformAccountReasonHttpRequest", null]),
    ["/api/platform/operators/invitations", "post", 201, "InvitePlatformOperatorHttpRequest", "PlatformOperatorInvitationResponse"],
    ["/api/platform/operators/{id}/invitation/resend", "post", 200, null, "PlatformOperatorInvitationResponse"],
    ["/api/platform/operators/{id}/invitation", "delete", 204, null, null],
    ["/api/platform/accounts/{id}/operator", "put", 200, "ChangePlatformOperatorHttpRequest", "VersionResponse"],
    ["/api/platform/accounts/{id}/operator", "delete", 204, "PlatformAccountActionHttpRequest", null],
    ["/api/platform/recoveries/paged", "get", 200, null, "PagedResultOfPlatformRecoveryResponse"],
    ["/api/platform/recoveries/filter-counts", "get", 200, null, "PlatformRecoveryFilterCounts"],
    ...["approve", "reject"].map((action) => [`/api/platform/recoveries/{id}/${action}`, "post", 200, "PlatformAccountActionHttpRequest", "VersionResponse"]),
    ["/api/platform/legal-documents", "get", 200, null, "PlatformLegalDocumentGroupResponse[]"],
    ["/api/platform/legal-documents", "post", 201, "PublishLegalDocumentHttpRequest", "PublishedLegalDocumentResponse"],
    ["/api/platform/audit", "get", 200, null, "CursorResultOfPlatformAuditEventResponse"],
    ["/api/platform/audit/{id}", "get", 200, null, "PlatformAuditEventResponse"],
    ["/api/platform/settings", "get", 200, null, "PlatformSettingsResponse"],
    ["/api/platform/settings", "put", 200, "UpdatePlatformSettingsHttpRequest", "VersionResponse"],
    ["/api/account-recovery/code", "post", 202, "RequestRecoveryCodeHttpRequest", "RequestLoginCodeResponse"],
    ["/api/account-recovery/verify", "post", 204, "VerifyRecoveryCodeHttpRequest", null],
    ["/api/account-recovery", "post", 202, "SubmitAccountRecoveryHttpRequest", null],
  ] as [string, string, number, string | null, string | null][])("%s %s publica cuerpo y respuesta %s en OpenAPI y schema", (route, method, status, body, response) => {
    const operation = openApi.paths[route]?.[method];
    expect(operation).toBeDefined();
    const block = generatedRoute(route).split(`        ${method}: {`)[1]?.split(/^        (?:get|put|post|delete|options|head|patch|trace)\??:/mu)[0];
    expect(block).toBeDefined();
    if (body) {
      expect(operation.requestBody?.content["application/json"].schema.$ref).toBe(`#/components/schemas/${body}`);
      expect(block).toContain(`components["schemas"]["${body}"]`);
      expect(generated).toContain(`        ${body}: {`);
    } else expect(operation.requestBody).toBeUndefined();
    expect(block).toContain(`${status}:`);
    const result = operation.responses[String(status)];
    expect(result).toBeDefined();
    if (response) {
      const array = response.endsWith("[]");
      const name = array ? response.slice(0, -2) : response;
      const schema = result.content?.["application/json"]?.schema;
      if (array) expect(schema?.type).toBe("array");
      expect(array ? schema?.items?.$ref : schema?.$ref).toBe(`#/components/schemas/${name}`);
      expect(block).toContain(`components["schemas"]["${name}"]${array ? "[]" : ""}`);
      expect(generated).toContain(`        ${name}: {`);
    } else expect(result.content).toBeUndefined();
  });

  it.each([
    ["CreatePlatformTenantHttpRequest", ["name", "firstCompanyName", "ownerEmail", "culture", "timeZoneId"]],
    ["PlatformTenantStateHttpRequest", ["version", "reason"]],
    ["PlatformAccountReasonHttpRequest", ["reason"]],
    ["PlatformAccountActionHttpRequest", ["version", "reason"]],
    ["UpdatePlatformFeatureHttpRequest", ["enabled", "source", "expiresAtUtc", "version", "reason"]],
    ["InvitePlatformOperatorHttpRequest", ["email", "permissions"]],
    ["ChangePlatformOperatorHttpRequest", ["version", "reason", "permissions"]],
    ["PublishLegalDocumentHttpRequest", ["kind", "effectiveOn", "contents"]],
    ["LegalDocumentContentHttpRequest", ["culture", "text"]],
    ["UpdatePlatformSettingsHttpRequest", ["consumerSignup", "businessSignup", "maxOwnedOrganizations", "salesEmail", "supportEmail", "version", "reason"]],
    ["RequestRecoveryCodeHttpRequest", ["email", "nonce"]],
    ["VerifyRecoveryCodeHttpRequest", ["email", "nonce", "code"]],
    ["SubmitAccountRecoveryHttpRequest", ["email", "nonce", "previousEmail", "previousPhone"]],
  ] as const)("%s mantiene exactamente los campos del cuerpo", (schema, fields) => {
    expect(Object.keys(openApi.components.schemas[schema].properties).sort()).toEqual([...fields].sort());
    const body = generated.match(new RegExp(`        ${schema}: \\{([\\s\\S]*?)\\n        \\};`, "u"))?.[1];
    expect(body).toBeDefined();
    for (const field of fields) expect(body).toMatch(new RegExp(`\\b${field}\\??:`, "u"));
  });

  it.each([
    ["/api/platform/tenants/paged", ["Page", "PageSize", "Sort", "Search", "Status", "Source"]],
    ["/api/platform/tenants/filter-counts", ["Page", "PageSize", "Sort", "Search", "Status", "Source"]],
    ["/api/platform/accounts/paged", ["Page", "PageSize", "Sort", "Search", "State", "Kind"]],
    ["/api/platform/accounts/filter-counts", ["Page", "PageSize", "Sort", "Search", "State", "Kind"]],
    ["/api/platform/recoveries/paged", ["Page", "PageSize", "Sort", "Search", "Status"]],
    ["/api/platform/recoveries/filter-counts", ["Page", "PageSize", "Sort", "Search", "Status"]],
    ["/api/platform/audit", ["After", "Limit", "Period", "Type", "TenantId", "AccountId", "Search"]],
  ] as const)("%s conserva todos los parámetros de consulta", (route, fields) => {
    expect(openApi.paths[route].get.parameters?.map((parameter) => parameter.name).sort()).toEqual([...fields].sort());
    const block = generatedRoute(route).split("        get: {")[1]?.split("        put:")[0];
    for (const field of fields) expect(block).toContain(`${field}?:`);
  });

  it.each([
    ["PlatformTenantResponse", ["id", "name", "slug", "status", "source", "createdAtUtc", "companyCount", "memberCount", "ownerName", "ownerEmail", "version"]],
    ["PlatformTenantFilterCounts", ["total", "statuses", "sources"]],
    ["CreatedPlatformTenantResponse", ["id", "name", "slug", "firstCompanyId", "invitationId"]],
    ["PlatformFeatureResponse", ["key", "enabled", "source", "expiresAtUtc", "version"]],
    ["OrganizationDomainResponse", ["id", "domain", "status", "txtRecordName", "txtRecordValue", "verifiedAtUtc", "version", "managedEmailCount"]],
    ["PlatformPublicSiteResponse", ["slug", "name", "isPublished", "publishBlockedAtUtc", "publishBlockedReason", "version"]],
    ["PlatformAccountResponse", ["id", "displayName", "primaryEmail", "kind", "state", "hasPersonalSpace", "organizationCount", "lastSignInAtUtc", "lastSignInMethod", "invitationExpiresAtUtc"]],
    ["PlatformAccountFilterCounts", ["total", "states", "kinds"]],
    ["PlatformAccountDetailResponse", ["displayName", "kind", "state", "createdAtUtc", "lastSignInAtUtc", "lastSignInMethod", "invitationExpiresAtUtc", "hasPersonalSpace", "deletion", "loginMethods", "organizations", "soleOwnerOrganizations", "operatorPermissions", "operatorVersion"]],
    ["PlatformAccountLoginMethodResponse", ["type", "maskedValue", "isPrimary", "verifiedAtUtc", "managedByOrganizationName", "canSignIn"]],
    ["PlatformAccountMembershipResponse", ["tenantId", "name", "roleName", "joinedAtUtc", "status", "tenantStatus", "endedAtUtc"]],
    ["PlatformOperatorInvitationResponse", ["id", "expiresAtUtc"]],
    ["PlatformRecoveryResponse", ["id", "createdAtUtc", "accountId", "accountName", "previousMethodType", "previousMethod", "newMethodType", "newMethod", "status", "decidedAtUtc", "decidedBy", "reason", "version"]],
    ["PlatformRecoveryFilterCounts", ["total", "statuses"]],
    ["PlatformLegalDocumentGroupResponse", ["kind", "currentVersion", "currentEffectiveAtUtc", "versions"]],
    ["PlatformLegalVersionResponse", ["id", "version", "effectiveAtUtc", "isCurrent"]],
    ["PublishedLegalDocumentResponse", ["id", "version"]],
    ["PlatformAuditEventResponse", ["id", "occurredAtUtc", "type", "action", "summary", "target", "targetTenantId", "targetAccountId", "actor", "actorRole", "reason", "ipAddress"]],
    ["PlatformSettingsResponse", ["consumerSignup", "businessSignup", "maxOwnedOrganizations", "salesEmail", "supportEmail", "version"]],
    ["RequestLoginCodeResponse", ["resendAfterSeconds"]],
  ] as const)("%s expone los campos de respuesta usados por la pantalla", (schema, fields) => {
    const body = generated.match(new RegExp(`        ${schema}: \\{([\\s\\S]*?)\\n        \\};`, "u"))?.[1];
    expect(body).toBeDefined();
    for (const field of fields) {
      expect(openApi.components.schemas[schema].properties).toHaveProperty(field);
      expect(body).toMatch(new RegExp(`\\b${field}\\??:`, "u"));
    }
  });

  it("T19 consume los tres contratos públicos generados desde su cliente", () => {
    const client = readFileSync(path.join(front, "src/areas/public/auth/api/recovery.ts"), "utf8");
    const aliases = readFileSync(path.join(front, "src/shared/api/types.ts"), "utf8");
    for (const schema of ["RequestRecoveryCodeHttpRequest", "VerifyRecoveryCodeHttpRequest", "SubmitAccountRecoveryHttpRequest"]) expect(aliases).toContain(`ApiSchemas["${schema}"]`);
    for (const route of ["/api/account-recovery/code", "/api/account-recovery/verify", "/api/account-recovery"]) expect(client).toContain(`"${route}"`);
    expect(client.match(/"Idempotency-Key": key/gu)).toHaveLength(3);
  });

  it.each(versionedActions)("(E5) %s responde la versión nueva para la acción siguiente", (route) => {
    const responses = openApi.paths[route].post.responses;
    expect(responses["200"]?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/VersionResponse");
    expect(responses).not.toHaveProperty("204");

    const post = generatedRoute(route).split("        post: {")[1]?.split("        delete:")[0];
    expect(post).toBeDefined();
    expect(post).toContain("200:");
    expect(post).toContain('components["schemas"]["VersionResponse"]');
    expect(post).not.toContain("204:");
  });

  it.each(["PlatformAccountResponse", "PlatformAccountDetailResponse"])(
    "(E5) %s omite la versión de la cuenta y conserva la de la asignación del operador",
    (schema) => {
      expect(openApi.components.schemas[schema].properties).not.toHaveProperty("version");
      const body = generated.match(new RegExp(`${schema}: \\{([\\s\\S]*?)\\n\\s*\\};`, "u"))?.[1];
      expect(body).toBeDefined();
      expect(body).not.toMatch(/\bversion\??:/u);
      if (schema === "PlatformAccountDetailResponse") {
        expect(openApi.components.schemas[schema].properties).toHaveProperty("operatorVersion");
        expect(body).toContain("operatorVersion?:");
      }
    },
  );

  it("reintenta el alta con versión y sin pedir un motivo al operador", () => {
    const openApi = JSON.parse(readFileSync(path.join(back, "docs/contracts/openapi.json"), "utf8")) as {
      paths: Record<string, { post: { requestBody: { content: Record<string, { schema: { $ref: string } }> } } }>;
      components: { schemas: Record<string, { properties: Record<string, unknown> }> };
    };
    const generated = readFileSync(path.join(front, "src/shared/api/generated/schema.d.ts"), "utf8");

    expect(openApi.paths["/api/platform/tenants/{id}/retry-provisioning"].post.requestBody
      .content["application/json"].schema.$ref).toBe("#/components/schemas/PlatformTenantRetryHttpRequest");
    expect(Object.keys(openApi.components.schemas.PlatformTenantRetryHttpRequest.properties)).toEqual(["version"]);
    expect(generated).toContain('"/api/platform/tenants/{id}/retry-provisioning"');
    expect(generated).toContain('components["schemas"]["PlatformTenantRetryHttpRequest"]');
    const request = generated.match(/PlatformTenantRetryHttpRequest: \{([\s\S]*?)\n\s*\};/u)?.[1];
    expect(request).toBeDefined();
    expect(request).toContain("version?:");
    expect(request).not.toContain("reason");
  });
});
