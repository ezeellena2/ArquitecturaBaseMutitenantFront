import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
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

const optionNames = () => screen.getAllByRole("option").map((option) => option.querySelector("span > span")?.textContent);

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
    expect(optionNames()).toEqual(["Argentina (+54)", "Uruguay (+598)", "Estados Unidos"]);
    expect(screen.queryByRole("option", { name: /Chile/ })).not.toBeInTheDocument();
  });

  it("con más de 10 países busca por nombre o prefijo, emite el código y nombra el control", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture();
    const argentina = fixture.countries[0];
    const others = Array.from({ length: 10 }, (_, index) => ({ ...argentina, code: `X${index}`, name: `País ${index + 1}`, callingCode: `${700 + index}`, sortOrder: null }));
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      countries: [argentina, { ...argentina, code: "UY", name: "Uruguay", callingCode: "598", sortOrder: null }, ...others],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "País" });
    await waitFor(() => expect(select).toBeEnabled());
    await user.click(select);
    const search = await screen.findByRole("searchbox", { name: "Buscar país" });
    await user.type(search, "+54");
    expect(optionNames()).toEqual(["Argentina (+54)"]);
    await user.clear(search);
    await user.type(search, "uru");
    expect(optionNames()).toEqual(["Uruguay (+598)"]);
    await user.keyboard("{Enter}");

    expect(screen.getByRole("status")).toHaveTextContent("UY");
    expect(select).toHaveTextContent("Uruguay (+598)");
    expect(screen.getByRole("combobox", { name: "País: Uruguay, +598" })).toBeInTheDocument();
    expect(within(select).queryByRole("img")).not.toBeInTheDocument();
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
    expect(optionNames()).toEqual(["Uruguay (+598)"]);
  });
});
