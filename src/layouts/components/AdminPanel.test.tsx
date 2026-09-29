import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { businessNavigation } from "../navigation/business";
import { AdminPanel } from "./AdminPanel";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("AdminPanel", () => {
  it("se abre junto al menú y cierra con ‹, vacío hasta E6", async () => {
    const onClose = vi.fn();
    render(<AdminPanel panel={businessNavigation.administration} open isMobile={false} onClose={onClose} />);
    expect(screen.getByRole("navigation", { name: "Administración" })).toHaveClass("w-[232px]");
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar Administración" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("no se monta en teléfono", () => {
    render(<AdminPanel panel={businessNavigation.administration} open isMobile onClose={vi.fn()} />);
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
  });
});
