import { expect, it } from "vitest";
import { toSearch } from "./toSearch";

it("serializa filtros conservando cero, false y texto, y omite valores ausentes", () => {
  expect(toSearch({ search: "a & b", page: 0, flag: false, empty: "", absent: undefined, nil: null }))
    .toBe("search=a+%26+b&page=0&flag=false");
  expect(toSearch({}, true)).toBe("");
  expect(toSearch({ page: 1 }, true)).toBe("?page=1");
});
