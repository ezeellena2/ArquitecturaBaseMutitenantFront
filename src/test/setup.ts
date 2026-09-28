import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
import * as axeMatchers from "vitest-axe/matchers";
import type { AxeMatchers } from "vitest-axe";
import { expect } from "vitest";

declare module "vitest" {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> extends AxeMatchers {
    // vitest-axe 0.1.0 amplía el namespace Vi de Vitest anterior; Vitest 5 amplía este.
  }
}

expect.extend(axeMatchers);
