import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import type { AssistantStateResponse } from "@/modules/assistant/api/types";
import { LimitReached } from "./LimitReached";

// Tableros Asistente-Org-Base2, -Personal-Base2 y -Plat-Base2 (271): el cupo del día dice que fue el cupo y cuándo vuelve.
const state = { configured: true, canConfigure: true, models: [], quickQueries: [], dailyLimit: 50, dailyResetAtUtc: "2026-11-24T03:00:00Z", remainingMessages: 0,
  noticeVersion: "v1", noticeAccepted: true, retentionDays: 30, maxAttachmentBytes: 1, maxAttachments: 5, monthlyBudgetProgress: null,
  dailyResetTimeZoneId: "America/Argentina/Buenos_Aires" } as AssistantStateResponse;
// La organización corta en su zona (271): medianoche de Madrid, que en el perfil de Buenos Aires son las 20:00 del día anterior.
const inMadrid = { ...state, dailyResetAtUtc: "2026-11-23T23:00:00Z", dailyResetTimeZoneId: "Europe/Madrid" } as AssistantStateResponse;
beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

describe("LimitReached", () => {
  it("en una organización nombra la organización, cuándo vuelven y la (i) del cupo de cada una; axe", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LimitReached monthly={false} state={inMadrid} organizationName="Grupo Delta" inOrganization />);
    expect(await screen.findByRole("status")).toHaveTextContent("Usaste tus 50 consultas de hoy en Grupo Delta. Vuelven el 24/11/2026, a las 00:00, hora de Grupo Delta.");
    await user.click(screen.getByRole("button", { name: /Consultas de hoy/u }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Cada organización tiene su cupo: en otra podés seguir consultando.");
    expect(await axe(container)).toHaveNoViolations();
  });
  // 210 y Asistente-*-Base2: el aviso del tope es el cartel de atención, blanco, con el filo y el triángulo en ámbar, y la
  // (i) al final de su misma frase (la galería mostraba una caja amarilla llena, sin el triángulo, con la (i) abajo).
  it("es el cartel de atención, blanco con el filo ámbar y el triángulo, con la (i) en la misma frase", async () => {
    renderWithProviders(<LimitReached monthly={false} state={inMadrid} organizationName="Grupo Delta" inOrganization />);
    const notice = await screen.findByRole("status");
    expect(notice.className).toContain("border-l-[var(--alerta)]");
    expect(notice.className).not.toContain("bg-[var(--alerta-t)]");
    expect(notice.querySelector("svg.text-\\[var\\(--alerta\\)\\]")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Consultas de hoy/u }).closest("p")).toHaveTextContent(/^Usaste tus 50 consultas de hoy en Grupo Delta/u);
  });
  it("fuera de una organización es el cupo de la persona, sin la (i)", async () => {
    renderWithProviders(<LimitReached monthly={false} state={state} />);
    expect(await screen.findByRole("status")).toHaveTextContent("Usaste tus 50 consultas de hoy. Vuelven el 24/11/2026, a las 00:00, hora de tu perfil.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("el tope del mes sigue nombrando la organización", async () => {
    renderWithProviders(<LimitReached monthly state={state} organizationName="Grupo Delta" inOrganization />);
    expect(await screen.findByRole("status")).toHaveTextContent("Grupo Delta llegó al tope del mes del asistente.");
  });
});
