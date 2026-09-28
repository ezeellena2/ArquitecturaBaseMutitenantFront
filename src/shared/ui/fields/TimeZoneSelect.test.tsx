import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("TimeZoneSelect", () => {
  beforeEach(() => {
    queryClient.clear();
    localStorage.clear();
  });

  it("ordena por SortOrder, offset actual y ciudad, con signo menos tipográfico", async () => {
    const fixture = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      timeZones: [
        { id: "UTC", city: "UTC", countryCodes: [], isEnabled: true, sortOrder: null },
        { id: "Etc/GMT+4", city: "Oeste", countryCodes: ["US", "CA"], isEnabled: true, sortOrder: null },
        { id: "Etc/GMT-1", city: "Este", countryCodes: ["FR"], isEnabled: false, sortOrder: 0 },
        fixture.timeZones[0],
      ],
    })));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Zona horaria" });
    await waitFor(() => expect(select).toBeEnabled());
    expect(Array.from((select as HTMLSelectElement).options, (option) => option.text)).toEqual([
      "Elegí una zona", "Buenos Aires (GMT−3)", "Oeste (GMT−4)", "UTC (GMT+0)",
    ]);
    expect(screen.queryByRole("option", { name: /Este/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Oeste (GMT−4)" })).toHaveAttribute("data-country-codes", "US,CA");
  });

  it("busca ciudad e ID IANA y emite el ID sin guardar el offset", async () => {
    server.use(http.get("/api/reference-data", () => HttpResponse.json(referenceDataFixture())));
    renderSelect();

    const select = await screen.findByRole("combobox", { name: "Zona horaria" });
    await waitFor(() => expect(select).toBeEnabled());
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "argentina/buenos" } });
    expect(screen.getByRole("option", { name: "Buenos Aires (GMT−3)" })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "America/Argentina/Buenos_Aires" } });
    expect(screen.getByTestId("selected-zone")).toHaveTextContent("America/Argentina/Buenos_Aires");
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
