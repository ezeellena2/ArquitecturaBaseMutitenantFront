import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { changeTenantState, createTenant, fetchTenantCounts, fetchTenants, retryTenantProvisioning } from "@/areas/platform/tenants/api/tenants";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");

const versionedActions = [
  ...["approve", "reject", "suspend", "reactivate", "close", "retry-provisioning"]
    .map((action) => `/api/platform/tenants/{id}/${action}`),
  ...["allow-publish", "unpublish"].map((action) => `/api/platform/tenants/{id}/public-site/${action}`),
  "/api/platform/tenants/{id}/domains/{domain}/verify",
  ...["approve", "reject"].map((action) => `/api/platform/recoveries/{id}/${action}`),
];

type Schema = { $ref?: string; type?: string; items?: Schema; anyOf?: Schema[]; oneOf?: Schema[] };
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

// Los destinos de E8 son uniones/intersecciones del contrato, además de objetos.
function generatedSchema(name: string): string {
  const start = generated.indexOf(`        ${name}: `);
  expect(start, name).toBeGreaterThanOrEqual(0);
  const following = generated.slice(start + 1).search(/\n        [A-Za-z]\w*: /u);
  return generated.slice(start, following < 0 ? generated.indexOf("\n    };", start) : start + 1 + following);
}

function referencedProperties(schema: Schema) {
  const reference = schema.$ref ?? [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].find((candidate) => candidate.$ref)?.$ref;
  expect(reference).toMatch(/^#\/components\/schemas\//u);
  return openApi.components.schemas[reference?.split("/").at(-1) ?? ""].properties;
}

describe("contratos de Plataforma entre back y front", () => {
  it.each(["approve", "reject", "suspend", "reactivate", "close"] as const)("T21b el cliente %s usa el POST real y su cuerpo versionado del contrato", async (action) => {
    const route = `/api/platform/tenants/{id}/${action}`;
    const operation = openApi.paths[route].post;
    const properties = referencedProperties(operation.requestBody!.content["application/json"].schema);
    let sent: unknown; let key: string | null = null;
    server.use(http.post(`/api/platform/tenants/org/${action}`, async ({ request }) => { sent = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 71 }); }));
    expect(await changeTenantState("org", action, { version: 37, reason: "Revisión" }, "contract-key")).toEqual({ version: 71 });
    expect(sent).toEqual({ version: 37, reason: "Revisión" }); expect(Object.keys(properties).sort()).toEqual(["reason", "version"]); expect(key).toBe("contract-key");
  });
  it("T21b el cliente usa las rutas de listado, conteos, alta y reintento sin motivo", async () => {
    const seen: { path: string; query?: Record<string, string>; body?: unknown; key?: string | null }[] = [];
    server.use(
      http.get("/api/platform/tenants/paged", ({ request }) => { const url = new URL(request.url); seen.push({ path: url.pathname, query: Object.fromEntries(url.searchParams) }); return HttpResponse.json({ items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }); }),
      http.get("/api/platform/tenants/filter-counts", ({ request }) => { const url = new URL(request.url); seen.push({ path: url.pathname, query: Object.fromEntries(url.searchParams) }); return HttpResponse.json({ total: 0, statuses: [], sources: [] }); }),
      http.post("/api/platform/tenants", async ({ request }) => { seen.push({ path: new URL(request.url).pathname, body: await request.json(), key: request.headers.get("Idempotency-Key") }); return HttpResponse.json({ id: "org", name: "Delta", slug: "delta", firstCompanyId: "company", invitationId: "invite" }, { status: 201 }); }),
      http.post("/api/platform/tenants/org/retry-provisioning", async ({ request }) => { seen.push({ path: new URL(request.url).pathname, body: await request.json(), key: request.headers.get("Idempotency-Key") }); return HttpResponse.json({ version: 8 }); }),
    );
    await fetchTenants({ page: 1, pageSize: 50, sort: "name", search: "Delta", status: "Provisioning", source: "SelfService" });
    await fetchTenantCounts({ search: "Delta", status: "Provisioning", source: "SelfService" });
    const body = { name: "Delta", firstCompanyName: "Delta S.A.", ownerEmail: "owner@example.com", culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" };
    await createTenant(body, "create-key"); await retryTenantProvisioning("org", { version: 7 }, "retry-key");
    expect(seen[0]).toEqual({ path: "/api/platform/tenants/paged", query: { page: "1", pageSize: "50", sort: "name", search: "Delta", status: "Provisioning", source: "SelfService" } });
    expect(seen[1]).toEqual({ path: "/api/platform/tenants/filter-counts", query: { search: "Delta", status: "Provisioning", source: "SelfService" } });
    expect(seen[2]).toEqual({ path: "/api/platform/tenants", body, key: "create-key" }); expect(seen[3]).toEqual({ path: "/api/platform/tenants/org/retry-provisioning", body: { version: 7 }, key: "retry-key" });
    expect(Object.keys(openApi.components.schemas.CreatePlatformTenantHttpRequest.properties).sort()).toEqual(Object.keys(body).sort());
    expect(Object.keys(openApi.components.schemas.PlatformTenantRetryHttpRequest.properties)).toEqual(["version"]);
    for (const name of Object.keys(seen[0].query ?? {})) expect(openApi.paths[seen[0].path].get.parameters?.map((parameter) => parameter.name.toLowerCase())).toContain(name.toLowerCase());
  });
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
    ["/api/platform/tenants/{id}", "get", 200, null, "PlatformTenantDetailResponse"],
    ...["approve", "reject", "suspend", "reactivate", "close"].map((action) => [`/api/platform/tenants/{id}/${action}`, "post", 200, "PlatformTenantStateHttpRequest", "VersionResponse"]),
    ["/api/platform/tenants/{id}/retry-provisioning", "post", 200, "PlatformTenantRetryHttpRequest", "VersionResponse"],
    ["/api/platform/tenants/{id}/features", "get", 200, null, "PlatformFeatureResponse[]"],
    ["/api/platform/tenants/{id}/features/{featureKey}", "put", 200, "UpdatePlatformFeatureHttpRequest", "VersionResponse"],
    ["/api/platform/tenants/{id}/domains", "get", 200, null, "OrganizationDomainResponse[]"],
    ["/api/platform/tenants/{id}/domains/paged", "get", 200, null, "PagedResultOfOrganizationDomainResponse"],
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
    ["/api/platform/audit/organizations", "get", 200, null, "PlatformAuditOrganizationResponse[]"],
    ["/api/platform/audit/organizations/paged", "get", 200, null, "PagedResultOfPlatformAuditOrganizationResponse"],
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
      expect(generated).toContain(`        ${body}: `);
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
    ["UpdatePlatformFeatureHttpRequest", ["enabled", "source", "expiresOn", "version", "reason"]],
    ["InvitePlatformOperatorHttpRequest", ["email", "permissions"]],
    ["ChangePlatformOperatorHttpRequest", ["version", "reason", "permissions"]],
    ["PublishLegalDocumentHttpRequest", ["kind", "effectiveOn", "contents"]],
    ["LegalDocumentContentHttpRequest", ["culture", "text"]],
    ["UpdatePlatformSettingsHttpRequest", ["consumerSignup", "businessSignup", "maxOwnedOrganizations", "salesEmail", "supportEmail", "version", "reason", "rateLimits"]],
    ["RequestRecoveryCodeHttpRequest", ["email", "phone", "channel", "nonce"]],
    ["VerifyRecoveryCodeHttpRequest", ["email", "phone", "channel", "nonce", "code"]],
    ["SubmitAccountRecoveryHttpRequest", ["email", "phone", "channel", "nonce", "previousEmail", "previousPhone"]],
  ] as const)("%s mantiene exactamente los campos del cuerpo", (schema, fields) => {
    expect(Object.keys(openApi.components.schemas[schema].properties).sort()).toEqual([...fields].sort());
    const body = generatedSchema(schema);
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
    ["/api/platform/audit/organizations", ["After", "Limit", "Period", "Type", "TenantId", "AccountId", "Search"]],
  ] as const)("%s conserva todos los parámetros de consulta", (route, fields) => {
    expect(openApi.paths[route].get.parameters?.map((parameter) => parameter.name).sort()).toEqual([...fields].sort());
    const block = generatedRoute(route).split("        get: {")[1]?.split("        put:")[0];
    for (const field of fields) expect(block).toContain(`${field}?:`);
  });

  it.each([
    ["PlatformTenantResponse", ["id", "name", "slug", "status", "source", "createdAtUtc", "companyCount", "memberCount", "ownerName", "ownerEmail", "version"]],
    ["PlatformTenantFilterCounts", ["total", "statuses", "sources"]],
    ["CreatedPlatformTenantResponse", ["id", "name", "slug", "firstCompanyId", "invitationId"]],
    ["PlatformFeatureResponse", ["key", "enabled", "source", "expiresOn", "version"]],
    ["OrganizationDomainResponse", ["id", "domain", "status", "txtRecordName", "txtRecordValue", "verifiedAtUtc", "version", "managedEmailCount"]],
    ["PlatformPublicSiteResponse", ["slug", "name", "isPublished", "publishedAtUtc", "publishBlockedAtUtc", "publishBlockedReason", "version"]],
    ["PlatformAccountResponse", ["id", "displayName", "primaryEmail", "kind", "state", "hasPersonalSpace", "organizationCount", "lastSignInAtUtc", "lastSignInMethod", "invitationExpiresAtUtc"]],
    ["PlatformAccountFilterCounts", ["total", "states", "kinds"]],
    ["PlatformAccountDetailResponse", ["displayName", "primaryEmail", "kind", "state", "createdAtUtc", "lastSignInAtUtc", "lastSignInMethod", "invitationExpiresAtUtc", "hasPersonalSpace", "deletion", "loginMethods", "organizations", "soleOwnerOrganizations", "operatorPermissions", "operatorVersion", "lastStateChange", "deletedAtUtc"]],
    ["PlatformAccountLoginMethodResponse", ["type", "maskedValue", "isPrimary", "verifiedAtUtc", "managedByOrganizationName", "canSignIn"]],
    ["PlatformAccountMembershipResponse", ["tenantId", "name", "roleName", "joinedAtUtc", "status", "tenantStatus", "endedAtUtc"]],
    ["PlatformOperatorInvitationResponse", ["id", "expiresAtUtc"]],
    ["PlatformRecoveryResponse", ["id", "createdAtUtc", "accountId", "accountName", "previousMethodType", "previousMethod", "newMethodType", "newMethod", "status", "decidedAtUtc", "decidedBy", "reason", "version"]],
    ["PlatformRecoveryFilterCounts", ["total", "statuses"]],
    ["PlatformLegalDocumentGroupResponse", ["kind", "currentVersion", "currentEffectiveAtUtc", "versions"]],
    ["PlatformLegalVersionResponse", ["id", "version", "effectiveAtUtc", "isCurrent"]],
    ["PublishedLegalDocumentResponse", ["id", "version"]],
    ["PlatformAuditEventResponse", ["id", "occurredAtUtc", "type", "action", "summary", "target", "targetTenantId", "targetAccountId", "actor", "actorRole", "reason", "ipAddress"]],
    ["PlatformAuditOrganizationResponse", ["id", "name"]],
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

  it("T22b la ficha identifica la cuenta con el mismo Email nullable del listado", () => {
    const detail = openApi.components.schemas.PlatformAccountDetailResponse;
    const row = openApi.components.schemas.PlatformAccountResponse;
    expect(detail.properties).toHaveProperty("primaryEmail");
    expect(detail.properties.primaryEmail).toEqual(row.properties.primaryEmail);
    expect(detail.properties.primaryEmail).toEqual({ oneOf: [{ type: "null" }, { $ref: "#/components/schemas/Email" }] });
    expect(openApi.components.schemas.Email).toMatchObject({ type: ["null", "string"] });
    const body = generated.match(/        PlatformAccountDetailResponse: \{([\s\S]*?)\n        \};/u)?.[1];
    expect(body).toContain('primaryEmail?: null | components["schemas"]["Email"];');
    expect(openApi.components.schemas.PlatformAccountLoginMethodResponse.properties).toHaveProperty("maskedValue");
    expect(openApi.components.schemas.PlatformAccountLoginMethodResponse.properties).not.toHaveProperty("value");
  });

  it("T22a la ficha expone evidencia nullable del último estado y la eliminación, sin version de cuenta", () => {
    const detail = openApi.components.schemas.PlatformAccountDetailResponse;
    expect(detail.properties).toHaveProperty("lastStateChange");
    expect(detail.properties).toHaveProperty("deletedAtUtc");
    const state = referencedProperties(detail.properties.lastStateChange as Schema);
    expect(Object.keys(state).sort()).toEqual(["atUtc", "action", "reason"].sort());
    expect(state.atUtc).toMatchObject({ format: "date-time" });
    expect(detail.properties.deletedAtUtc).toMatchObject({ format: "date-time" });
    expect(detail.properties).not.toHaveProperty("version");
    expect(detail.properties).toHaveProperty("operatorVersion");
    const body = generated.match(/        PlatformAccountDetailResponse: \{([\s\S]*?)\n        \};/u)?.[1];
    expect(body).toMatch(/\blastStateChange\??: [^\n]*\bnull\b/u);
    expect(body).toMatch(/\bdeletedAtUtc\??: (?:null \| string|string \| null);/u);
    for (const field of ["lastStateChange", "deletedAtUtc"]) {
      expect(openApi.components.schemas.PlatformAccountResponse.properties).not.toHaveProperty(field);
    }
  });

  it("T21a separa la ficha de la fila paginada y declara su historial por cursor", () => {
    const detail = openApi.components.schemas.PlatformTenantDetailResponse;
    expect(detail).toBeDefined();
    expect(detail.properties).toHaveProperty("owners");
    expect(detail.properties).toHaveProperty("lastStateChange");
    expect(detail.properties).toHaveProperty("version");
    const owners = detail.properties.owners as Schema;
    expect(owners.type).toBe("array");
    const owner = referencedProperties(owners.items ?? {});
    for (const field of ["id", "displayName", "email", "identityStatus", "membershipStatus", "lastSignInAtUtc", "lastSignInMethod"]) {
      expect(owner).toHaveProperty(field);
    }
    const state = referencedProperties(detail.properties.lastStateChange as Schema);
    expect(Object.keys(state).sort()).toEqual(["atUtc", "action", "reason"].sort());
    expect(openApi.components.schemas.PlatformTenantResponse.properties).not.toHaveProperty("owners");
    expect(openApi.components.schemas.PlatformTenantResponse.properties).not.toHaveProperty("lastStateChange");
    const history = openApi.paths["/api/platform/tenants/{id}/history"]?.get;
    expect(history).toBeDefined();
    expect(history.parameters?.map((parameter) => parameter.name).sort()).toEqual(["After", "Limit", "id"].sort());
    const historyBlock = generatedRoute("/api/platform/tenants/{id}/history");
    expect(historyBlock).toContain("After?:");
    expect(historyBlock).toContain("Limit?:");
    expect(history.responses["200"]?.content?.["application/json"]?.schema?.$ref).toBeDefined();
    const cursor = referencedProperties(history.responses["200"].content?.["application/json"]?.schema ?? {});
    expect(Object.keys(cursor).sort()).toEqual(["items", "nextCursor", "hasMore"].sort());
    const event = referencedProperties((cursor.items as Schema).items ?? {});
    for (const field of ["id", "occurredAtUtc", "action", "actor", "actorRole", "reason", "summary"]) expect(event).toHaveProperty(field);
    for (const status of ["401", "403", "404"]) expect(history.responses).toHaveProperty(status);
    expect(generated).toContain("        PlatformTenantDetailResponse: {");
  });

  it("T21a extiende pruebas con una fecha civil en ambos contratos", () => {
    for (const name of ["UpdatePlatformFeatureHttpRequest", "PlatformFeatureResponse"]) {
      const properties = openApi.components.schemas[name].properties;
      expect(properties.expiresOn).toMatchObject({ format: "date" });
      expect(properties).not.toHaveProperty("expiresAtUtc");
      const body = generated.match(new RegExp(`        ${name}: \\{([\\s\\S]*?)\\n        \\};`, "u"))?.[1];
      expect(body).toMatch(/\bexpiresOn\??: (?:null \| string|string \| null);/u);
      expect(body).not.toContain("expiresAtUtc");
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
