import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { platformOperator } from "@/test/mocks/currentUsers";
import type { ApiSchemas } from "@/shared/api/types";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

type Group = ApiSchemas["PlatformLegalDocumentGroupResponse"];
const groups: Group[] = [
  { kind: "Terms", currentVersion: 2, currentEffectiveAtUtc: "2026-06-01T03:00:00Z", versions: [{ id: "t2", version: 2, effectiveAtUtc: "2026-06-01T03:00:00Z", isCurrent: true }, { id: "t1", version: 1, effectiveAtUtc: "2026-01-12T03:00:00Z", isCurrent: false }] },
  { kind: "Privacy", currentVersion: 1, currentEffectiveAtUtc: "2026-01-12T03:00:00Z", versions: [{ id: "p2", version: 2, effectiveAtUtc: "2026-11-01T03:00:00Z", isCurrent: false }, { id: "p1", version: 1, effectiveAtUtc: "2026-01-12T03:00:00Z", isCurrent: true }] },
];
beforeEach(async () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-27T20:35:00Z"));
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json(groups)));
});
afterEach(() => vi.restoreAllMocks());

describe("Documentos legales", () => {
  // Legales-Base2 (263): un dato por columna; la versión programada y su fecha, en sus columnas, sin nada debajo del nombre.
  it("muestra cada dato en su columna: la versión vigente, desde cuándo, la programada y desde cuándo; axe", async () => {
    const { container } = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    expect(await screen.findByText("2 documentos · 4 versiones publicadas")).toBeVisible();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["Documento", "Versión vigente", "Vigente desde", "Versión programada", "Vigente desde", "Acciones"]);
    const cells = (name: string) => within(within(table).getByText(name).closest("tr")!).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells("Términos y condiciones").slice(0, 5)).toEqual(["Términos y condiciones", "Versión 2", "01/06/2026", "—", "—"]);
    expect(cells("Política de privacidad").slice(0, 5)).toEqual(["Política de privacidad", "Versión 1", "12/01/2026", "Versión 2", "01/11/2026"]);
    expect(screen.queryByText(/·/, { selector: "td *" })).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("el ⋮ abre la ruta propia con documento elegido", async () => {
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    const trigger = await screen.findByRole("button", { name: "Acciones de Política de privacidad" }); trigger.focus(); await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("menuitem", { name: "Publicar versión nueva" }));
    await waitFor(() => expect(router.state.location.pathname + router.state.location.search).toBe("/plataforma/legales/nueva?documento=Privacy"));
    expect(await screen.findByRole("combobox", { name: "Documento" })).toHaveTextContent("Política de privacidad");
  });
  // M-Filas-Base2 (M-Legales, 263): cada documento es una tarjeta con cada dato nombrado, sin datos unidos con «·».
  it("390 muestra cada documento como una tarjeta con sus datos nombrados, y el FAB", async () => {
    const restore = asPhone(); const { container } = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    const privacy = (await screen.findByText("Política de privacidad")).closest("li")!; expect(screen.getByText("Administración")).toBeVisible();
    expect(within(privacy).getAllByRole("term").map((term) => term.textContent)).toEqual(["Vigente", "Vigente desde", "Programada", "Desde"]);
    expect(within(privacy).getAllByRole("definition").map((value) => value.textContent)).toEqual(["Versión 1", "12/01/2026", "Versión 2", "01/11/2026"]);
    expect(privacy.textContent).not.toContain("·");
    expect(screen.getByRole("link", { name: "Publicar versión nueva" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/plataforma/mas"); expect(await axe(container)).toHaveNoViolations(); restore();
  });
  it("sin versión vigente conserva el vacío común y el resumen de versiones real", async () => {
    server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json([{ kind: "Terms", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }])));
    renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    expect(await screen.findByText("1 documentos · 0 versiones publicadas")).toBeVisible();
    expect(within(screen.getByText("Términos y condiciones").closest("tr")!).getAllByRole("cell").slice(1, 5).map((cell) => cell.textContent)).toEqual(["—", "—", "—", "—"]);
    expect(screen.queryByText(/Versión \d/)).not.toBeInTheDocument();
  });
  it("en-US formatea vigencias y futura con la cultura efectiva", async () => {
    const page = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    await screen.findByText("2 documentos · 4 versiones publicadas");
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByText("2 documents · 4 published versions")).toBeVisible();
    expect(within(screen.getByText("Privacy policy").closest("tr")!).getAllByRole("cell").slice(1, 5).map((cell) => cell.textContent))
      .toEqual(["Version 1", "01/12/2026", "Version 2", "11/01/2026"]);
  });
});
