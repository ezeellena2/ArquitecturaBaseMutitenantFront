import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { CultureSelect } from "./CultureSelect";

function renderSelect() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Harness() {
    const [value, setValue] = useState("");
    return <><FormField label="Cultura"><CultureSelect value={value} onChange={setValue} placeholder="Elegí una cultura" /></FormField><output>{value}</output></>;
  }
  return render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
}

describe("CultureSelect", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
  });

  it("muestra nombres traducidos desde Cultures y omite culturas deshabilitadas", async () => {
    const fixture = referenceDataFixture("en-US");
    const culture = fixture.cultures[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      cultures: [...fixture.cultures, { ...culture, code: "pt-BR", name: "Portuguese (Brazil)", isEnabled: false }],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Cultura" });
    await waitFor(() => expect(select).toBeEnabled());
    expect(Array.from((select as HTMLSelectElement).options, (option) => option.text)).toEqual([
      "Elegí una cultura", "Spanish (Argentina)", "English (United States)",
    ]);
    expect(screen.queryByRole("option", { name: "Portuguese (Brazil)" })).not.toBeInTheDocument();
  });

  it("filtra por nombre o código y devuelve el código de la opción", async () => {
    server.use(http.get("/api/reference-data", () => HttpResponse.json(referenceDataFixture())));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Cultura" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "en-us" } });
    expect(screen.getByRole("option", { name: "Inglés (Estados Unidos)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Español (Argentina)" })).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: "en-US" } });
    expect(screen.getByRole("status")).toHaveTextContent("en-US");
  });

  it("conserva la cultura elegida al filtrar otra y nombra el buscador", async () => {
    server.use(http.get("/api/reference-data", () => HttpResponse.json(referenceDataFixture())));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Cultura" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(select, { target: { value: "es-AR" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "en-us" } });

    expect((select as HTMLSelectElement).selectedOptions[0]).toHaveTextContent("Español (Argentina)");
    expect(screen.getByRole("searchbox", { name: "Buscar cultura" })).toBeInTheDocument();
  });
});
