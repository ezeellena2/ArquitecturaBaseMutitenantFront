import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { LoadMore } from "./LoadMore";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("LoadMore", () => {
  it("carga la próxima página por cursor sin mostrar total ni número de página", async () => {
    const onLoadMore = vi.fn();
    renderWithProviders(<LoadMore hasMore onLoadMore={onLoadMore} />);

    const loadMore = screen.getByRole("button", { name: "Cargar más" });
    // Tablero Auditoria-Org: el botón normal, de 36 y letra de 14 («Criterio · Botones»), no el chico.
    expect(loadMore).toHaveAttribute("data-size", "default");
    expect(loadMore).toHaveClass("h-9", "text-[14px]");
    expect(loadMore).not.toHaveClass("h-7", "lg:h-8");
    // Tablero Auditoria-Org: «Cargar más» con borde, no relleno.
    expect(loadMore).toHaveAttribute("data-variant", "outline");
    expect(loadMore).not.toHaveClass("min-h-11");
    await userEvent.click(loadMore);
    expect(onLoadMore).toHaveBeenCalledOnce();
    expect(screen.queryByText(/\bde\s+\d/)).not.toBeInTheDocument();
  });

  it("desaparece al agotarse el cursor y deshabilita la acción mientras carga", () => {
    const { rerender } = renderWithProviders(<LoadMore hasMore isLoading onLoadMore={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Cargando…" })).toBeDisabled();
    rerender(<LoadMore hasMore={false} onLoadMore={vi.fn()} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
