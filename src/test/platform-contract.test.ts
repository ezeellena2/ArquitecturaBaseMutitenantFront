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

type OpenApi = {
  paths: Record<string, Record<string, {
    responses: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
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
