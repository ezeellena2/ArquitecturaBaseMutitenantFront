import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
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

  it("conserva tarifas técnicas de seis decimales al salir y rechaza siete", async () => {
    function Tariff() {
      const [value, setValue] = useState({ amount: 0.125, currency: "ARS" } as { amount: number; currency: string } | null);
      return <FormField label="Tarifa"><MoneyField precision="technical-tariff" value={value} onChange={setValue} /></FormField>;
    }
    render(<AppProviders><Tariff /></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Tarifa" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("0,125000");
    fireEvent.change(input, { target: { value: "0,123456" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("0,123456");
    fireEvent.change(input, { target: { value: "0,1234567" } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue("0,1234567");
  });

  it("interpreta un decimal según Cultures y no emite una cadena localizada", async () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<AppProviders><FormField label="Cantidad"><NumberField value={1234.5} onChange={onChange}
      onValidityChange={onValidityChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Cantidad" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("1.234,5");
    fireEvent.change(input, { target: { value: "1.234,75" } });
    expect(onChange).toHaveBeenLastCalledWith(1234.75);
    fireEvent.change(input, { target: { value: "1,234.75" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un número válido.");
    fireEvent.change(input, { target: { value: "1.234,75" } });
    expect(onChange).toHaveBeenLastCalledWith(1234.75);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("emite Money con moneda del catálogo y respeta sus unidades menores", async () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<AppProviders><FormField label="Monto"><MoneyField value={null} onChange={onChange}
      onValidityChange={onValidityChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Monto" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveTextContent("(ARS)");
    fireEvent.change(input, { target: { value: "1.234,50" } });
    expect(onChange).toHaveBeenLastCalledWith({ amount: 1234.5, currency: "ARS" });
    fireEvent.change(input, { target: { value: "1.234,567" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un monto válido");
    fireEvent.change(input, { target: { value: "1.234,50" } });
    expect(onChange).toHaveBeenLastCalledWith({ amount: 1234.5, currency: "ARS" });
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveTextContent("(CLP)");
    fireEvent.change(input, { target: { value: "1.234" } });
    expect(onChange).toHaveBeenLastCalledWith({ amount: 1234, currency: "CLP" });
    fireEvent.change(input, { target: { value: "1.234,5" } });
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
  });
  it("USD ordinario rechaza tres decimales y una tarifa exige moneda habilitada", async () => {
    const fixture = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({ ...fixture, currencies: [
      ...fixture.currencies, { ...fixture.currencies[0], code: "USD", name: "Dólar", displaySymbol: "USD", minorUnits: 2 },
      { ...fixture.currencies[0], code: "XXX", name: "Deshabilitada", isEnabled: false },
    ] })));
    const ordinary = vi.fn(); const tariff = vi.fn();
    render(<AppProviders><FormField label="Presupuesto"><MoneyField currencyCode="USD" value={null} onChange={ordinary} /></FormField>
      <FormField label="Tarifa"><MoneyField currencyCode="XXX" precision="technical-tariff" value={null} onChange={tariff} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Presupuesto" }); await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "0,12" } }); expect(ordinary).toHaveBeenLastCalledWith({ amount: 0.12, currency: "USD" });
    fireEvent.change(input, { target: { value: "0,123" } }); expect(ordinary).toHaveBeenLastCalledWith(null);
    fireEvent.change(screen.getByRole("textbox", { name: "Tarifa" }), { target: { value: "0,123456" } }); expect(tariff).toHaveBeenLastCalledWith(null);
  });

  it("no emite un importe que perdería precisión al pasarlo a Number", async () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<AppProviders><FormField label="Monto"><MoneyField value={null} onChange={onChange}
      onValidityChange={onValidityChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Monto" });
    await waitFor(() => expect(input).toBeEnabled());

    fireEvent.change(input, { target: { value: "123.456.789.012.345,67" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
    fireEvent.blur(input);
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un monto válido");
  });
});
