import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { CurrencySelect } from "./CurrencySelect";

function renderSelect() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Harness() {
    const [value, setValue] = useState("");
    return <><FormField label="Moneda"><CurrencySelect value={value} onChange={setValue} placeholder="Elegí una moneda" /></FormField><output>{value}</output></>;
  }
  return render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
}

describe("CurrencySelect", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
  });

  it("muestra solo monedas habilitadas, con su código y ordenadas por SortOrder y nombre", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture();
    const peso = fixture.currencies[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      currencies: [
        { ...peso, code: "USD", name: "Dólar", sortOrder: null },
        { ...peso, code: "EUR", name: "Euro", sortOrder: 2 },
        { ...peso, code: "CLP", name: "Peso chileno", isEnabled: false, sortOrder: 0 },
        peso,
      ],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Moneda" });
    await waitFor(() => expect(select).toBeEnabled());
    await user.click(select);
    // Tablero Configuración: «Peso argentino (ARS)».
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Peso argentino (ARS)", "Euro (EUR)", "Dólar (USD)",
    ]);
    await user.click(screen.getByRole("option", { name: "Dólar (USD)" }));
    expect(screen.getByRole("status")).toHaveTextContent("USD");
    expect(select).toHaveTextContent("Dólar (USD)");
  });

  it("con más de 10 monedas busca por nombre o código sin tildes", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture();
    const peso = fixture.currencies[0];
    const others = ["BRL", "CLP", "COP", "EUR", "GBP", "JPY", "MXN", "PEN", "PYG", "UYU"]
      .map((code, index) => ({ ...peso, code, name: `Moneda ${index + 1}`, sortOrder: null }));
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      currencies: [peso, { ...peso, code: "USD", name: "Dólar", sortOrder: null }, ...others],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Moneda" });
    await waitFor(() => expect(select).toBeEnabled());
    await user.click(select);
    await user.type(await screen.findByRole("searchbox", { name: "Buscar moneda" }), "dolar");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Dólar (USD)"]);
    await user.clear(screen.getByRole("searchbox", { name: "Buscar moneda" }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar moneda" }), "ars");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Peso argentino (ARS)"]);
  });

  it("deja visible el estado de carga hasta recibir el catálogo", async () => {
    let release: (() => void) | undefined;
    server.use(http.get("/api/reference-data", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json(referenceDataFixture());
    }));
    renderSelect();

    expect(screen.getByRole("combobox", { name: "Moneda" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveTextContent("Cargando…");
    await waitFor(() => expect(release).toBeDefined());
    release?.();
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Moneda" })).toBeEnabled());
  });
});
