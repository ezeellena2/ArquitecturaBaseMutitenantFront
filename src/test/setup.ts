import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
import * as axeMatchers from "vitest-axe/matchers";
import type { AxeMatchers } from "vitest-axe";
import { configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, expect } from "vitest";
import i18n from "@/shared/i18n";
import { server } from "./mocks/server";

declare module "vitest" {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> extends AxeMatchers {
    // vitest-axe 0.1.0 amplía el namespace Vi de Vitest anterior; Vitest 5 amplía este.
  }
}

expect.extend(axeMatchers);

// Cada llamada HTTP debe tener un handler explícito. Los handlers de sesión llegan en E3.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Los namespaces se descubren por archivos. i18n queda sin cultura hasta que
// shared/referenceData entregue Cultures (o el test configure su fixture).
const localeModules = import.meta.glob("../locales/*/*.json");
const namespaces = [...new Set(Object.keys(localeModules).map((path) => path.split("/").at(-1)?.replace(".json", "") ?? ""))];
beforeEach(async () => {
  if (i18n.isInitialized) await i18n.loadNamespaces(namespaces);
});

if (!globalThis.matchMedia) {
  globalThis.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// JSDOM no implementa la captura de puntero usada por los selectores Radix.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

configure({ asyncUtilTimeout: 3000 });
