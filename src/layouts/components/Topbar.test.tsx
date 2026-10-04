import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { Topbar } from "./Topbar";

vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Topbar", () => {
  // «Criterio · Marco» (lienzo v104): la barra lleva las migas a la izquierda y tu menú a la derecha. Nada más: sin ☰.
  it("lleva las migas y el menú de perfiles, sin ☰", () => {
    render(<Topbar breadcrumbs={<span>{"Inicio"}</span>} />);

    expect(screen.getByRole("banner")).toHaveClass("h-[52px]");
    expect(screen.getByRole("banner")).not.toHaveClass("md:h-16");
    expect(screen.getByText("Inicio")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cuenta" })).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
