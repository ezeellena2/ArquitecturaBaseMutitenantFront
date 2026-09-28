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

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
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
