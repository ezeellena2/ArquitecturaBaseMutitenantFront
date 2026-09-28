import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimeZoneText } from "./TimeZoneText";
import { CultureText } from "./CultureText";

const formatTimeZone = vi.hoisted(() => vi.fn(() => "Buenos Aires (GMT−3)"));
const formatCulture = vi.hoisted(() => vi.fn(() => "Español (Argentina)"));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatTimeZone, formatCulture, formatEmpty: () => "—" }),
}));

describe("TimeZoneText y CultureText", () => {
  it("muestra la ciudad y el desfase sin el ID IANA", () => {
    render(<TimeZoneText value="America/Argentina/Buenos_Aires" />);
    expect(formatTimeZone).toHaveBeenCalledWith("America/Argentina/Buenos_Aires");
    expect(screen.getByText("Buenos Aires (GMT−3)")).toBeInTheDocument();
    expect(screen.queryByText("America/Argentina/Buenos_Aires")).not.toBeInTheDocument();
  });

  it("muestra el nombre de la cultura tomado del catálogo", () => {
    render(<CultureText value="es-AR" />);
    expect(formatCulture).toHaveBeenCalledWith("es-AR");
    expect(screen.getByText("Español (Argentina)")).toBeInTheDocument();
    expect(screen.queryByText("es-AR")).not.toBeInTheDocument();
  });
});
