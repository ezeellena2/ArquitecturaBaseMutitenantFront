import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { AppProviders } from "@/app/providers";
import { queryClient } from "@/shared/api/queryClient";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { TimeZoneSelect } from "./TimeZoneSelect";

function renderSelect() {
  function Harness() {
    const [value, setValue] = useState("");
    return <><FormField label="Zona horaria"><TimeZoneSelect value={value} onChange={setValue} placeholder="Elegí una zona" /></FormField><output data-testid="selected-zone">{value}</output></>;
  }
  return render(<AppProviders><Harness /></AppProviders>);
}

const zone = (id: string, city: string, countryCodes: string[] = []) => ({ id, city, countryCodes, isEnabled: true, sortOrder: null });

describe("TimeZoneSelect", () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.clear();
  });

  it("ordena por SortOrder, offset actual y ciudad, con signo menos tipográfico", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      timeZones: [
        zone("UTC", "UTC"),
        zone("Etc/GMT+4", "Oeste", ["US", "CA"]),
        { ...zone("Etc/GMT-1", "Este", ["FR"]), isEnabled: false, sortOrder: 0 },
        fixture.timeZones[0],
      ],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Zona horaria" });
    await waitFor(() => expect(select).toBeEnabled());
    await user.click(select);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Buenos Aires (GMT−3)", "Oeste (GMT−4)", "UTC (GMT+0)",
    ]);
    expect(screen.queryByRole("option", { name: /Este/ })).not.toBeInTheDocument();
  });

  it("con más de 10 zonas busca por ciudad, ID IANA o país y emite el ID sin el offset", async () => {
    const user = userEvent.setup();
    const fixture = referenceDataFixture();
    const others = Array.from({ length: 10 }, (_, index) => zone(`Etc/GMT+${index + 1}`, `Ciudad ${index + 1}`));
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      timeZones: [...fixture.timeZones, zone("America/Montevideo", "Montevideo", ["UY"]), ...others],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Zona horaria" });
    await waitFor(() => expect(select).toBeEnabled());
    await user.click(select);
    const search = await screen.findByRole("searchbox", { name: "Buscar zona horaria" });
    await user.type(search, "argentina/buenos");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Buenos Aires (GMT−3)"]);
    await user.clear(search);
    await user.type(search, "uy");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Montevideo (GMT−3)"]);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected-zone")).toHaveTextContent("America/Montevideo");
    expect(select).toHaveTextContent("Montevideo (GMT−3)");
  });

  it("mantiene visible el estado de carga hasta que llega el catálogo", async () => {
    let release: (() => void) | undefined;
    server.use(http.get("/api/reference-data", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json(referenceDataFixture());
    }));
    renderSelect();

    const select = screen.getByRole("combobox", { name: "Zona horaria" });
    expect(select).toBeDisabled();
    expect(select).toHaveTextContent("Cargando…");
    await waitFor(() => expect(release).toBeDefined());
    release?.();
    await waitFor(() => expect(select).toBeEnabled());
  });
});
