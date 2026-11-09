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

    expect(screen.getByRole("banner")).toHaveClass("h-13");
    expect(screen.getByRole("banner")).not.toHaveClass("md:h-16");
    expect(screen.getByText("Inicio")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cuenta" })).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  // Tableros Campana y Campana-Plat (.w-cmp-env): la campana va después de las migas y antes de tu menú.
  it("lleva la campana entre las migas y tu menú", () => {
    render(<Topbar breadcrumbs={<span>{"Inicio"}</span>} bell={<button type="button">{"Avisos"}</button>} />);

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Avisos", "Cuenta"]);
    expect(screen.getByText("Inicio").compareDocumentPosition(screen.getByRole("button", { name: "Avisos" })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
