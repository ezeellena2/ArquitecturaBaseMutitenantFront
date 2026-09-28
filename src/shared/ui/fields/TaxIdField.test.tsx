import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { TaxIdField, type TaxIdDraft } from "./TaxIdField";

function renderField() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onValidityChange = vi.fn();
  function Harness() {
    const [value, setValue] = useState<TaxIdDraft | null>(null);
    return <>
      <FormField label="Número fiscal"><TaxIdField value={value} onChange={setValue}
        onValidityChange={onValidityChange} typeLabel="Tipo de identificación" /></FormField>
      <output>{JSON.stringify(value)}</output>
    </>;
  }
  render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
  return { onValidityChange };
}

describe("TaxIdField", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
    const fixture = referenceDataFixture();
    const cuit = fixture.taxIdTypes[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      taxIdTypes: [
        cuit,
        { ...cuit, code: "AR-CUIL", label: "CUIL", name: "CUIL", appliesTo: "Person" },
        { ...cuit, code: "AR-DNI", label: "DNI", name: "DNI", validatorKey: "ar-dni-length", isEnabled: false },
      ],
    })));
  });

  it("ofrece solo tipos fiscales habilitados provenientes del catálogo", async () => {
    renderField();
    const select = screen.getByRole("combobox", { name: "Tipo de identificación" });
    await waitFor(() => expect(select).toBeEnabled());
    expect(Array.from((select as HTMLSelectElement).options, (option) => option.text)).toEqual([
      "Tipo de identificación", "CUIL", "CUIT",
    ]);
    expect(screen.queryByRole("option", { name: "DNI" })).not.toBeInTheDocument();
  });

  it("emite código completo más número sin separadores y valida con stdnum", async () => {
    const { onValidityChange } = renderField();
    const select = screen.getByRole("combobox", { name: "Tipo de identificación" });
    const input = screen.getByRole("textbox", { name: "Número fiscal" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(select, { target: { value: "AR-CUIT" } });
    fireEvent.change(input, { target: { value: "20-12345678-6" } });
    expect(input).toHaveValue("20123456786");
    expect(screen.getByRole("status")).toHaveTextContent('"type":"AR-CUIT","number":"20123456786"');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(input).not.toHaveAttribute("aria-invalid", "true");

    fireEvent.change(input, { target: { value: "20-12345678-7" } });
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("revalida el mismo número al cambiar de tipo", async () => {
    const { onValidityChange } = renderField();
    const select = screen.getByRole("combobox", { name: "Tipo de identificación" });
    const input = screen.getByRole("textbox", { name: "Número fiscal" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(select, { target: { value: "AR-CUIT" } });
    fireEvent.change(input, { target: { value: "20-12345678-6" } });
    fireEvent.change(select, { target: { value: "AR-CUIL" } });
    expect(screen.getByRole("status")).toHaveTextContent('"type":"AR-CUIL","number":"20123456786"');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });

  it("usa el algoritmo stdnum indicado por un tipo DNI habilitado en el catálogo", async () => {
    const fixture = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      taxIdTypes: [{
        ...fixture.taxIdTypes[0], code: "AR-DNI", label: "DNI", name: "DNI",
        validatorKey: "ar-dni-length", mask: "99999999",
      }],
    })));
    const { onValidityChange } = renderField();
    const select = screen.getByRole("combobox", { name: "Tipo de identificación" });
    const input = screen.getByRole("textbox", { name: "Número fiscal" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(select, { target: { value: "AR-DNI" } });
    fireEvent.change(input, { target: { value: "12.345.678" } });
    expect(screen.getByRole("status")).toHaveTextContent('"type":"AR-DNI","number":"12345678"');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });
});
