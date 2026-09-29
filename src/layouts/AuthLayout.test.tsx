import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { AuthLayout } from "./AuthLayout";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});
afterEach(async () => { await act(async () => { await changeCulture("es-AR"); }); });

function show(access: "consumer" | "business") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><AuthLayout access={access}><h1>{"Ingresá a tu cuenta"}</h1></AuthLayout></MemoryRouter></QueryClientProvider>);
}

describe("AuthLayout", () => {
  it("divide escritorio en formulario y panel; en teléfono deja una columna", async () => {
    const { container } = show("consumer");

    expect(container.firstElementChild).toHaveClass("md:grid-cols-2");
    expect(screen.getByRole("main")).toHaveClass("md:items-center");
    expect(screen.getByRole("heading", { name: "Ingresá a tu cuenta" })).toBeVisible();
    expect(screen.getByTestId("auth-brand-panel")).toHaveClass("hidden", "md:flex");
    expect(screen.getByRole("link", { name: "ArquitecturaBase" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "ArquitecturaBase" }).firstElementChild).toHaveClass("after:border-[var(--lado-activo)]");
    expect(screen.getByTestId("auth-brand-panel").querySelectorAll("li svg")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terminos");
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute("href", "/privacidad");
    expect(await screen.findByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el panel cambia al mensaje aprobado para la puerta de empresas", () => {
    show("business");
    expect(screen.getByText("Para empresas")).toBeInTheDocument();
    expect(screen.getByText("Tu grupo y todas sus empresas en un solo lugar.")).toBeInTheDocument();
    expect(screen.getByText("Usuarios con roles por organización y por empresa.")).toBeInTheDocument();
  });

  it("ofrece idiomas desde culturas habilitadas y aplica la cultura elegida", async () => {
    const user = userEvent.setup();
    show("consumer");
    const english = await screen.findByRole("button", { name: "English" });
    await user.click(english);
    await waitFor(() => { expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true"); });
    expect(document.documentElement.lang).toBe("en");
  });
});
