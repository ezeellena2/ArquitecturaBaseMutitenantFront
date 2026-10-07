import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { asPhone } from "@/test/utils/phone";
import { MorePage } from "./MorePage";

const session = vi.hoisted(() => ({ features: [] as string[] }));
vi.mock("./navigation/personal", async () => {
  const { HomeIcon } = await import("@/shared/ui/icons");
  return { personalNavigation: { links: [
    { path: "/", labelKey: "navigation.dashboard", icon: HomeIcon },
    { path: "/cuenta", labelKey: "accessMenu.myAccount", icon: HomeIcon },
    { path: "/modulo-prueba", labelKey: "navigation.audit", feature: "modulo-prueba", icon: HomeIcon },
  ], administration: null, moreTo: "/mas" } };
});
vi.mock("@/auth/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { features: session.features,
  effectivePermissions: { platform: [], organization: [], companies: {} } } }) }));
vi.mock("@/tenancy/useProfiles", () => ({ initials: (name: string) => name.charAt(0), useProfiles: () => ({
  name: "Ana", email: "ana@example.com", access: "consumer", profiles: [], signOut: vi.fn(), status: null,
}) }));

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });
afterEach(() => { session.features = []; vi.unstubAllGlobals(); });

describe("módulos personales accesibles desde Más", () => {
  it.each([false, true])("Más mantiene accesibles los módulos visibles y Mi cuenta: %s", async (enabled) => {
    asPhone();
    session.features = enabled ? ["modulo-prueba"] : [];
    const { container } = render(<MemoryRouter initialEntries={["/mas"]}><MorePage /></MemoryRouter>);
    const sections = screen.queryByRole("list", { name: "Secciones" });
    expect(Boolean(sections)).toBe(enabled);
    if (sections) expect(within(sections).getByRole("link", { name: "Auditoría" })).toHaveAttribute("href", "/modulo-prueba");
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.queryByRole("list", { name: "Administración" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
