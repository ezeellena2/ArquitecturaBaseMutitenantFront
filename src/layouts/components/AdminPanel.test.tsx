import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Shield } from "lucide-react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import type { NavigationPanel } from "../navigation/types";
import { AdminPanel } from "./AdminPanel";

const futurePanel: NavigationPanel = { labelKey: "navigation.administration", icon: Shield, links: [] };

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("AdminPanel", () => {
  it("con un panel configurado abre y cierra con ‹", async () => {
    const onClose = vi.fn();
    render(<AdminPanel panel={futurePanel} open isMobile={false} onClose={onClose} />);
    expect(screen.getByRole("navigation", { name: "Administración" })).toHaveClass("w-[232px]");
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar Administración" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("no se monta en teléfono", () => {
    render(<AdminPanel panel={futurePanel} open isMobile onClose={vi.fn()} />);
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
  });
});
