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
import { CultureSelect } from "./CultureSelect";

function renderSelect(initial = "") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Harness() {
    const [value, setValue] = useState(initial);
    return <><FormField label="Idioma y región"><CultureSelect value={value} onChange={setValue} placeholder="Elegí un idioma" /></FormField><output>{value}</output></>;
  }
  return render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
}

describe("CultureSelect", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
  });

  it("un solo desplegable que ilustra fecha y número de cada idioma y región", async () => {
    const user = userEvent.setup();
    renderSelect();
    const select = await screen.findByRole("combobox", { name: "Idioma y región" });
    await waitFor(() => expect(select).toBeEnabled());
    // Tablero «Criterio · Formularios»: un solo control por dato; con dos opciones, sin buscador.
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    await user.click(select);
    expect(await screen.findByText("27/09/2026 14:35 · 1.234,50")).toBeVisible();
    expect(screen.getByText("09/27/2026 2:35 PM · 1,234.50")).toBeVisible();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    // Tablero Cuenta: cada idioma se nombra en su propia lengua, aunque la pantalla esté en español.
    await user.click(screen.getByRole("option", { name: /English \(United States\)/ }));
    expect(screen.getByRole("status")).toHaveTextContent("en-US");
    expect(select).toHaveTextContent("English (United States)");
    expect(select).not.toHaveTextContent("1,234.50");
  });

  it("nombra cada cultura de Cultures en su propia lengua y omite las deshabilitadas", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture("en-US");
    const culture = fixture.cultures[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      cultures: [...fixture.cultures, { ...culture, code: "pt-BR", name: "Portuguese (Brazil)", isEnabled: false }],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Idioma y región" });
    await waitFor(() => expect(select).toBeEnabled());
    expect(select).toHaveTextContent("Elegí un idioma");
    await user.click(select);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: /^Español \(Argentina\)/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /^English \(United States\)/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Portuguese/ })).not.toBeInTheDocument();
  });

  it("muestra el nombre de una cultura elegida aunque ya no esté habilitada", async () => {
    const fixture = referenceDataFixture();
    const culture = fixture.cultures[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      cultures: [...fixture.cultures, { ...culture, code: "pt-BR", name: "Portugués (Brasil)", isEnabled: false }],
    })));
    renderSelect("pt-BR");

    const select = await screen.findByRole("combobox", { name: "Idioma y región" });
    await waitFor(() => expect(select).toHaveTextContent("Português (Brasil)"));
  });
});
