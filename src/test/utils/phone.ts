import { vi } from "vitest";

/// Simula un teléfono (390 px): `useMediaQuery("(max-width: 767px)")` da verdadero. Devuelve cómo deshacerlo.
export function asPhone(): () => void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(max-width: 767px)", media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }));
  return () => vi.unstubAllGlobals();
}
