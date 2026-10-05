import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");
const readBack = (file: string) => readFileSync(path.join(back, file), "utf8");
const readFront = (file: string) => readFileSync(path.join(front, file), "utf8");

describe("contrato de auditoría de organización entre back y front", () => {
  it("publica nombre afectado y empresa en los campos consumidos por Auditoría", () => {
    const models = readBack("src/ArquitecturaBaseMultitenant.Application/Models/Auditing/OrganizationAuditModels.cs");
    // Los textos de cada entrada los arma OrganizationAuditEntryBuilder (tandas 4f y 4g del back), en el idioma de quien mira.
    const builder = readBack("src/ArquitecturaBaseMultitenant.Application/Services/Auditing/OrganizationAuditEntryBuilder.cs");
    const reader = readBack("src/ArquitecturaBaseMultitenant.Infrastructure/Persistence/Readers/OrganizationAuditReader.cs");
    const httpQuery = readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Organization/OrganizationAuditHttpQuery.cs");
    const openApi = JSON.parse(readBack("docs/contracts/openapi.json")) as {
      paths: Record<string, Record<string, { parameters?: { name: string }[]; responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }> }>>;
      components: { schemas: Record<string, { properties?: Record<string, unknown> }> };
    };
    const generated = readFront("src/shared/api/generated/schema.d.ts");
    const types = readFront("src/shared/api/types.ts");
    const client = readFront("src/areas/business/audit/api/audit.ts");
    const page = readFront("src/areas/business/audit/pages/AuditPage.tsx");

    expect(models).toContain("string? AffectedDisplayName, string? CompanyName");
    expect(models).toContain("string? AffectedDisplayName, string WhereText");
    expect(reader).toContain("displayData[entry.Id].AffectedDisplayName");
    expect(reader).toContain("displayData[entry.Id].CompanyName");
    expect(builder).toContain("AuditTexts.Summary(row.Action, row.EntityType, affected, Variant(row, changes))");
    expect(builder).toContain("row.CompanyName ?? AuditTexts.WholeOrganization()");
    // Tablero Auditoria-Org: «Roles en la empresa: Sin roles → Solo lectura»; el detalle llega por nombre, sin ids.
    expect(builder).toContain("AuditTexts.NoRoles()");

    const auditRoute = openApi.paths["/api/organization/audit"];
    expect(auditRoute.get.responses?.["200"].content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/CursorResultOfOrganizationAuditEntryResponse");
    // «Quién» con «Sistema» y «Plataforma» (decisión 76 del back): sin id, se filtran por su tipo.
    expect(httpQuery).toContain("string? ActorKind = null");
    expect(auditRoute.get.parameters?.map((parameter) => parameter.name)).toContain("ActorKind");
    expect(generated).toContain("ActorKind?: string;");
    expect(client).toContain("actorKind?: AuditActorKind;");
    expect(page).toContain("actorKind");
    expect(openApi.components.schemas.OrganizationAuditEntryResponse.properties)
      .toHaveProperty("affectedDisplayName");
    expect(openApi.components.schemas.OrganizationAuditEntryResponse.properties).toHaveProperty("whereText");

    expect(generated).toContain('"/api/organization/audit"');
    expect(generated).toContain("OrganizationAuditEntryResponse:");
    expect(generated).toContain("affectedDisplayName?: null | string;");
    expect(generated).toContain("whereText: string;");
    expect(types).toContain('export type OrganizationAuditEntryResponse = ApiSchemas["OrganizationAuditEntryResponse"]');
    expect(client).toContain("Promise<OrganizationAuditCursorResponse>");
    expect(page).toContain("row.whereText");
    // El nombre afectado llega en actionText («Cambió los roles de Tomás Acosta»), como el tablero Auditoria-Org.
    expect(page).toContain("row.actionText");
    expect(page).toContain("selected.actorEmail");
  });
});
