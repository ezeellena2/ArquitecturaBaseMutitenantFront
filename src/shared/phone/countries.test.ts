import { createElement } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CountryReference } from "@/shared/referenceData/referenceData";
import { CountryFlag } from "./CountryFlag";
import { phoneCountryOptions } from "./countries";

function country(
  code: string,
  name: string,
  callingCode: string | null,
  sortOrder: number | null,
  isEnabled = true,
): CountryReference {
  return {
    code, name, callingCode, sortOrder, isEnabled,
    alpha3: `${code}X`, numericCode: "001",
    defaultCurrencyCode: null, defaultTimeZoneId: null,
  };
}

describe("países para teléfonos", () => {
  it("toma solo países seleccionables del catálogo y los ordena por SortOrder y nombre traducido", () => {
    const source = [
      country("MX", "México", "52", null),
      country("UY", "Uruguay", "598", 2),
      country("AR", "Argentina", "54", 1),
      country("US", "Estados Unidos", "1", null),
      country("BR", "Brasil", "55", 0, false),
      country("FR", "Francia", null, null),
    ];

    expect(phoneCountryOptions(source).map((item) => [item.code, item.callingCode]))
      .toEqual([["AR", "54"], ["UY", "598"], ["US", "1"], ["MX", "52"]]);
    expect(source[0].code).toBe("MX");
  });

  it("busca nombre sin tildes, código ISO y prefijo del catálogo", () => {
    const source = [
      country("MX", "México", "52", null),
      country("UY", "Uruguay", "598", null),
      country("AR", "Argentina", "54", null),
    ];

    expect(phoneCountryOptions(source, "mex").map((item) => item.code)).toEqual(["MX"]);
    expect(phoneCountryOptions(source, "  uy ").map((item) => item.code)).toEqual(["UY"]);
    expect(phoneCountryOptions(source, "+54").map((item) => item.code)).toEqual(["AR"]);
    expect(phoneCountryOptions(source, "598").map((item) => item.code)).toEqual(["UY"]);
  });

  it("respeta el filtro permitido y detecta un prefijo que no coincide con libphonenumber", () => {
    const source = [country("AR", "Argentina", "54", 1), country("UY", "Uruguay", "598", 2)];

    expect(phoneCountryOptions(source, "", ["UY"]).map((item) => item.code)).toEqual(["UY"]);
    expect(() => phoneCountryOptions([country("AR", "Argentina", "1", 1)])).toThrow();
  });

  it("carga la bandera SVG 3:2 solo cuando se monta el componente", async () => {
    const view = render(createElement(CountryFlag, { countryCode: "AR", title: "Argentina" }));

    expect(view.container.querySelector("svg")).toBeNull();
    await waitFor(() => expect(view.container.querySelector("svg")).not.toBeNull());
    const [, , width, height] = view.container.querySelector("svg")!.getAttribute("viewBox")!.split(" ").map(Number);
    expect(width / height).toBeCloseTo(1.5);
    expect(view.container.textContent).not.toContain("🇦🇷");
  });
});
