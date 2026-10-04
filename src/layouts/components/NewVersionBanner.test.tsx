import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n, { changeCulture, configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { NewVersionBanner } from "./NewVersionBanner";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("NewVersionBanner", () => {
  it("ofrece una recarga manual, sin ejecutarla al aparecer", async () => {
    const onUpdate = vi.fn();
    render(<I18nextProvider i18n={i18n}><NewVersionBanner onUpdate={onUpdate} /></I18nextProvider>);

    expect(screen.getByRole("status", { name: /Hay una versión nueva/ })).toHaveClass("bg-[var(--marca-t)]");
    expect(onUpdate).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it("muestra el texto traducido en inglés", async () => {
    await changeCulture("en-US");
    try {
      render(<I18nextProvider i18n={i18n}><NewVersionBanner onUpdate={vi.fn()} /></I18nextProvider>);
      expect(screen.getByRole("status", { name: /A new version is available/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    } finally {
      await changeCulture("es-AR");
    }
  });

  // Tablero M-Avisos («Versión nueva»): en el teléfono es una banda petróleo clara con «Actualizar» blanco a la derecha.
  it("en el teléfono es una banda con «Actualizar» blanco", () => {
    render(<I18nextProvider i18n={i18n}><AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}><NewVersionBanner onUpdate={vi.fn()} /></AppChromeProvider></I18nextProvider>);

    expect(screen.getByRole("status", { name: /Hay una versión nueva/ })).toHaveClass("text-[14.5px]", "justify-start");
    expect(screen.getByRole("button", { name: "Actualizar" })).toHaveClass("rounded-full", "bg-[var(--lado-activo)]");
  });
});
