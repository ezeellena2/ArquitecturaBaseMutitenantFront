import { act, screen, waitFor } from "@testing-library/react";
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
  it("muestra versión vigente del backend, resumen por lengths, futura pending y axe sin filtros fabricados", async () => {
    const { container } = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    expect(await screen.findByText("2 documentos · 4 versiones publicadas")).toBeVisible();
    expect(screen.getByText("Versión 2 · vigente desde 01/06/2026")).toBeVisible();
    expect(screen.getByText("Versión 1 · vigente desde 12/01/2026")).toBeVisible();
    const future = screen.getByText("Versión 2 desde 01/11/2026"); expect(future).toBeVisible();
    expect(future.parentElement?.querySelector("[data-slot=status-dot]")).toHaveClass("bg-[var(--marca)]");
    expect(screen.queryByText("Versión 1 desde 12/01/2026")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument(); expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("el ⋮ abre la ruta propia con documento elegido", async () => {
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    const trigger = await screen.findByRole("button", { name: "Acciones de Política de privacidad" }); trigger.focus(); await user.keyboard("{ArrowDown}");
    await user.click(await screen.findByRole("menuitem", { name: "Publicar versión nueva" }));
    await waitFor(() => expect(router.state.location.pathname + router.state.location.search).toBe("/plataforma/legales/nueva?documento=Privacy"));
    expect(await screen.findByRole("combobox", { name: "Documento" })).toHaveTextContent("Política de privacidad");
  });
  it("390 conserva las tres líneas, meta vigente, futura y FAB", async () => {
    const restore = asPhone(); const { container } = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    expect(await screen.findByText("Versión 1")).toBeVisible(); expect(screen.getByText("Administración")).toBeVisible();
    expect(screen.getByText("Vigente desde 12/01/2026")).toBeVisible(); expect(screen.getAllByText(/^2 versiones/)).toHaveLength(2);
    expect(screen.getByText("Versión 2 desde 01/11/2026")).toBeVisible(); expect(screen.getByRole("link", { name: "Publicar versión nueva" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver" })).toHaveAttribute("href", "/plataforma/mas"); expect(await axe(container)).toHaveNoViolations(); restore();
  });
  it("sin versión vigente conserva el vacío común y el resumen de versiones real", async () => {
    server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json([{ kind: "Terms", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }])));
    renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    expect(await screen.findByText("1 documentos · 0 versiones publicadas")).toBeVisible();
    expect(screen.getByText("—")).toBeVisible();
    expect(screen.queryByText(/Vigente desde|vigente desde|Versión \d/)).not.toBeInTheDocument();
  });
  it("en-US formatea vigencias y futura con la cultura efectiva", async () => {
    const page = renderRouteWithProviders("/plataforma/legales", { as: "platform-operator" });
    await screen.findByText("2 documentos · 4 versiones publicadas");
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByText("2 documents · 4 published versions")).toBeVisible();
    expect(screen.getByText("Version 1 · effective since 01/12/2026")).toBeVisible();
    expect(screen.getByText("Version 2 from 11/01/2026")).toBeVisible();
  });
});
