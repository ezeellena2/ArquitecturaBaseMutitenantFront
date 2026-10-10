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
    else expect(trigger.querySelector("[data-slot='avatar']")).toBeEmptyDOMElement();
    trigger.focus();
    await user.keyboard("{Enter}");
    const sheet = screen.getByRole("dialog", { name: menuTitle });
    for (const text of within(sheet).getAllByText(label)) expect(text).toBeVisible();
    if (!email) expect(sheet.querySelector("[data-slot='avatar']")).toBeEmptyDOMElement();
    expect(within(sheet).getByRole("link", { name: accountLabel })).toHaveAttribute("href", mainSiteUrl("/cuenta"));
    expect(within(sheet).getByRole("button", { name: /Personal/ })).toHaveAttribute("aria-pressed", "true");
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
