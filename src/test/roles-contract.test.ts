import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");
const readBack = (file: string) => readFileSync(path.join(back, file), "utf8");
const readFront = (file: string) => readFileSync(path.join(front, file), "utf8");

describe("contrato de roles entre back y front", () => {
  it("publica roles por organización con permisos y versión, y genera el mismo esquema", () => {
    const controller = readBack("src/ArquitecturaBaseMultitenant.Api/Controllers/Organization/RolesController.cs");
    const permissionController = readBack("src/ArquitecturaBaseMultitenant.Api/Controllers/Organization/PermissionsController.cs");
    const requests = readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Organization/RolesHttpRequests.cs");
    const errors = readBack("src/ArquitecturaBaseMultitenant.Application/Resources/Errors.resx");
    const openapi = JSON.parse(readBack("docs/contracts/openapi.json")) as {
      paths: Record<string, Record<string, {
        parameters?: Array<{ name: string; in: string }>;
        requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> };
        responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string; format?: string; items?: { $ref?: string } } }> }>;
      }>>;
      components: { schemas: Record<string, { properties?: Record<string, unknown> }> };
    };
    const schema = readFront("src/shared/api/generated/schema.d.ts");

    expect(controller).toContain('[Route("api/roles")]');
    expect(controller).toContain("[Access(Access.Business)]");
    expect(controller).toContain("[HasPermission(Permissions.Roles.Read)]");
    expect(controller).toContain("[HasPermission(Permissions.Roles.Manage)]");
    expect(controller).toContain("[Idempotent]");
    expect(permissionController).toContain('[Route("api/permissions")]');
    expect(requests).toContain("int? Page, int? PageSize, string? Sort, string? Search");
    expect(requests).toContain("RoleScopeFilter? Scope");
    expect(requests).toContain("uint? Version");

    expect(openapi.paths["/api/permissions"].get.responses?.["200"].content?.["application/json"]?.schema?.items?.$ref)
      .toBe("#/components/schemas/PermissionGroupResponse");
    expect(openapi.paths["/api/roles/paged"].get.responses?.["200"].content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/PagedResultOfRoleResponse");
    expect(openapi.paths["/api/roles/paged"].get.parameters?.some((parameter) => parameter.name === "Scope")).toBe(true);
    expect(openapi.paths["/api/roles"].post.responses?.["201"].content?.["application/json"]?.schema?.format)
      .toBe("uuid");
    expect(openapi.paths["/api/roles/{id}"].put.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/UpdateRoleHttpRequest");
    expect(openapi.paths["/api/roles/{id}"].delete.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/DeleteRoleHttpRequest");
    expect(openapi.components.schemas.RoleResponse.properties).toHaveProperty("version");
    expect(openapi.components.schemas.UpdateRoleHttpRequest.properties).toHaveProperty("version");
    expect(openapi.components.schemas.PermissionGroupResponse.properties).toHaveProperty("permissions");

    for (const route of ["/api/permissions", "/api/roles", "/api/roles/paged", "/api/roles/{id}"]) {
      expect(schema).toContain(`"${route}"`);
    }
    for (const name of ["RoleResponse", "PermissionGroupResponse", "UpdateRoleHttpRequest", "DeleteRoleHttpRequest"]) {
      expect(schema).toContain(`${name}:`);
    }
    for (const code of ["Roles.Role.NotFound", "Roles.Role.SystemRoleCannotChange", "General.ConcurrencyConflict"]) {
      expect(errors).toContain(code);
    }
  });
});
