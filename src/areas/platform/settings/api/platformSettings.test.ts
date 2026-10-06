import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { fetchPlatformSettings, updatePlatformSettings } from "./platformSettings";

const backendRoot = path.resolve(import.meta.dirname, "../../../../../../ArquitecturaBaseMutitenant");
const contractSource = path.join(backendRoot, "docs/contracts/openapi.json");
const hasBackend = existsSync(backendRoot);
if (!hasBackend && process.env.CI !== "true") {
  throw new Error("El repo hermano ArquitecturaBaseMutitenant es obligatorio para comprobar el contrato de Configuración.");
}
if (!hasBackend) {
  console.warn("Se omite el contrato de Configuración en CI: falta el repo hermano ArquitecturaBaseMutitenant.");
}

describe("API de Configuración de Plataforma", () => {
  it("GET sin filtros y PUT cinco campos/version/reason, sin Idempotency-Key", async () => {
    let sent: unknown; let key: string | null = "unexpected"; let url: URL | undefined;
    server.use(http.get("/api/platform/settings", ({ request }) => { url = new URL(request.url); return HttpResponse.json(platformSettingsFixture); }),
      http.put("/api/platform/settings", async ({ request }) => { sent = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 27 }); }));
    expect(await fetchPlatformSettings()).toEqual(platformSettingsFixture); expect(url?.search).toBe("");
    const request = { ...platformSettingsFixture, reason: "Revisamos el registro." };
    expect(await updatePlatformSettings(request)).toEqual({ version: 27 }); expect(sent).toEqual(request); expect(key).toBeNull();
  });
  it.skipIf(!hasBackend)("contrato real con cinco campos/version/reason, sin gracia ni POST", () => {
    const contract = JSON.parse(readFileSync(contractSource, "utf8")) as {
      paths: Record<string, Record<string, { responses: Record<string, unknown> }>>;
      components: { schemas: Record<string, { properties: Record<string, unknown> }> };
    };
    expect(Object.keys(contract.components.schemas.UpdatePlatformSettingsHttpRequest.properties).sort()).toEqual(["businessSignup", "consumerSignup", "maxOwnedOrganizations", "reason", "salesEmail", "supportEmail", "version"]);
    expect(Object.keys(contract.paths["/api/platform/settings"]).sort()).toEqual(["get", "put"]);
    expect(contract.paths["/api/platform/settings"].put.responses).toHaveProperty("200");
  });
});
