import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { SearchInput } from "./SearchInput";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

afterEach(() => vi.useRealTimers());

describe("SearchInput", () => {
  it("usa el nombre traducido por defecto y permite un rótulo específico", () => {
    const { rerender } = renderWithProviders(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();

    rerender(<SearchInput value="" onChange={vi.fn()} label="Buscar usuarios" />);
    expect(screen.getByRole("searchbox", { name: "Buscar usuarios" })).toBeInTheDocument();
  });

  it("traduce el nombre por defecto cuando cambia la cultura", async () => {
    await changeCulture("en-US");
    try {
      renderWithProviders(<SearchInput value="" onChange={vi.fn()} />);
      expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
    } finally {
      await changeCulture("es-AR");
    }
  });

  it("espera 300 ms desde la última tecla antes de notificar", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderWithProviders(<SearchInput value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "An" } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Ana" } });
    act(() => vi.advanceTimersByTime(299));
    expect(onChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("Ana");
  });

  it("sincroniza un valor externo y cancela la búsqueda anterior", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(<SearchInput value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Ana" } });
    rerender(<SearchInput value="Luis" onChange={onChange} />);
    expect(screen.getByRole("searchbox")).toHaveValue("Luis");
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).not.toHaveBeenCalled();
  });
});
