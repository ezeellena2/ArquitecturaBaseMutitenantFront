import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./Sheet";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Sheet", () => {
  it("shows an accessible sheet from the bottom with a touch-sized close button", () => {
    render(
      <Sheet open onOpenChange={vi.fn()}>
        <SheetContent>
          <SheetTitle>{"Cuenta"}</SheetTitle>
          <SheetDescription>{"Opciones de la cuenta"}</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("dialog", { name: "Cuenta" })).toHaveClass("bottom-0", "rounded-t-[16px]");
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass("min-h-11", "min-w-11");
  });
});
