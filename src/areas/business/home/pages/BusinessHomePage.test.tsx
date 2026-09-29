import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { BusinessLayout } from "@/layouts/BusinessLayout";
import { configureI18n } from "@/shared/i18n";
import { BusinessHomePage } from "./BusinessHomePage";

vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { displayName: "Ana", email: "ana@example.com" } }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));
beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("BusinessHomePage", () => {
  it("muestra /org vacío con Administración pero sin módulos ni cifras de relleno", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/org"]}><BusinessLayout><BusinessHomePage /></BusinessLayout></MemoryRouter>);
    expect(screen.getByRole("main")).toBeEmptyDOMElement();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Administración" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
});
