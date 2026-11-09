import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { axe } from "vitest-axe";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

it("mantiene el inicio personal con su banda «Inicio», navegación propia y accesibilidad sin contenido de negocio", async () => {
  const { container } = renderRouteWithProviders("/", { as: "consumer-empty" });
  expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
  // Tablero Inicio-Personal: la banda «Inicio» y nada más.
  const main = screen.getByRole("main");
  expect(within(main).getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
  expect(main).toHaveTextContent(/^Inicio$/);
  expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

// Tablero Inicio-Personal (175): el aviso de método propio va en la campana, sin cartel en el Inicio, en la compu y en el
// teléfono.
it.each([["la compu", false], ["el teléfono", true]] as const)("en %s, sin método propio el Inicio va sin cartel", async (_, phone) => {
  const restore = phone ? asPhone() : () => {};
  try {
    renderRouteWithProviders("/", { as: "consumer-needs-personal-method" });
    const main = await screen.findByRole("main");
    expect(await within(main).findByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
    expect(within(main).queryByText(/Agregá un correo personal o tu WhatsApp/)).not.toBeInTheDocument();
    expect(within(main).queryByRole("button", { name: "Agregar" })).not.toBeInTheDocument();
    expect(within(main).queryByRole("status")).not.toBeInTheDocument();
  } finally {
    restore();
  }
});
