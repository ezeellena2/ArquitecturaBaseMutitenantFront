import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaxIdText } from "./TaxIdText";

const formatTaxId = vi.hoisted(() => vi.fn(() => "20-12345678-6"));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatTaxId, formatEmpty: () => "—" }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key === "format:emptyLabel" ? "Sin dato" : key }),
}));

describe("TaxIdText", () => {
  it("delega la máscara al catálogo con el contrato {type,number}", () => {
    render(<TaxIdText value={{ country: "AR", type: "AR-CUIT", number: "20123456786" }} />);
    expect(formatTaxId).toHaveBeenCalledWith({ type: "AR-CUIT", number: "20123456786" });
    expect(screen.getByText("20-12345678-6")).toBeInTheDocument();
    expect(screen.queryByText("20123456786")).not.toBeInTheDocument();
  });

  it("muestra el vacío accesible cuando no hay identificación", () => {
    render(<TaxIdText value={null} />);
    expect(screen.getByLabelText("Sin dato")).toHaveTextContent("—");
  });
});
