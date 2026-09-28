import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { MoneyField } from "./MoneyField";
import { NumberField } from "./NumberField";

describe("NumberField y MoneyField", () => {
  beforeEach(() => { queryClient.clear(); resetHttpClient(); localStorage.clear(); });

  it("interpreta un decimal según Cultures y no emite una cadena localizada", async () => {
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Cantidad"><NumberField value={1234.5} onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Cantidad" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("1.234,5");
    fireEvent.change(input, { target: { value: "1.234,75" } });
    expect(onChange).toHaveBeenLastCalledWith(1234.75);
    fireEvent.change(input, { target: { value: "1,234.75" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("emite Money con moneda del catálogo y respeta sus unidades menores", async () => {
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Monto"><MoneyField value={null} onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Monto" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveValue("ARS");
    fireEvent.change(input, { target: { value: "1.234,50" } });
    expect(onChange).toHaveBeenLastCalledWith({ amount: 1234.5, currency: "ARS" });
    fireEvent.change(input, { target: { value: "1.234,567" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("usa una precisión de cero decimales tomada de Currencies", async () => {
    const fixture = referenceDataFixture();
    const custom = {
      ...fixture,
      currencies: [...fixture.currencies, {
        ...fixture.currencies[0], code: "CLP", numericCode: "152", minorUnits: 0,
        displaySymbol: "CLP", name: "Peso chileno",
      }],
      countries: fixture.countries.map((country) => ({ ...country, defaultCurrencyCode: "CLP" })),
    };
    server.use(http.get("/api/reference-data", () => HttpResponse.json(custom)));
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Monto"><MoneyField value={null} onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Monto" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveValue("CLP");
    fireEvent.change(input, { target: { value: "1.234" } });
    expect(onChange).toHaveBeenLastCalledWith({ amount: 1234, currency: "CLP" });
    fireEvent.change(input, { target: { value: "1.234,5" } });
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
  });
});
