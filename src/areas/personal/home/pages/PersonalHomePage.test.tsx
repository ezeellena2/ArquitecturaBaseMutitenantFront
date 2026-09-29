import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PersonalLayout } from "@/layouts/PersonalLayout";
import { configureI18n } from "@/shared/i18n";
import { PersonalHomePage } from "./PersonalHomePage";

vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { displayName: null, email: "ana@example.com", activeTenantId: null, organizations: [] } }) }));
vi.mock("@/tenancy/AccessMenu", () => ({ AccessMenu: () => <button type="button">{"Cuenta"}</button> }));
beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("PersonalHomePage", () => {
  it("muestra el inicio personal vacío aprobado, con navegación propia y sin contenido de negocio", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/"]}><PersonalLayout><PersonalHomePage /></PersonalLayout></MemoryRouter>);
    expect(screen.getByRole("main")).toBeEmptyDOMElement();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.getAllByText("ana@example.com")).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });
});
