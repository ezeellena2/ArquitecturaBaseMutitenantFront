import { expect, it } from "vitest";
import { toSearch } from "./toSearch";

it("serializa filtros conservando cero, false y texto, y omite valores ausentes", () => {
  expect(toSearch({ search: "a & b", page: 0, flag: false, empty: "", absent: undefined, nil: null }))
    .toBe("search=a+%26+b&page=0&flag=false");
  expect(toSearch({}, true)).toBe("");
  expect(toSearch({ page: 1 }, true)).toBe("?page=1");
});

it("repite la clave por cada elemento de una lista y omite los vacíos (Ids de las opciones, E13)", () => {
  expect(toSearch({ page: 1, ids: ["a", "", "b & c"] })).toBe("page=1&ids=a&ids=b+%26+c");
  expect(toSearch({ ids: [] }, true)).toBe("");
});
