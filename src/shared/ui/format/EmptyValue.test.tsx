import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyValue } from "./EmptyValue";
import { FileSizeText } from "./FileSizeText";
import { DurationText } from "./DurationText";

const formatFileSize = vi.hoisted(() => vi.fn(() => "1,5 MB"));
const formatDuration = vi.hoisted(() => vi.fn(() => "2 h 15 min"));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatEmpty: () => "—", formatFileSize, formatDuration }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key === "format:emptyLabel" ? "Sin dato" : key }),
}));

describe("EmptyValue y unidades", () => {
  it("anuncia Sin dato y muestra la raya en el token tenue", () => {
    render(<EmptyValue />);
    const empty = screen.getByLabelText("Sin dato");
    expect(empty).toHaveTextContent("—");
    expect(empty).toHaveClass("text-[var(--t3)]");
  });

  it("delega tamaño y duración al formateador único", () => {
    render(<><FileSizeText value={1_500_000} /><DurationText value={8_100} /></>);
    expect(formatFileSize).toHaveBeenCalledWith(1_500_000);
    expect(formatDuration).toHaveBeenCalledWith(8_100);
    expect(screen.getByText("1,5 MB")).toBeInTheDocument();
    expect(screen.getByText("2 h 15 min")).toBeInTheDocument();
  });
});
