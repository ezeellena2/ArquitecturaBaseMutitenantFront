import { readFileSync } from "node:fs";
import path from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { fetchLegalDocuments, publishLegalDocument } from "./legalDocuments";

describe("API legal de Plataforma", () => {
  it("GET no fabrica filtros y POST DateOnly/key devuelve 201 real sin motivo", async () => {
    let url: URL | undefined; let sent: unknown; let key: string | null = null;
    server.use(http.get("/api/platform/legal-documents", ({ request }) => { url = new URL(request.url); return HttpResponse.json([]); }),
      http.post("/api/platform/legal-documents", async ({ request }) => { sent = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ id: "new", version: 13 }, { status: 201 }); }));
    expect(await fetchLegalDocuments()).toEqual([]); expect(url?.search).toBe("");
    const request = { kind: "Terms" as const, effectiveOn: "2026-11-01", contents: [{ culture: "es-AR", text: "Términos" }, { culture: "en-US", text: "Terms" }] };
    expect(await publishLegalDocument(request, "native-key")).toEqual({ id: "new", version: 13 }); expect(sent).toEqual(request); expect(key).toBe("native-key");
  });
  it("contrato productor exige sólo kind/effectiveOn/contents y éxito201 id/version", () => {
    const contract = JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../../../../../ArquitecturaBaseMutitenant/docs/contracts/openapi.json"), "utf8")) as {
      paths: Record<string, { post: { responses: Record<string, { content: Record<string, { schema: { $ref: string } }> }> } }>;
      components: { schemas: Record<string, { properties: Record<string, unknown> }> };
    };
    expect(Object.keys(contract.components.schemas.PublishLegalDocumentHttpRequest.properties).sort()).toEqual(["contents", "effectiveOn", "kind"]);
    expect(Object.keys(contract.components.schemas.PublishedLegalDocumentResponse.properties).sort()).toEqual(["id", "version"]);
    expect(contract.paths["/api/platform/legal-documents"].post.responses["201"].content["application/json"].schema.$ref).toBe("#/components/schemas/PublishedLegalDocumentResponse");
  });
});
