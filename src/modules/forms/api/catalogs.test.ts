import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { fetchCatalogItems, fetchCatalogTemplate } from "./catalogs";

const base = "/api/organization/forms/catalogs";

// E13: el filtro `ids` de las opciones (para nombrar las de una fuente) y `catalogId` de la plantilla.
describe("Contrato HTTP de los catálogos (E13)", () => {
  it("las opciones piden `ids` repetido, una vez por opción, junto a la página y el estado", async () => {
    const urls: URL[] = [];
    server.use(http.get(`${base}/c-zonas/items`, ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false });
    }));
    await fetchCatalogItems("c-zonas", { page: 1, pageSize: 100, status: "All", ids: ["i-norte", "i-sur"] });
    await fetchCatalogItems("c-zonas", { page: 1, pageSize: 20 });
    expect(urls[0].searchParams.getAll("ids")).toEqual(["i-norte", "i-sur"]);
    expect(urls[0].searchParams.get("status")).toBe("All");
    expect(urls[1].searchParams.has("ids")).toBe(false);
  });

  it("la plantilla pide `catalogId` solo si se lo pasa", async () => {
    const urls: URL[] = [];
    server.use(http.get(`${base}/template`, ({ request }) => { urls.push(new URL(request.url)); return new HttpResponse(new Blob(["xlsx"])); }));
    await fetchCatalogTemplate("Text", "c-prov");
    await fetchCatalogTemplate("WholeNumber");
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ valueType: "Text", catalogId: "c-prov" });
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ valueType: "WholeNumber" });
  });
});
