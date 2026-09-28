import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { CountrySelect } from "./CountrySelect";

function renderSelect(allowedCountries?: readonly string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Harness() {
    const [value, setValue] = useState("");
    return <><FormField label="País"><CountrySelect value={value} onChange={setValue} placeholder="Elegí un país"
      allowedCountries={allowedCountries} /></FormField><output>{value}</output></>;
  }
  return render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
}

describe("CountrySelect", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
  });

  it("ordena países habilitados y muestra el nombre traducido con CallingCode", async () => {
    const fixture = referenceDataFixture();
    const argentina = fixture.countries[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      countries: [
        { ...argentina, code: "UY", name: "Uruguay", callingCode: "598", sortOrder: 2 },
        { ...argentina, code: "CL", name: "Chile", callingCode: "56", isEnabled: false, sortOrder: 0 },
        { ...argentina, code: "US", name: "Estados Unidos", callingCode: null, sortOrder: 3 },
        argentina,
      ],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "País" });
    await waitFor(() => expect(select).toBeEnabled());
    select.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Argentina (+54)", "Uruguay (+598)", "Estados Unidos",
    ]);
    expect(screen.queryByRole("option", { name: /Chile/ })).not.toBeInTheDocument();
  });

  it("busca por nombre o prefijo, emite el código y muestra bandera y nombre accesible", async () => {
    server.use(http.get("/api/reference-data", () => HttpResponse.json(referenceDataFixture())));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "País" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "+54" } });
    select.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(screen.getByRole("option", { name: /Argentina.*54/ })).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector("svg[role='img']")).toBeInTheDocument());
    await userEvent.setup().keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("AR");
    expect(screen.getByRole("combobox", { name: "País: Argentina, +54" })).toBeInTheDocument();
    expect(document.querySelector("svg[role='img']")).not.toBeInTheDocument();
  });

  it("muestra carga cuando aún no llegaron los países", async () => {
    let release: (() => void) | undefined;
    server.use(http.get("/api/reference-data", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json(referenceDataFixture());
    }));
    renderSelect();

    const select = screen.getByRole("combobox", { name: "País" });
    expect(select).toBeDisabled();
    expect(select).toHaveTextContent("Cargando…");
    await waitFor(() => expect(release).toBeDefined());
    release?.();
    await waitFor(() => expect(select).toBeEnabled());
  });

  it("acepta una lista permitida para el uso telefónico sin cambiar el selector general", async () => {
    const fixture = referenceDataFixture();
    const argentina = fixture.countries[0];
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      countries: [argentina, { ...argentina, code: "UY", name: "Uruguay", callingCode: "598" }],
    })));
    renderSelect(["UY"]);

    const select = screen.getByRole("combobox", { name: "País" });
    await waitFor(() => expect(select).toBeEnabled());
    select.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Uruguay (+598)"]);
  });
});
