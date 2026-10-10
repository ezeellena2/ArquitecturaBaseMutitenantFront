import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import { fixtureAuth } from "@/test/mocks/authContext";
import { PublicSiteHostContext } from "./usePublicSite";
import { mainSiteUrl, publicSiteHost } from "./publicSite";
import { PublicAccessMenu } from "./PublicAccessMenu";

afterEach(() => { vi.unstubAllGlobals(); });

describe("menú público móvil: identidad global", () => {
  it("Phone principal conserva identidad global y retorno al principal con correo de respaldo", async () => {
    asPhone(); const user = userEvent.setup();
    server.use(meHandlerFor({ ...consumerWithoutOrganizations, displayName: null, email: "respaldo@example.test", maskedPrimaryPhone: "•••• 4521" }));
    const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
    const { container } = render(<PublicSiteHostContext.Provider value={publicSiteHost("grupo-delta")}>
      <AppProviders client={client} authContext={fixtureAuth("consumer-empty")}><MemoryRouter><PublicAccessMenu /></MemoryRouter></AppProviders>
    </PublicSiteHostContext.Provider>);
    const trigger = await screen.findByRole("button", { name: "Tu cuenta" });
    expect(trigger.querySelector("[data-slot='avatar']")).toHaveTextContent("—");
    await user.click(trigger);
    const sheet = screen.getByRole("dialog", { name: "Menú de •••• 4521" });
    expect(within(sheet).getByText("•••• 4521")).toBeVisible();
    expect(sheet.querySelector("[data-slot='avatar']")).toHaveTextContent("—");
    expect(sheet.querySelector("[data-slot='avatar']")).toHaveClass("bg-[var(--s3)]");
    expect(screen.queryByText("respaldo@example.test")).not.toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", mainSiteUrl("/cuenta"));
    for (const avatar of container.querySelectorAll("[data-slot='avatar']")) expect(avatar).toHaveClass("bg-[var(--s3)]");
  });
  it.each([
    [null, "es-AR", "Sin dato", "Menú de Sin dato", "Tu cuenta", "Mi cuenta"],
    [null, "en-US", "No data", "No data's menu", "Your account", "My account"],
    ["ana@example.test", "es-AR", "ana@example.test", "Menú de ana@example.test", "Tu cuenta", "Mi cuenta"],
  ] as const)("con nombre vacío y correo %s / %s mantiene identidad, título y retorno al principal", async (email, culture, label, menuTitle, triggerLabel, accountLabel) => {
    asPhone();
    const user = userEvent.setup();
    server.use(meHandlerFor({ ...consumerWithoutOrganizations, displayName: null, email, culture }));
    const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
    render(<PublicSiteHostContext.Provider value={publicSiteHost("grupo-delta")}>
      <AppProviders client={client} authContext={fixtureAuth("consumer-empty")}><MemoryRouter><PublicAccessMenu /></MemoryRouter></AppProviders>
    </PublicSiteHostContext.Provider>);
    const trigger = await screen.findByRole("button", { name: triggerLabel });
    if (email) expect(trigger.querySelector("[data-slot='avatar']")).toHaveTextContent("A");
    else expect(trigger.querySelector("[data-slot='avatar']")).toHaveTextContent("—");
    trigger.focus();
    await user.keyboard("{Enter}");
    const sheet = screen.getByRole("dialog", { name: menuTitle });
    for (const text of within(sheet).getAllByText(label)) expect(text).toBeVisible();
    if (!email) expect(sheet.querySelector("[data-slot='avatar']")).toHaveTextContent("—");
    expect(within(sheet).getByRole("link", { name: accountLabel })).toHaveAttribute("href", mainSiteUrl("/cuenta"));
    expect(within(sheet).getByRole("button", { name: /Personal/ })).toHaveAttribute("aria-pressed", "true");
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
