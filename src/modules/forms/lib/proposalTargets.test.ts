import { describe, expect, it, vi } from "vitest";
import type { CatalogItemsQuery } from "../api/catalogs";
import type { FormCatalogItemRow } from "../api/types";
import { findProposalTargets } from "./proposalTargets";

const row = (n: number): FormCatalogItemRow =>
  ({ id: `i-${n}`, position: n, text: `Opción ${n}`, code: `O${n}`, detail: null, value: null, isActive: true, textRepeated: false });
const catalog = (total: number) => Array.from({ length: total }, (_, index) => row(index + 1));

/** El servidor de mentira: busca por texto o da la página, de a 100 como mucho. */
function server(rows: FormCatalogItemRow[]) {
  return vi.fn(async ({ page = 1, pageSize = 10, search }: CatalogItemsQuery) => {
    const matching = search ? rows.filter((item) => item.text.includes(search)) : rows;
    const items = matching.slice((page - 1) * pageSize, page * pageSize);
    return { items, page, pageSize, totalCount: matching.length, totalPages: Math.ceil(matching.length / pageSize), hasPrevious: page > 1, hasNext: page * pageSize < matching.length };
  });
}

describe("las opciones que toca una propuesta (cuotas)", () => {
  it("con pocos textos, busca una vez por texto", async () => {
    const rows = catalog(1000);
    const fetchPage = server(rows);
    const found = await findProposalTargets([{ itemId: "i-7", label: "Opción 7" }, { itemId: "i-900", label: "Opción 900" }], rows.length, fetchPage);
    expect(found.map((item) => item.id).sort()).toEqual(["i-7", "i-900"]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("con 150 opciones de textos distintos en un catálogo de 300, recorre sus tres páginas en lugar de pedir 150 veces", async () => {
    const rows = catalog(300);
    const fetchPage = server(rows);
    const targets = rows.slice(0, 150).map((item) => ({ itemId: item.id, label: item.text }));
    const found = await findProposalTargets(targets, rows.length, fetchPage);
    expect(found).toHaveLength(150);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage.mock.calls.every(([query]) => query.pageSize === 100 && query.search === undefined)).toBe(true);
  });

  it("nunca pide más de cuatro a la vez", async () => {
    const rows = catalog(2000);
    let open = 0, most = 0;
    const fetchPage = vi.fn(async (query: CatalogItemsQuery) => {
      open += 1; most = Math.max(most, open);
      // Sin tiempo real (tests): una vuelta de promesas deja que los demás pedidos arranquen antes de que este termine.
      await Promise.resolve();
      open -= 1;
      return server(rows)(query);
    });
    const targets = rows.filter((_, index) => index % 10 === 9).map((item) => ({ itemId: item.id, label: item.text }));
    await findProposalTargets(targets, rows.length, fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(20);
    expect(most).toBeLessThanOrEqual(4);
  });
});
