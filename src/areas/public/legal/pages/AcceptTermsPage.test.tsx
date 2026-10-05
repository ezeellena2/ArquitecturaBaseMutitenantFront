import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
it("bloquea versión nueva, exige casilla y acepta el documento exacto antes de volver", async () => {
  const user = userEvent.setup();
  let accepted: unknown;
  server.use(http.post("/api/legal/accept", async ({ request }) => {
    accepted = await request.json();
    expect(request.headers.get("Idempotency-Key")).toBeTruthy();
    server.use(http.get("/api/me", () => HttpResponse.json(consumerWithoutOrganizations)));
    return new HttpResponse(null, { status: 204 });
  }));
  const { router, container } = renderRouteWithProviders("/cuenta", { as: "consumer-new-terms" });
  expect(await screen.findByRole("heading", { name: "Actualizamos los términos" })).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
  expect(router.state.location.pathname).toBe("/aceptar-terminos");
  expect(screen.getByText(/versión 2/)).toBeVisible();
  // Como el tablero Aceptar-Terminos: el botón no se apaga; sin la casilla pide la aceptación debajo de ella.
  expect(screen.getByRole("button", { name: "Aceptar y seguir" })).toBeEnabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Aceptar y seguir" }));
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Aceptá los Términos y la Política de privacidad.");
  expect(screen.getByRole("checkbox").closest("label")?.nextElementSibling).toBe(alert);
  expect(accepted).toBeUndefined();
  expect(await axe(container)).toHaveNoViolations();
  await user.click(screen.getByRole("checkbox"));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Aceptar y seguir" }));
  await waitFor(() => expect(accepted).toEqual({ documents: [{ id: "terms-v2", version: 2 }] }));
  expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeVisible();
});
