import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CountryFlag } from "./CountryFlag";

vi.mock("country-flag-icons/react/3x2", () => { throw new Error("chunk unavailable"); });

describe("CountryFlag ante fallo de importación", () => {
  it("conserva un nombre accesible sin derribar el contenido", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<div><CountryFlag countryCode="AR" title="Argentina" /><p>{"Contenido"}</p></div>);

    expect(await screen.findByRole("img", { name: "Argentina" })).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});
