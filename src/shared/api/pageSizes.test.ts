import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { defaultPageSize, pageSizes } from "./pageSizes";

const source = path.resolve(import.meta.dirname, "../../../../ArquitecturaBaseMutitenant/docs/contracts/openapi.json");
const available = existsSync(source);

if (!available && !process.env.CI) {
  throw new Error("El repo hermano ArquitecturaBaseMutitenant es obligatorio para comprobar tamaños de página.");
}
if (!available) {
  console.warn("Se omite la paridad cruzada de tamaños de página en CI: falta el repo hermano ArquitecturaBaseMutitenant.");
}

describe("tamaños de página", () => {
  it.skipIf(!available)("coinciden en orden con PagedRequest del OpenAPI", () => {
    const contract = JSON.parse(readFileSync(source, "utf8")) as {
      components: { schemas: { PagedRequest: { properties: { pageSize: { enum: number[] } } } } };
    };
    expect(pageSizes).toEqual(contract.components.schemas.PagedRequest.properties.pageSize.enum);
    expect(new Set(pageSizes).size).toBe(pageSizes.length);
    expect(defaultPageSize).toBe(pageSizes[0]);
  });
});
