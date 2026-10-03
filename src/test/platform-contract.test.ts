import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");

describe("contratos de Plataforma entre back y front", () => {
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
