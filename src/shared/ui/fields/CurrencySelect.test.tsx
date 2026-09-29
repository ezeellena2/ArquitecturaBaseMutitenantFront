import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("muestra solo monedas habilitadas, traducidas y ordenadas por SortOrder y nombre", async () => {
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
    expect(Array.from((select as HTMLSelectElement).options, (option) => option.text)).toEqual([
      "Elegí una moneda", "Peso argentino", "Euro", "Dólar",
    ]);
    expect(screen.queryByRole("option", { name: "Peso chileno" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "dolar" } });
    expect(screen.getByRole("option", { name: "Dólar" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Peso argentino" })).not.toBeInTheDocument();
  });

  it("busca por nombre traducido o código y emite el código elegido", async () => {
    const fixture = referenceDataFixture("en-US");
    server.use(http.get("/api/reference-data", () => HttpResponse.json(fixture)));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Moneda" });
    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.getByRole("option", { name: "Argentine Peso" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ars" } });
    expect(screen.getByRole("option", { name: "Argentine Peso" })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "ARS" } });
    expect(screen.getByRole("status")).toHaveTextContent("ARS");
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

  it("conserva la moneda elegida al filtrar otra y nombra el buscador", async () => {
    const fixture = referenceDataFixture();
    const peso = fixture.currencies[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      currencies: [peso, { ...peso, code: "EUR", name: "Euro" }],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Moneda" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(select, { target: { value: "ARS" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "eur" } });

    expect((select as HTMLSelectElement).selectedOptions[0]).toHaveTextContent("Peso argentino");
    expect(screen.getByRole("searchbox", { name: "Buscar moneda" })).toBeInTheDocument();
  });
});
