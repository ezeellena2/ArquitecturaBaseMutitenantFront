import type { components } from "./generated/schema";

type PageSize = NonNullable<components["schemas"]["PagedRequest"]["pageSize"]>;

/** Una sola lista visible; el test exige paridad con PagedRequest del OpenAPI. */
export const pageSizes = [10, 20, 50, 100] as const satisfies readonly PageSize[];
export const defaultPageSize = pageSizes[0];

export function isPageSize(value: number): value is PageSize {
  return pageSizes.some((size) => size === value);
}
