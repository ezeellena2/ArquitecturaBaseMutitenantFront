import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");
const readBack = (file: string) => readFileSync(path.join(back, file), "utf8");
const readFront = (file: string) => readFileSync(path.join(front, file), "utf8");
type OpenApiOperation = {
  requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> };
  responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
};

describe("contrato de alta empresarial entre back y front", () => {
  it("publica la forma fiscal y los estados del slug que consume el cliente", () => {
    const controller = readBack("src/ArquitecturaBaseMultitenant.Api/Controllers/Auth/BusinessSignupController.cs");
    const request = readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Auth/BusinessSignupHttpRequest.cs");
    const slugController = readBack("src/ArquitecturaBaseMultitenant.Api/Controllers/Auth/TenantSlugAvailabilityController.cs");
    const slugModel = readBack("src/ArquitecturaBaseMultitenant.Application/Models/Auth/TenantSlugAvailabilityResponse.cs");
    const openApi = JSON.parse(readBack("docs/contracts/openapi.json")) as {
      paths: Record<string, Record<string, OpenApiOperation>>;
      components: { schemas: Record<string, { properties?: Record<string, { $ref?: string; type?: string }> }> };
    };
    const generated = readFront("src/shared/api/generated/schema.d.ts");
    const client = readFront("src/areas/public/auth/api/businessSignup.ts");
    const types = readFront("src/shared/api/types.ts");

    expect(controller).toContain('[Route("api/auth/business-signup")]');
    expect(controller).toContain("[AllowAnonymous]");
    expect(request).toContain("BusinessSignupTaxIdHttpRequest? TaxId");
    expect(request).toContain("string? Type, string? Number");
    expect(slugController).toContain("ProducesResponseType<TenantSlugAvailabilityResponse>");
    expect(slugModel).toContain("TenantSlugAvailability Availability");

    expect(openApi.paths["/api/auth/business-signup"].post.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/BusinessSignupHttpRequest");
    expect(openApi.components.schemas.BusinessSignupTaxIdHttpRequest.properties).toMatchObject({
      type: { type: ["null", "string"] }, number: { type: ["null", "string"] },
    });
    expect(openApi.paths["/api/public-site/slug-availability"].get.responses?.["200"].content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/TenantSlugAvailabilityResponse");
    expect(openApi.components.schemas.TenantSlugAvailabilityResponse.properties?.availability?.$ref)
      .toBe("#/components/schemas/TenantSlugAvailability");

    for (const route of ["/api/auth/business-signup", "/api/public-site/slug-availability"]) expect(generated).toContain(`"${route}"`);
    for (const type of ["BusinessSignupHttpRequest", "BusinessSignupTaxIdHttpRequest", "TenantSlugAvailabilityResponse", "TenantSlugAvailability"]) {
      expect(generated).toContain(`${type}:`);
    }
    expect(types).toContain("BusinessSignupRequest");
    expect(client).toContain('"/api/auth/business-signup"');
    expect(client).toContain("api.postCookie<BusinessSignupResponse>");
    expect(client).toContain("/api/public-site/slug-availability?");
  });
});
