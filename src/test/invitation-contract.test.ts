import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const front = path.resolve(import.meta.dirname, "../..");
const back = path.resolve(front, "../ArquitecturaBaseMutitenant");
const readBack = (file: string) => readFileSync(path.join(back, file), "utf8");
const readFront = (file: string) => readFileSync(path.join(front, file), "utf8");

describe("contrato de invitaciones entre back y front", () => {
  it("publica preview/accept en JSON y consume las mismas rutas, estados y errores", () => {
    const controller = readBack("src/ArquitecturaBaseMultitenant.Api/Controllers/Auth/InvitationsController.cs");
    const previewRequest = readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Auth/PreviewInvitationHttpRequest.cs");
    const acceptRequest = readBack("src/ArquitecturaBaseMultitenant.Api/Contracts/Auth/AcceptInvitationHttpRequest.cs");
    const errors = readBack("src/ArquitecturaBaseMultitenant.Application/Resources/Errors.resx");
    const openapiSource = readBack("docs/contracts/openapi.json");
    const openapi = JSON.parse(openapiSource) as {
      paths: Record<string, { post?: { requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> } } }>;
      components: { schemas: Record<string, { properties?: Record<string, unknown>; enum?: unknown[] }> };
    };
    const contract = readFront("src/shared/api/invitationContract.ts");
    const schema = readFront("src/shared/api/generated/schema.d.ts");

    expect(controller).toContain("[AllowAnonymous]");
    expect(controller).toContain('[HttpPost("preview")]');
    expect(controller).toContain('[HttpPost("accept")]');
    expect(controller).toContain("[Idempotent]");
    expect(previewRequest).toContain("string? Token");
    expect(previewRequest).toContain("nameof(PreviewInvitationHttpRequest)");
    expect(acceptRequest).toContain("string? Token, bool AcceptedTerms");
    expect(acceptRequest).toContain("nameof(AcceptInvitationHttpRequest)");

    expect(openapi.paths["/api/invitations/preview"].post?.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/PreviewInvitationHttpRequest");
    expect(openapi.paths["/api/invitations/accept"].post?.requestBody?.content?.["application/json"]?.schema?.$ref)
      .toBe("#/components/schemas/AcceptInvitationHttpRequest");
    expect(openapi.components.schemas.PreviewInvitationHttpRequest.properties).toHaveProperty("token");
    expect(openapi.components.schemas.AcceptInvitationHttpRequest.properties).toHaveProperty("token");
    expect(openapi.components.schemas.AcceptInvitationHttpRequest.properties).toHaveProperty("acceptedTerms");
    expect(openapi.components.schemas.AcceptInvitationResponse.properties).toHaveProperty("organizationId");
    expect(openapi.components.schemas.InvitationPreviewState.enum).toEqual([
      "NoAccount", "SignInRequired", "Ready", "WrongSession", "Expired", "Invalid", "OrganizationSuspended", "Accepted",
    ]);
    expect(schema).toContain('"/api/invitations/preview"');
    expect(schema).toContain('"/api/invitations/accept"');
    expect(schema).toContain('InvitationPreviewState: "NoAccount" | "SignInRequired" | "Ready" | "WrongSession" | "Expired" | "Invalid" | "OrganizationSuspended" | "Accepted"');
    for (const code of ["Invitations.Invitation.Invalid", "Invitations.Invitation.Expired", "Invitations.Invitation.AlreadyUsed",
      "Invitations.Invitation.SignInRequired", "Invitations.Invitation.WrongAccount"]) {
      expect(errors).toContain(code);
    }

    for (const value of ['/api/invitations/preview', '/api/invitations/accept', 'page: "/invitacion"']) {
      expect(contract).toContain(value);
    }
    expect(contract).toContain("api.post<InvitationPreviewResponse>(invitationPaths.preview, { token }");
    expect(contract).toContain("api.post<AcceptInvitationResponse>(invitationPaths.accept, request");
    expect(contract).toContain('"RequestVerificationToken"');
    expect(contract).toContain('"Idempotency-Key"');
    expect(readBack("src/ArquitecturaBaseMultitenant.Application/Services/Invitations/InvitationDeliveryIssuer.cs"))
      .toContain('"/invitacion"');
    expect(readBack("src/ArquitecturaBaseMultitenant.Application/Services/Invitations/InvitationSessionRestorer.cs"))
      .toContain("accepted.OrganizationId");
  });
});
