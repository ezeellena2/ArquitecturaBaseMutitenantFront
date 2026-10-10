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
import type { AccountLoginMethodsResponse, AddLoginMethodRequest, LoginMethodCodeResponse, LoginMethodsResponse } from "@/shared/api/types";
import type { ProblemDetails } from "@/shared/api/problemDetails";
import { loginMethodsQueryKey } from "@/shared/account/api/loginChannels";
import { accountMethodsQueryKey } from "@/shared/account/api/loginMethods";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

const receivedMethods: AccountLoginMethodsResponse = {
  methods: [
    { id: "phone", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false },
    { id: "email", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: true, canRemove: false, canMakePrimary: false },
    { id: "google", type: "Google", value: "ana@gmail.com", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true },
  ],
  canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [],
};

it.each(["pending", "error", "absent"] as const)("con capacidades %s conserva datos Phone pero presenta sólo Email y Google", async (capabilities) => {
  let release: (() => void) | undefined;
  let phoneCalls = 0;
  const emailRequests: AddLoginMethodRequest[] = [];
  server.use(
    http.get("/api/me/login-methods", () => HttpResponse.json<AccountLoginMethodsResponse>(receivedMethods)),
    http.get<never, never, LoginMethodsResponse | ProblemDetails>("/api/auth/methods", async () => {
      if (capabilities === "pending") await new Promise<void>((resolve) => { release = resolve; });
      if (capabilities === "error") return HttpResponse.json<ProblemDetails>({ code: "General.Unexpected" }, { status: 503 });
      return HttpResponse.json<LoginMethodsResponse>({ channels: [{ key: "email", countries: [] }] });
    }),
    http.post<never, AddLoginMethodRequest, LoginMethodCodeResponse>("/api/me/login-methods", async ({ request }) => {
      const body = await request.json();
      if (body.phone) phoneCalls++; else emailRequests.push(body);
      return HttpResponse.json({ methodId: "new-email", resendAfterSeconds: 0 }, { status: 202 });
    }),
    http.post("/api/me/login-methods/phone/code", () => {
      phoneCalls++;
      return HttpResponse.json({ methodId: "phone", resendAfterSeconds: 0 }, { status: 202 });
    }),
  );
  const { queryClient, container } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  try {
    await waitFor(() => expect(queryClient.getQueryState(loginMethodsQueryKey)?.status).toBe(capabilities === "absent" ? "success" : capabilities));
    if (capabilities === "pending") {
      await waitFor(() => expect(release).toBeDefined());
      expect(queryClient.getQueryState(loginMethodsQueryKey)?.fetchStatus).toBe("fetching");
    }
    const list = await screen.findByRole("list", { name: "Cómo entrás" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).queryByText("011 15-5555-4521")).not.toBeInTheDocument();
    expect(queryClient.getQueryData(accountMethodsQueryKey)).toEqual(receivedMethods);
    const rows = within(list).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("ana@example.testPrincipal");
    expect(within(rows[0]!).queryByRole("button")).not.toBeInTheDocument();
    expect(rows[1]).toHaveTextContent("Googleana@gmail.com");
    expect(within(list).queryByRole("button", { name: "Verificar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar correo" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Agregar correo o teléfono" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Agregar correo" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox", { name: "Correo" }), "nuevo@example.test");
    await user.click(within(dialog).getByRole("button", { name: "Enviar código" }));
    expect(await within(dialog).findByRole("textbox", { name: "Código 1" })).toBeVisible();
    expect(emailRequests).toEqual([{ email: "nuevo@example.test" }]);
    expect(phoneCalls).toBe(0);
    expect(queryClient.getQueryData(accountMethodsQueryKey)).toEqual(receivedMethods);
  } finally {
    await act(async () => { release?.(); });
  }
});

it("relee la lista tras clear sin depender de capacidades previas en 390 px", async () => {
  const restore = asPhone();
  let reads = 0;
  let capabilityReads = 0;
  let release: (() => void) | undefined;
  server.use(
    http.get("/api/me/login-methods", () => { reads++; return HttpResponse.json<AccountLoginMethodsResponse>(receivedMethods); }),
    http.get("/api/auth/methods", async () => {
      capabilityReads++;
      if (capabilityReads > 1) await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json<LoginMethodsResponse>({ channels: [{ key: "whatsapp", countries: ["AR"] }] });
    }),
  );
  const { router, queryClient, container } = renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  try {
    expect(await screen.findByText("011 15-5555-4521")).toBeVisible();
    await waitFor(() => expect(queryClient.getQueryState(loginMethodsQueryKey)?.status).toBe("success"));
    await act(async () => { await router.navigate("/mas"); });
    act(() => { queryClient.clear(); });
    expect(queryClient.getQueryState(loginMethodsQueryKey)).toBeUndefined();
    await act(async () => { await router.navigate("/cuenta"); });
    await waitFor(() => expect(release).toBeDefined());
    expect(queryClient.getQueryState(loginMethodsQueryKey)?.fetchStatus).toBe("fetching");
    const list = await screen.findByRole("list", { name: "Cómo entrás" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).queryByText("011 15-5555-4521")).not.toBeInTheDocument();
    expect(queryClient.getQueryData(accountMethodsQueryKey)).toEqual(receivedMethods);
    expect(reads).toBe(2);
    await act(async () => { release?.(); });
    expect(await within(list).findByText("011 15-5555-4521")).toBeVisible();
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(await axe(container)).toHaveNoViolations();
  } finally {
    await act(async () => { release?.(); });
    restore();
  }
});

describe("Mi cuenta", () => {
  // Tablero M-Cuenta: en el teléfono, grupos sobre gris con el título arriba; «Agregar correo» en texto y
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
      expect(within(signIn).getByRole("button", { name: "Agregar correo" })).toHaveClass("text-[var(--marca-tx)]");
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
    expect(within(signIn).getByRole("button", { name: "Agregar correo" })).toBeVisible();
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
    expect(within(signIn).getByRole("button", { name: "Agregar correo" })).toBeVisible();
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
      const name = await screen.findByRole("textbox", { name: "Nombre" });
      await user.type(name, " nuevo");
      expect(screen.getByText("Cambios sin guardar")).toHaveClass("text-[var(--alerta)]");
      expect(screen.getByText("Cambios sin guardar")).not.toHaveClass("rounded-full");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("abre Agregar correo directamente sin pedir confirmación", async () => {
    const user = userEvent.setup();
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    await user.click(await screen.findByRole("button", { name: "Agregar correo" }));
    expect(await screen.findByRole("textbox", { name: "Correo" })).toBeVisible();
    expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
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
    const name = await screen.findByRole("textbox", { name: "Nombre" });
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
    const name = await screen.findByRole("textbox", { name: "Nombre" });
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
    const name = await screen.findByRole("textbox", { name: "Nombre" });

    current = { ...consumerWithoutOrganizations, firstName: "Ana María", displayName: "Ana María", version: 43 };
    await act(() => queryClient.invalidateQueries({ queryKey: ["current-user"] }));
    await user.clear(name);
    await user.type(name, "Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(name).toHaveValue("Nombre nuevo");
    expect(sent).toEqual([expect.objectContaining({ firstName: "Nombre nuevo", version: 42 })]);
  });

  // concurrencia.md (E7): después de guardar «Tus datos», la base es la versión que respondió el guardado. Si otra sesión
  // guardó justo después, la relectura trae su cambio con otra versión: no pasa a ser la base y el próximo guardado da 409.
  it("después de guardar «Tus datos», el próximo guardado manda la versión que respondió el guardado, no la de la relectura", async () => {
    const user = userEvent.setup();
    let current = consumerWithoutOrganizations;
    const sent: Array<{ version: number }> = [];
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
    server.use(
      http.get("/api/me", () => HttpResponse.json(current)),
      http.put("/api/me", async ({ request }) => {
        const body = await request.json() as { firstName: string; lastName: string | null; version: number };
        sent.push(body);
        if (body.version !== current.version) return HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 });
        // Otra sesión guarda justo después: la relectura ya trae su cambio, con otra versión.
        current = { ...current, firstName: "Ana María", displayName: "Ana María", version: (current.version ?? 0) + 2 };
        return HttpResponse.json({ version: 43 });
      }),
    );
    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Nombre guardado");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Guardamos tus datos.")).toBeVisible();

    await user.type(name, " otra vez");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(sent.map((body) => body.version)).toEqual([42, 43]);
  });

  // concurrencia.md e identidad.md (E7): la versión de /api/me es la de «Tus datos», 0 si el perfil nunca se guardó. El 0
  // es una versión: el primer guardado la manda y el siguiente manda la que respondió el guardado.
  it("con la versión 0 de un perfil que nunca se guardó, «Tus datos» la manda y después manda la que respondió", async () => {
    const user = userEvent.setup();
    let current = { ...consumerWithoutOrganizations, version: 0 };
    const sent: Array<{ version: number }> = [];
    renderRouteWithProviders("/cuenta", { as: "consumer-profile-never-saved" });
    server.use(
      http.get("/api/me", () => HttpResponse.json(current)),
      http.put("/api/me", async ({ request }) => {
        const body = await request.json() as { firstName: string; lastName: string | null; version: number };
        sent.push(body);
        if (body.version !== current.version) return HttpResponse.json({ code: "General.ConcurrencyConflict" }, { status: 409 });
        current = { ...current, firstName: body.firstName, lastName: body.lastName, displayName: body.firstName, version: current.version + 1 };
        return HttpResponse.json({ version: current.version });
      }),
    );
    const name = await screen.findByRole("textbox", { name: "Nombre" });
    await user.clear(name);
    await user.type(name, "Primer nombre");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Guardamos tus datos.")).toBeVisible();

    await user.type(name, " y apellido");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(sent.map((body) => body.version)).toEqual([0, 1]));
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });
});

// Tablero Cuenta («whatsapp»): con el módulo de WhatsApp el back suma su canal a /api/auth/methods y Mi cuenta ofrece
// «Agregar correo o teléfono»; sin él (el back de hoy), «Agregar correo».
describe("Mi cuenta y el módulo de WhatsApp", () => {
  it("con el módulo dice «Agregar correo o teléfono»", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries: ["AR"] }] })));
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

    const signIn = await screen.findByRole("region", { name: "Cómo entrás" });
    expect(await within(signIn).findByRole("button", { name: "Agregar correo o teléfono" })).toBeVisible();
  });

  it("sin el módulo dice «Agregar correo»", async () => {
    renderRouteWithProviders("/cuenta", { as: "consumer-empty" });

    const signIn = await screen.findByRole("region", { name: "Cómo entrás" });
    expect(within(signIn).getByRole("button", { name: "Agregar correo" })).toBeVisible();
    expect(within(signIn).queryByRole("button", { name: "Agregar correo o teléfono" })).not.toBeInTheDocument();
  });
});

it.each(["consumer-empty", "business-admin", "platform-operator"] as const)("Phone comparte Mi cuenta como %s sin preparar perfil personal", async (access) => {
  const user = userEvent.setup();
  const sent: string[] = [];
  const track = ({ request }: { request: Request }) => { if (request.method !== "GET") sent.push(new URL(request.url).pathname); };
  server.events.on("request:start", track);
  try {
    server.use(
      http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries: ["AR"] }] })),
      http.get("/api/me/login-methods", () => HttpResponse.json({ methods: [{ id: "phone", type: "Phone", value: "+5491155554521", isVerified: true, isPrimary: true, canRemove: false, canMakePrimary: false }], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] })),
    );
    const { router } = renderRouteWithProviders("/cuenta", { as: access });
    expect(await screen.findByText("011 15-5555-4521")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Acciones de 011 15-5555-4521" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Agregar correo o teléfono" }));
    await user.click(await screen.findByRole("button", { name: "WhatsApp" }));
    expect(screen.getByRole("textbox", { name: "Número" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(router.state.location.pathname).toBe("/cuenta");
    expect(sent).toEqual([]);
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Apellido" })).toBeVisible();
  } finally { server.events.removeListener("request:start", track); }
});

it("quitar Phone principal relee la transferencia autoritativa al método restante sin código", async () => {
  const user = userEvent.setup(); let removed = false;
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["AR"] }] })),
    http.get("/api/me/login-methods", () => HttpResponse.json({ methods: [
      ...(!removed ? [{ id: "phone", type: "Phone", value: "+5491155554521", isVerified: true, isPrimary: true, canRemove: true, canMakePrimary: false }] : []),
      { id: "email", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: removed, canRemove: !removed, canMakePrimary: !removed },
    ], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] })),
    http.delete("/api/me/login-methods/phone", () => { removed = true; return new HttpResponse(null, { status: 204 }); }),
  );
  renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  const trigger = await screen.findByRole("button", { name: "Acciones de 011 15-5555-4521" }); trigger.focus(); await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: "Quitar" }));
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  await waitFor(() => expect(screen.queryByText("011 15-5555-4521")).not.toBeInTheDocument());
  const row = within(screen.getByRole("list", { name: "Cómo entrás" })).getByRole("listitem");
  expect(row).toHaveTextContent("ana@example.testPrincipal");
  expect(within(row).queryByRole("button")).not.toBeInTheDocument();
});

it.each(["remove", "primary"] as const)("reconcilia %s Phone si se cancela mientras la escritura sigue pendiente", async (action) => {
  const user = userEvent.setup(); let completed = false; const reads: boolean[] = [];
  let release!: () => void; const writing = vi.fn();
  const write = async () => { writing(); await new Promise<void>((resolve) => { release = resolve; }); completed = true; return new HttpResponse(null, { status: 204 }); };
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["AR"] }] })),
    http.get("/api/me/login-methods", () => {
      reads.push(completed);
      return HttpResponse.json({ methods: [
        ...(!(completed && action === "remove") ? [{ id: "phone", type: "Phone", value: "+5491155554521", isVerified: true, isPrimary: completed && action === "primary", canRemove: true, canMakePrimary: !(completed && action === "primary") }] : []),
        { id: "email", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: !(completed && action === "primary"), canRemove: !(completed && action === "remove"), canMakePrimary: completed && action === "primary" },
      ], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] });
    }),
    http.delete("/api/me/login-methods/phone", write),
    http.put("/api/me/login-methods/phone/primary", write),
  );
  renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  const trigger = await screen.findByRole("button", { name: "Acciones de 011 15-5555-4521" }); trigger.focus(); await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: action === "remove" ? "Quitar" : "Hacer principal" }));
  await user.click(screen.getByRole("button", { name: action === "remove" ? "Quitar" : "Hacer principal" }));
  await waitFor(() => expect(writing).toHaveBeenCalledOnce());
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(reads).toEqual([false, false]));
  await act(async () => { release(); });
  await waitFor(() => expect(reads).toContain(true));
  const list = screen.getByRole("list", { name: "Cómo entrás" });
  if (action === "remove") {
    expect(within(list).queryByText("011 15-5555-4521")).not.toBeInTheDocument();
    expect(within(list).queryByRole("button")).not.toBeInTheDocument();
  } else {
    const row = within(list).getByText("011 15-5555-4521").closest("li"); expect(row).toHaveTextContent("Principal");
  }
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText(action === "remove" ? "Quitamos 011 15-5555-4521." : "Desde ahora te avisamos a 011 15-5555-4521.")).not.toBeInTheDocument();
});

it("verificación Phone cancelada reconcilia el éxito tardío sin cerrar otro diálogo ni avisar", async () => {
  const user = userEvent.setup(); let verified = false; const reads: boolean[] = [];
  let release!: () => void; const verifying = vi.fn();
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["AR"] }] })),
    http.get("/api/me/login-methods", () => {
      reads.push(verified);
      return HttpResponse.json({ methods: [
        { id: "phone", type: "Phone", value: "+5491155554521", isVerified: verified, isPrimary: false, canRemove: true, canMakePrimary: verified },
        { id: "email", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: true, canRemove: verified, canMakePrimary: false },
      ], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] });
    }),
    http.post("/api/me/login-methods/phone/code", () => HttpResponse.json({ methodId: "phone", resendAfterSeconds: 0 })),
    http.post("/api/me/login-methods/phone/verify", async () => { verifying(); await new Promise<void>((resolve) => { release = resolve; }); verified = true; return new HttpResponse(null, { status: 204 }); }),
  );
  renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  await user.click(await screen.findByRole("button", { name: "Verificar" }));
  await user.type(await screen.findByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(verifying).toHaveBeenCalledOnce());
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(reads).toEqual([false, false]));
  await user.click(screen.getByRole("button", { name: "Agregar correo o teléfono" }));
  const nextDialog = screen.getByRole("dialog", { name: "Agregar correo o teléfono" });
  await act(async () => { release(); });
  await waitFor(() => expect(reads).toContain(true));
  await waitFor(() => expect(screen.queryByText("Sin verificar")).not.toBeInTheDocument());
  expect(nextDialog).toBeVisible(); expect(screen.getAllByRole("dialog")).toEqual([nextDialog]);
  expect(screen.queryByText("Verificamos •••• 4521.")).not.toBeInTheDocument();
});

it("alta Phone cancelada muestra el método pendiente cuando la creación termina después del GET previo", async () => {
  const user = userEvent.setup(); let added = false; const reads: boolean[] = [];
  let release!: () => void; const writing = vi.fn();
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["AR"] }] })),
    http.get("/api/me/login-methods", () => {
      reads.push(added);
      return HttpResponse.json({ methods: [
        { id: "email", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: true, canRemove: false, canMakePrimary: false },
        ...(added ? [{ id: "phone", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }] : []),
      ], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] });
    }),
    http.post("/api/me/login-methods", async () => { writing(); await new Promise<void>((resolve) => { release = resolve; }); added = true; return HttpResponse.json({ methodId: "phone", resendAfterSeconds: 60 }); }),
  );
  renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  await user.click(await screen.findByRole("button", { name: "Agregar correo o teléfono" }));
  await user.click(screen.getByRole("button", { name: "WhatsApp" }));
  await user.type(screen.getByRole("textbox", { name: "Número" }), "1155554521");
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(writing).toHaveBeenCalledOnce());
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(reads).toEqual([false, false]));
  await act(async () => { release(); });
  await waitFor(() => expect(reads).toContain(true));
  expect(await screen.findByText("011 15-5555-4521")).toBeVisible();
  expect(screen.getByText("Sin verificar")).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
});
