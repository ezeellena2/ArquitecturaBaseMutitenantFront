import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { ApiSchemas } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformAccountDetailFixture } from "@/test/mocks/platformAccountDetail";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

// F2 (Etapa 9, tableros Cuenta-Plat, Recuperaciones, Legales y Config-Plat): una escritura sensible sin confirmación reciente
// responde 403 Auth.Platform.ReauthenticationRequired. «Confirmá que sos vos» reemplaza al diálogo de la acción, que queda
// oculto con lo cargado; confirmado, la misma operación se repite una vez con su cuerpo, versión y clave.
const required = () => HttpResponse.json({ code: "Auth.Platform.ReauthenticationRequired", detail: "Confirmá que sos vos para continuar." }, { status: 403 });
const proven = { verifiedAtUtc: "2026-09-27T21:00:00Z", recentUntilUtc: "2026-09-27T21:10:00Z" };
type Detail = ApiSchemas["PlatformAccountDetailResponse"];
let laura: Detail;

beforeAll(async () => {
  await Promise.all([import("@/areas/platform/accounts/pages/AccountPage"), import("@/areas/platform/recoveries/pages/RecoveriesPage"), import("@/areas/platform/settings/pages/PlatformSettingsPage")]);
});
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  laura = platformAccountDetailFixture({ kind: "Operador" });
  server.use(http.get("/api/platform/accounts/:id", () => HttpResponse.json(laura)),
    http.get("/api/platform/audit", () => HttpResponse.json({ items: [], hasMore: false, nextCursor: null })));
});

/** El back: la primera escritura pide la confirmación; las demás responden lo que diga `after`. */
function permissionsApi(after: (call: number) => Response = () => HttpResponse.json({ version: 2 })) {
  const writes: { body: unknown; key: string | null }[] = []; const proofs: unknown[] = [];
  server.use(
    http.put("/api/platform/accounts/:id/operator", async ({ request }) => {
      writes.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") });
      return writes.length === 1 ? required() : after(writes.length);
    }),
    http.post("/api/platform/reauthentication", async ({ request }) => { proofs.push(await request.json()); return HttpResponse.json(proven); }),
  );
  return { writes, proofs };
}

async function savePermissions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Cambiar permisos" }));
  const dialog = await screen.findByRole("dialog", { name: "Cambiar permisos de Laura Díaz" });
  const permissions = within(dialog).getByRole("button", { name: "Permisos de plataforma" }); permissions.focus(); await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("menuitemcheckbox", { name: "Administrar cuentas" })); await user.keyboard("{Escape}");
  await user.type(within(dialog).getByRole("textbox", { name: "Motivo" }), "Va a atender las bajas de cuentas.");
  await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
  return dialog;
}
const typeCode = (code: string) => fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: code } });

describe("Confirmá que sos vos", () => {
  it("reemplaza a «Cambiar permisos» y, confirmado, repite el mismo guardado con la misma clave", async () => {
    const { writes, proofs } = permissionsApi();
    const user = userEvent.setup(); const { container } = renderRouteWithProviders(`/plataforma/cuentas/${laura.id}`, { as: "platform-operator" });
    const form = await savePermissions(user);

    const confirm = await screen.findByRole("dialog", { name: "Confirmá que sos vos" });
    expect(confirm).toHaveTextContent("Para guardar los permisos de Laura Díaz, escribí el código de tu app de autenticación.");
    // Nunca un diálogo encima de otro: el de la acción queda oculto detrás, con lo cargado.
    expect(screen.getAllByRole("dialog")).toEqual([confirm]);
    expect(form).not.toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    typeCode("123456");
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Cambiamos los permisos de Laura Díaz.")).toBeVisible();
    expect(proofs).toEqual([{ method: "authenticator", code: "123456" }]);
    expect(writes).toHaveLength(2);
    expect(writes[1]).toEqual(writes[0]);
    expect(writes[0].body).toEqual({ version: 1, reason: "Va a atender las bajas de cuentas.", permissions: ["platform.tenants.read", "platform.recoveries.manage", "platform.accounts.manage"] });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar vuelve a «Cambiar permisos» con lo cargado, sin error ni otro envío", async () => {
    const { writes, proofs } = permissionsApi();
    const user = userEvent.setup(); renderRouteWithProviders(`/plataforma/cuentas/${laura.id}`, { as: "platform-operator" });
    const form = await savePermissions(user);
    const confirm = await screen.findByRole("dialog", { name: "Confirmá que sos vos" });
    await user.click(within(confirm).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Confirmá que sos vos" })).not.toBeInTheDocument());
    expect(form).toBeVisible();
    expect(within(form).getByRole("textbox", { name: "Motivo" })).toHaveValue("Va a atender las bajas de cuentas.");
    expect(within(form).getByRole("button", { name: "Permisos de plataforma" })).toHaveTextContent("Administrar cuentas");
    expect(within(form).queryByRole("alert")).not.toBeInTheDocument();
    expect(writes).toHaveLength(1); expect(proofs).toHaveLength(0);

    // Volver a guardar pide de nuevo la confirmación y repite el mismo pedido, con la misma clave.
    await user.click(within(form).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(writes).toHaveLength(2));
    expect(writes[1].key).toBe(writes[0].key);
  });

  it("el código incorrecto, el de recuperación usado y el bloqueo se dicen en la confirmación", async () => {
    permissionsApi();
    let attempt = 0;
    server.use(http.post("/api/platform/reauthentication", () => {
      attempt++;
      return attempt === 1 ? HttpResponse.json({ code: "Auth.TwoFactor.Invalid" }, { status: 400 })
        : attempt === 2 ? HttpResponse.json({ code: "Auth.TwoFactor.RecoveryInvalid" }, { status: 400 })
          : HttpResponse.json({ code: "Identity.Account.LockedOut", retryAfter: 900 }, { status: 429, headers: { "Retry-After": "900" } });
    }));
    const user = userEvent.setup(); renderRouteWithProviders(`/plataforma/cuentas/${laura.id}`, { as: "platform-operator" });
    await savePermissions(user);
    const confirm = await screen.findByRole("dialog", { name: "Confirmá que sos vos" });
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    expect(await within(confirm).findByText("Escribí los 6 números del código.")).toBeVisible();
    typeCode("120934");
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    expect(await within(confirm).findByText("El código no es válido. Revisá que la hora de tu celular esté bien.")).toBeVisible();

    await user.click(within(confirm).getByRole("button", { name: "Usar un código de recuperación" }));
    expect(confirm).toHaveTextContent("Para guardar los permisos de Laura Díaz, escribí uno de los códigos de recuperación que guardaste.");
    fireEvent.change(within(confirm).getByRole("textbox", { name: "Código de recuperación" }), { target: { value: "P4TZ-8WNE" } });
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    expect(await within(confirm).findByText("Ese código no es válido o ya lo usaste.")).toBeVisible();

    await user.click(within(confirm).getByRole("button", { name: "Usar la app de autenticación" }));
    typeCode("774201");
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    expect(await within(confirm).findByText("Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos. Probá de nuevo en 15 minutos.")).toBeVisible();
    expect(within(confirm).getByRole("button", { name: "Confirmar" })).toBeDisabled();
    expect(within(confirm).getByRole("button", { name: "Usar un código de recuperación" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Código 1" })).toBeDisabled();
  });

  it("después de confirmar, el 409 de otra persona llega al formulario como siempre", async () => {
    permissionsApi(() => HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió este operador." }, { status: 409 }));
    const user = userEvent.setup(); renderRouteWithProviders(`/plataforma/cuentas/${laura.id}`, { as: "platform-operator" });
    const form = await savePermissions(user);
    typeCode("123456");
    await user.click(within(await screen.findByRole("dialog", { name: "Confirmá que sos vos" })).getByRole("button", { name: "Confirmar" }));
    expect(await within(form).findByText("Otra persona cambió este operador.")).toBeVisible();
    expect(form).toBeVisible();
  });

  it("si el back vuelve a pedirla (otra sesión, prueba vencida), no insiste: el formulario lo dice", async () => {
    const { writes } = permissionsApi(() => required());
    const user = userEvent.setup(); renderRouteWithProviders(`/plataforma/cuentas/${laura.id}`, { as: "platform-operator" });
    const form = await savePermissions(user);
    typeCode("123456");
    await user.click(within(await screen.findByRole("dialog", { name: "Confirmá que sos vos" })).getByRole("button", { name: "Confirmar" }));
    expect(await within(form).findByText("Confirmá que sos vos para continuar.")).toBeVisible();
    expect(writes).toHaveLength(2);
    expect(screen.queryByRole("dialog", { name: "Confirmá que sos vos" })).not.toBeInTheDocument();
  });

  it("navegar con la confirmación abierta la cancela y no repite el guardado", async () => {
    const { writes } = permissionsApi();
    const user = userEvent.setup(); const { router } = renderRouteWithProviders(`/plataforma/cuentas/${laura.id}`, { as: "platform-operator" });
    await savePermissions(user);
    await screen.findByRole("dialog", { name: "Confirmá que sos vos" });
    await act(async () => { await router.navigate("/plataforma/cuentas"); });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Confirmá que sos vos" })).not.toBeInTheDocument());
    expect(writes).toHaveLength(1);
  });

  it("al aprobar una recuperación reemplaza a «Revisar el pedido»", async () => {
    const pending = { id: "r1", createdAtUtc: "2026-09-27T13:20:00Z", accountId: "pablo", accountName: "Pablo Ortiz", previousMethodType: "Email", previousMethod: "pa•••@kappa.ejemplo.com", newMethodType: "Email", newMethod: "pa•••@gmail.com", status: "Pending", version: 12 };
    const keys: (string | null)[] = [];
    server.use(
      http.get("/api/platform/recoveries/paged", () => HttpResponse.json({ items: [pending], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get("/api/platform/recoveries/filter-counts", () => HttpResponse.json({ total: 1, statuses: [{ status: "Pending", count: 1 }] })),
      http.post("/api/platform/recoveries/:id/approve", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? required() : HttpResponse.json({ version: 13 }); }),
      http.post("/api/platform/reauthentication", () => HttpResponse.json(proven)),
    );
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
    const trigger = await screen.findByRole("button", { name: "Acciones de Pablo Ortiz" }); trigger.focus(); await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("menuitem", { name: "Revisar" }));
    const review = screen.getByRole("dialog");
    await user.type(within(review).getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(within(review).getByRole("button", { name: "Aprobar" }));
    const confirm = await screen.findByRole("dialog", { name: "Confirmá que sos vos" });
    expect(confirm).toHaveTextContent("Para aprobar el pedido de Pablo Ortiz, escribí el código de tu app de autenticación.");
    expect(screen.getAllByRole("dialog")).toEqual([confirm]);
    typeCode("123456");
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);
  });

  it("390: al guardar la configuración es la hoja de abajo, con el texto de Configuración", async () => {
    asPhone();
    const bodies: unknown[] = [];
    server.use(
      http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)),
      http.put("/api/platform/settings", async ({ request }) => { bodies.push(await request.json()); return bodies.length === 1 ? required() : HttpResponse.json({ version: 2 }); }),
      http.post("/api/platform/reauthentication", () => HttpResponse.json(proven)),
    );
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    const consumer = await screen.findByRole("combobox", { name: "Registro de personas" }); consumer.focus(); await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "Cerrado" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const reason = await screen.findByRole("dialog", { name: "¿Guardar la configuración?" });
    fireEvent.change(within(reason).getByRole("textbox", { name: "Motivo" }), { target: { value: "Revisamos el registro." } });
    await user.click(within(reason).getByRole("button", { name: "Guardar" }));
    const confirm = await screen.findByRole("dialog", { name: "Confirmá que sos vos" });
    expect(confirm).toHaveTextContent("Para guardar la configuración, escribí el código de tu app de autenticación.");
    expect(confirm).toHaveClass("bottom-0", "rounded-t-[20px]");
    typeCode("123456");
    await user.click(within(confirm).getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual(bodies[0]);
  });
});
