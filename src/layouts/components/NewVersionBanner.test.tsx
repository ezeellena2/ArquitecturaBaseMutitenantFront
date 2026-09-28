import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n, { changeCulture, configureI18n } from "@/shared/i18n";
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
});
