import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import type { FormCatalogFieldDetail, FormCatalogItemRow } from "../api/types";
import { useCatalogFieldSources } from "./useCatalogFieldSources";

const localidad = (index: number): FormCatalogItemRow => ({ id: `l-${String(index).padStart(4, "0")}`, position: index, text: `Localidad ${index}`, code: `L${index}`,
  detail: null, value: null, isActive: true, textRepeated: false, fields: {} });
const field = (id: string): FormCatalogFieldDetail => ({ id, key: id, name: id, type: "Catalog", sourceCatalogId: "c-loc", sourceCatalogName: "Localidades",
  required: false, unique: false, isActive: true, valuesCount: 0 });

describe("useCatalogFieldSources", () => {
  it("con más de 100 opciones de una fuente a la vista, las pide de a 100 y dice el texto de todas, también entre dos campos con la misma fuente", async () => {
    const asked: number[] = [];
    server.use(http.get("/api/organization/forms/catalogs/c-loc/items", ({ request }) => {
      const ids = new URL(request.url).searchParams.getAll("ids");
      asked.push(ids.length);
      const items = ids.map((id) => localidad(Number(id.slice(2))));
      return HttpResponse.json({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
    }));
    const rows = Array.from({ length: 250 }, (_, index) => ({ draft: { fields: { "f-origen": localidad(index + 1).id, "f-destino": localidad(index + 1).id } } }));
    rows.push({ draft: { fields: { "f-origen": localidad(1).id, "f-destino": localidad(300).id } } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => useCatalogFieldSources([field("f-origen"), field("f-destino")], rows), { wrapper });

    await waitFor(() => expect(result.current(localidad(250).id)?.text).toBe("Localidad 250"));
    await waitFor(() => expect(result.current(localidad(300).id)?.text).toBe("Localidad 300"));
    expect(result.current(localidad(1).id)?.text).toBe("Localidad 1");
    expect(asked.sort((a, b) => a - b)).toEqual([51, 100, 100]);
  });
});
