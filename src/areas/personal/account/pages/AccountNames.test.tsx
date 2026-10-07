import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import type { MeResponse } from "@/shared/api/types";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

it.each([false, true])("edita las dos partes independientes, descarta y guarda sin mandar el combinado (teléfono %s)", async (phone) => {
  const restore = phone ? asPhone() : () => {};
  try {
    const user = userEvent.setup();
    const original: MeResponse = { ...consumerWithoutOrganizations, firstName: "María José", lastName: "de la Cruz", displayName: "María José de la Cruz" };
    let current = original;
    let submitted: unknown;
    const { container } = renderRouteWithProviders("/cuenta", { as: "consumer-compound-name" });
    server.use(http.get("/api/me", () => HttpResponse.json(current)), http.put("/api/me", async ({ request }) => {
      submitted = await request.json();
      current = { ...original, firstName: "李", lastName: "O’Neill", displayName: "Nombre armado por el servidor", version: 43 };
      return HttpResponse.json({ version: 43 });
    }));
    const first = await screen.findByRole("textbox", { name: "Nombre" });
    const last = screen.getByRole("textbox", { name: "Apellido" });
    expect(first).toHaveValue("María José");
    expect(last).toHaveValue("de la Cruz");
    const details = screen.getByRole("region", { name: "Tus datos" });
    expect(within(details).getAllByRole("textbox")).toHaveLength(2);
    await user.clear(last);
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(last).toHaveValue("de la Cruz");
    await user.clear(first); await user.type(first, "李");
    await user.clear(last); await user.type(last, "O’Neill");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(submitted).toEqual({ firstName: "李", lastName: "O’Neill", culture: original.culture, timeZoneId: original.timeZoneId, version: 42 }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
    expect(await axe(container)).toHaveNoViolations();
    if (!phone) expect(screen.getByRole("button", { name: "Nombre armado por el servidor, Personal" })).toBeVisible();
  } finally { restore(); }
});

it("guarda ambas partes vacías como null sin exigir nombre", async () => {
  const user = userEvent.setup();
  let submitted: unknown;
  let current: MeResponse = { ...consumerWithoutOrganizations, firstName: "Ana", lastName: "Pérez" };
  renderRouteWithProviders("/cuenta", { as: "visual-personal" });
  server.use(http.get("/api/me", () => HttpResponse.json(current)), http.put("/api/me", async ({ request }) => {
    submitted = await request.json();
    current = { ...current, firstName: null, lastName: null, displayName: null, version: 43 };
    return HttpResponse.json({ version: 43 });
  }));
  const first = await screen.findByRole("textbox", { name: "Nombre" });
  const last = screen.getByRole("textbox", { name: "Apellido" });
  await user.clear(first); await user.clear(last);
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(submitted).toMatchObject({ firstName: null, lastName: null, version: 42 }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
  expect(first).toHaveValue(""); expect(last).toHaveValue("");
});

it.each(["firstName", "lastName"] as const)("el error de largo de %s queda en su campo y conserva el borrador Unicode", async (field) => {
  const user = userEvent.setup();
  const error = "El nombre es demasiado largo.";
  server.use(http.put("/api/me", () => HttpResponse.json({ code: "Validation.Failed", errors: { [field]: [error] } }, { status: 400 })));
  renderRouteWithProviders("/cuenta", { as: "consumer-empty" });
  const input = await screen.findByRole("textbox", { name: field === "firstName" ? "Nombre" : "Apellido" });
  const draft = "李".repeat(101);
  await user.clear(input); await user.type(input, draft);
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(await screen.findByText(error)).toBeVisible();
  expect(input).toHaveValue(draft);
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
});

it("traduce las partes y declara su autocompletado propio", async () => {
  await changeCulture("en-US");
  renderRouteWithProviders("/cuenta", { as: "consumer-english-profile" });
  expect(await screen.findByRole("textbox", { name: "First name" })).toHaveAttribute("autocomplete", "given-name");
  expect(screen.getByRole("textbox", { name: "Last name" })).toHaveAttribute("autocomplete", "family-name");
});
