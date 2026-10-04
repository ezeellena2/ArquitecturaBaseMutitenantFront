import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { referenceDataFixture } from "@/test/mocks/handlers";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

describe("Mi cuenta", () => {
  it("muestra carga, error y reintento de las formas de acceso", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    server.use(http.get("/api/me/login-methods", async () => {
      attempts++;
      if (attempts === 1) {
        await delay(80);
        return HttpResponse.json({ code: "General.Unexpected" }, { status: 500 });
      }
      return HttpResponse.json({ methods: [], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] });
    }));
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

    expect(await screen.findByText("Cargando…")).toBeVisible();
    expect(await screen.findByRole("alert")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("region", { name: "Cómo entrás" })).toBeVisible();
    expect(attempts).toBe(2);
  });

  it("mantiene la sección vacía con su acción para agregar un acceso", async () => {
    server.use(http.get("/api/me/login-methods", () => HttpResponse.json({
      methods: [], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [],
    })));
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

    const signIn = await screen.findByRole("region", { name: "Cómo entrás" });
    expect(within(signIn).getByRole("button", { name: "Agregar correo o teléfono" })).toBeVisible();
    expect(await within(signIn).findByRole("list")).toBeEmptyDOMElement();
  });

  it("separa datos, formas de acceso y privacidad en las tres secciones del tablero", async () => {
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

    const details = await screen.findByRole("region", { name: "Tus datos" });
    const signIn = screen.getByRole("region", { name: "Cómo entrás" });
    const privacy = screen.getByRole("region", { name: "Privacidad" });
    expect(details.compareDocumentPosition(signIn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(signIn.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const deletionAction = within(privacy).getByRole("button", { name: "Dar de baja" });
    expect(deletionAction).toHaveAttribute("data-variant", "outline");
    expect(deletionAction).toHaveClass("border-[var(--peligro)]", "text-[var(--peligro)]");
    expect(screen.getByRole("button", { name: "Descartar cambios" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(within(signIn).getByRole("button", { name: "Agregar correo o teléfono" })).toBeVisible();
  });

  it("la única Dueña ve «Dar de baja» apagado y el motivo con qué puede hacer (tablero Cuenta)", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/me/login-methods", () => HttpResponse.json({
      methods: [], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30,
      soleOwnerOrganizations: ["Grupo Delta"],
    })));
    const { container } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

    const privacy = await screen.findByRole("region", { name: "Privacidad" });
    const deletion = await within(privacy).findByRole("button", { name: "Dar de baja" });
    await waitFor(() => expect(deletion).toHaveAttribute("aria-disabled", "true"));
    await user.click(deletion);
    const info = await screen.findByRole("dialog", { name: "No podés dar de baja tu cuenta" });
    expect(info).toHaveTextContent("Sos la única persona con el rol Dueño en Grupo Delta");
    // Tablero: el aviso en bordó y negrita; los números de los pasos en un círculo gris relleno.
    expect(within(info).getByText("Sos la única persona con el rol Dueño en Grupo Delta")).toHaveClass("font-semibold");
    expect(within(info).getByText("Sos la única persona con el rol Dueño en Grupo Delta").parentElement).toHaveClass("text-[var(--peligro-tx)]");
    for (const number of info.querySelectorAll("[data-step-number]")) expect(number).toHaveClass("bg-[var(--s3)]");
    expect(info).toHaveTextContent("Qué podés hacer");
    expect(within(info).getAllByRole("listitem").map((item) => item.textContent?.replace(/^\d/, "")))
      .toEqual(["Sumá otro Dueño en Grupo Delta", "O pedí a la plataforma que cierre la organización"]);
    expect(screen.queryByRole("dialog", { name: "¿Dar de baja tu cuenta?" })).not.toBeInTheDocument();
    await user.click(within(info).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(within(privacy).getByRole("button", { name: "Por qué no podés darte de baja" }));
    expect(await screen.findByRole("dialog", { name: "No podés dar de baja tu cuenta" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en teléfono deja las acciones abajo y muestra el borrador en la segunda línea del título", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === "(max-width: 767px)", media: query,
      addEventListener: () => {}, removeEventListener: () => {},
    }));
    try {
      const user = userEvent.setup();
      renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
      const actions = await screen.findByRole("group", { name: "Acciones de la cuenta" });
      expect(actions).toHaveAttribute("data-account-actions");
      expect(within(actions).getByRole("button", { name: "Descartar" })).toBeEnabled();
      const name = await screen.findByRole("textbox", { name: "Nombre y apellido" });
      await user.type(name, " nuevo");
      expect(screen.getByText("Cambios sin guardar")).toHaveClass("text-[var(--alerta)]");
      expect(screen.getByText("Cambios sin guardar")).not.toHaveClass("rounded-full");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(["Agregar correo o teléfono", "Vincular Google"])("pide reautenticación antes de %s", async (label) => {
    const user = userEvent.setup();
    let additions = 0;
    let action: unknown;
    server.use(
      http.get("/api/me/login-methods", () => HttpResponse.json({ methods: [], canLinkGoogle: true,
        needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] })),
      http.post("/api/me/reauth", async ({ request }) => {
        action = (await request.json() as { action: unknown }).action;
        return HttpResponse.json({ sourceMethodId: "existing", destination: "a***@example.test", resendAfterSeconds: 60 });
      }),
      http.post("/api/me/login-methods", () => { additions++; return HttpResponse.json({ methodId: "new" }); }),
      http.post("/api/me/external/google", () => { additions++; return HttpResponse.json({ redirectUrl: "/" }); }),
    );
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    await user.click(await screen.findByRole("button", { name: label }));
    expect(await screen.findByRole("textbox", { name: "Código 1" })).toBeVisible();
    expect(action).toBe(label === "Vincular Google" ? "LinkGoogle" : "AddEmail");
    expect(additions).toBe(0);
    expect(screen.queryByRole("textbox", { name: "Correo" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Cancelar$/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("guarda el idioma con versión y actualiza los textos sin cambiar de acceso", async () => {
    const user = userEvent.setup();
    let submitted: unknown;
    server.use(http.put("/api/me", async ({ request }) => {
      submitted = await request.json();
      server.use(http.get("/api/me", () => HttpResponse.json({ ...consumerWithoutOrganizations, culture: "en-US", version: 43 })));
      return new HttpResponse(null, { status: 204 });
    }));
    const { router, container } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeVisible();
    const culture = screen.getByRole("combobox", { name: "Idioma y región" });
    await waitFor(() => expect(culture).toBeEnabled());
    culture.focus();
    await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("option", { name: /^Inglés \(Estados Unidos\)/ }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(submitted).toMatchObject({ culture: "en-US", version: 42 }));
    expect(await screen.findByRole("heading", { name: "My account" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/cuenta");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("conserva el draft cuando otro guardado devuelve 409 y permite descartarlo", async () => {
    const user = userEvent.setup();
    server.use(http.put("/api/me", () => HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 })));
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    const name = await screen.findByRole("textbox", { name: "Nombre y apellido" });
    await user.clear(name);
    await user.type(name, "Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("button", { name: "Ver lo nuevo" })).toBeVisible();
    expect(name).toHaveValue("Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(name).toHaveValue("Ana");
  });
});

