import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PhoneText } from "./PhoneText";

const formatPhone = vi.hoisted(() => vi.fn(() => "011 15-2345-6789"));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatPhone, formatEmpty: () => "—" }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key === "format:emptyLabel" ? "Sin dato" : key }),
}));

describe("PhoneText", () => {
  it("muestra el formato cultural sin exponer E.164 en el texto", () => {
    render(<PhoneText value="+5491123456789" link="tel" />);
    expect(formatPhone).toHaveBeenCalledWith("+5491123456789");
    expect(screen.getByRole("link", { name: "011 15-2345-6789" })).toHaveAttribute("href", "tel:+5491123456789");
    expect(screen.queryByText("+5491123456789")).not.toBeInTheDocument();
  });

  it("vincula WhatsApp solo con dígitos y representa el dato ausente", () => {
    formatPhone.mockReturnValueOnce("+598 94 123 456");
    const { rerender } = render(<PhoneText value="+59894123456" link="whatsapp" />);
    expect(screen.getByRole("link", { name: "+598 94 123 456" })).toHaveAttribute("href", "https://wa.me/59894123456");
    rerender(<PhoneText value={null} />);
    expect(screen.getByLabelText("Sin dato")).toHaveTextContent("—");
  });
});
