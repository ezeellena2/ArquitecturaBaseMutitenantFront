import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { Topbar } from "./Topbar";

vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Topbar", () => {
  it("muestra el menú de perfiles, la marca móvil y permite abrir navegación", () => {
    const onToggleNavigation = vi.fn();
    render(<Topbar onToggleNavigation={onToggleNavigation} breadcrumbs={<span>{"Inicio"}</span>} />);

    expect(screen.getByRole("banner")).toHaveClass("h-[52px]");
    expect(screen.getByRole("banner")).not.toHaveClass("md:h-16");
    expect(screen.getByText("ArquitecturaBase")).toHaveClass("md:hidden");
    expect(screen.getByText("Inicio")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cuenta" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Abrir o contraer navegación" }));
    expect(onToggleNavigation).toHaveBeenCalledOnce();
  });
});
