import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { toast } from "sonner";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import { referenceDataFixture } from "@/test/mocks/handlers";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

describe("Mi cuenta", () => {
  // Tablero M-Cuenta: en el teléfono, grupos sobre gris con el título arriba; «Agregar correo o teléfono» en texto y
  // «Dar de baja» en texto rojo, sin ícono.
  it("en el teléfono son grupos sobre gris con las acciones en texto", async () => {
    const restore = asPhone();
    try {
      server.use(http.get("/api/me/login-methods", () => HttpResponse.json({
        methods: [], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [],
      })));
      renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

      expect(await screen.findByRole("heading", { level: 2, name: "Tus datos" })).toHaveClass("text-[13.5px]");
      const signIn = screen.getByRole("region", { name: "Cómo entrás" });
      expect(within(signIn).getByRole("button", { name: "Agregar correo o teléfono" })).toHaveClass("text-[var(--marca-tx)]");
      const privacy = screen.getByRole("region", { name: "Privacidad" });
      expect(within(privacy).getByRole("button", { name: "Dar de baja" }).parentElement).toHaveClass("max-md:[&>[data-variant=danger]]:text-[var(--peligro)]");
    } finally {
      restore();
    }
  });

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
    // Criterio · Botones: peligro con borde en la pantalla; relleno solo en el diálogo que confirma.
    expect(deletionAction).toHaveAttribute("data-variant", "danger");
    // Tablero Cuenta: «Dar de baja mi cuenta» es una fila de la lista, sin texto que explique el plazo.
    expect(within(privacy).getByRole("listitem")).toHaveTextContent(/^Dar de baja mi cuenta/);
    await waitFor(() => expect(within(privacy).queryByText(/días para arrepentirte/)).not.toBeInTheDocument());
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
    expect(within(info).getByText("Sos la única persona con el rol Dueño en Grupo Delta").closest("[data-slot='notice-reason']")).toHaveClass("text-[var(--peligro-tx)]");
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
      // Tablero M-Cuenta: la acción va fija abajo, con los textos enteros.
      const discard = await screen.findByRole("button", { name: "Descartar cambios" });
      expect(discard.closest("[data-slot='fixed-actions']")).not.toBeNull();
      expect(discard).toBeEnabled();
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
      return HttpResponse.json({ version: 43 });
    }));
    const { router, container } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeVisible();
    const culture = screen.getByRole("combobox", { name: "Idioma y región" });
    await waitFor(() => expect(culture).toBeEnabled());
    culture.focus();
    await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("option", { name: /^English \(United States\)/ }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(submitted).toMatchObject({ culture: "en-US", version: 42 }));
    expect(await screen.findByRole("heading", { name: "My account" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/cuenta");
    expect(await axe(container)).toHaveNoViolations();
  });

  // «Criterio · Avisos»: la relectura después de guardar es una consulta de la pantalla; si falla, la franja lo dice una
  // sola vez (también sin conexión) y no sale el aviso de abajo.
  it("si falla la relectura después de guardar, la franja lo dice una sola vez", async () => {
    const user = userEvent.setup();
    const errorToast = vi.spyOn(toast, "error");
    server.use(http.put("/api/me", () => {
      server.use(http.get("/api/me", () => HttpResponse.error()));
      return HttpResponse.json({ version: 43 });
    }));
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    const name = await screen.findByRole("textbox", { name: "Nombre y apellido" });
    await user.clear(name);
    await user.type(name, "Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No pudimos conectarnos. Revisá tu conexión.");
    expect(screen.getAllByText("No pudimos conectarnos. Revisá tu conexión.")).toHaveLength(1);
    expect(errorToast).not.toHaveBeenCalled();
    errorToast.mockRestore();
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

  // concurrencia.md (E7): la relectura de fondo de /api/me (otra pestaña, otro dispositivo) trae el nombre que cambió en
  // otro lado, pero «Tus datos» sigue con lo que se empezó a editar; el guardado manda la versión de eso y sale el 409.
  it("una relectura de fondo no cambia la versión que manda el guardado de «Tus datos»: sale el 409", async () => {
    const user = userEvent.setup();
    let current = consumerWithoutOrganizations;
    const sent: unknown[] = [];
    const { queryClient } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    server.use(
      http.get("/api/me", () => HttpResponse.json(current)),
      http.put("/api/me", async ({ request }) => {
        const body = await request.json() as { version: number };
        sent.push(body);
        return body.version === current.version ? HttpResponse.json({ version: (current.version ?? 0) + 1 })
          : HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 });
      }),
    );
    const name = await screen.findByRole("textbox", { name: "Nombre y apellido" });

    current = { ...consumerWithoutOrganizations, displayName: "Ana María", version: 43 };
    await act(() => queryClient.invalidateQueries({ queryKey: ["current-user"] }));
    await user.clear(name);
    await user.type(name, "Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(name).toHaveValue("Nombre nuevo");
    expect(sent).toEqual([expect.objectContaining({ displayName: "Nombre nuevo", version: 42 })]);
  });

  // concurrencia.md (E7): en el back, la versión de la cuenta es la de su fila, y hacer principal un método o quitar el
  // principal cambia el correo principal de esa fila, y con eso la versión. Es una escritura propia, como publicar en la
  // Página pública: guardar «Tus datos» después no da un 409 falso; manda la versión nueva y conserva lo que se escribía.
  it.each([
    { action: "Quitar", target: "ana@example.test", title: "¿Quitar este correo?" },
    { action: "Hacer principal", target: "nuevo@example.test", title: "¿Hacer principal este correo?" },
  ])("«$action» un método que cambia la versión de la cuenta no hace chocar después a «Guardar cambios»", async ({ action, target, title }) => {
    const user = userEvent.setup();
    const ana = { id: "email-ana", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: true, canRemove: true, canMakePrimary: false };
    const nuevo = { id: "email-nuevo", type: "Email", value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true };
    let methods = [ana, nuevo];
    let current = consumerWithoutOrganizations;
    const sent: unknown[] = [];
    // Como el back: el correo principal cambia en la fila de la cuenta y sube su versión.
    const changePrimary = () => {
      methods = [{ ...nuevo, isPrimary: true, canMakePrimary: false }, ...(action === "Quitar" ? [] : [{ ...ana, isPrimary: false, canMakePrimary: true }])];
      current = { ...current, email: "nuevo@example.test", version: (current.version ?? 0) + 1 };
      return new HttpResponse(null, { status: 204 });
    };
    // Después de montar: la ruta registra su /api/me de la persona, y este lo reemplaza.
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    server.use(
      http.get("/api/me", () => HttpResponse.json(current)),
      http.get("/api/me/login-methods", () => HttpResponse.json({ methods, canLinkGoogle: false, needsPersonalLoginMethod: false,
        accountDeletionGraceDays: 30, soleOwnerOrganizations: [] })),
      http.post("/api/me/reauth", () => HttpResponse.json({ sourceMethodId: "email-nuevo", destination: "n***@example.test", resendAfterSeconds: 60 })),
      http.post("/api/me/reauth/verify", () => HttpResponse.json({ reauthTicket: "opaque-ticket" })),
      http.delete("/api/me/login-methods/email-ana", changePrimary),
      http.put("/api/me/login-methods/email-nuevo/primary", changePrimary),
      http.put("/api/me", async ({ request }) => {
        const body = await request.json() as { version: number; displayName: string };
        sent.push(body);
        if (body.version !== current.version) return HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 });
        current = { ...current, displayName: body.displayName, version: (current.version ?? 0) + 1 };
        return HttpResponse.json({ version: current.version });
      }),
    );
    const name = await screen.findByRole("textbox", { name: "Nombre y apellido" });
    await user.clear(name);
    await user.type(name, "Nombre nuevo");

    (await screen.findByRole("button", { name: `Acciones de ${target}` })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: action }));
    const dialog = await screen.findByRole("dialog", { name: title });
    expect(await within(dialog).findByText(/n\*\*\*@example.test/)).toBeVisible();
    await user.type(within(dialog).getByRole("textbox", { name: "Código 1" }), "123456");
    await user.click(within(dialog).getByRole("button", { name: action }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    // La cuenta releída llega a la barra lateral con su correo principal nuevo, además de la lista de métodos.
    await waitFor(() => expect(screen.getAllByText("nuevo@example.test")).toHaveLength(2));
    expect(name).toHaveValue("Nombre nuevo");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(sent).toEqual([expect.objectContaining({ displayName: "Nombre nuevo", version: 43 })]));
    expect(await screen.findByText("Guardamos tus datos.")).toBeVisible();
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });
});
