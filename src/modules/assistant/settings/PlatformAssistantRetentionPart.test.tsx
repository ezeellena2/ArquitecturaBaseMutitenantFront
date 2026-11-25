import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { MeResponse } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { mountSettings, platformSettings, settingsHandlers } from "./settingsTestSupport";

const operator: MeResponse = { ...platformOperator, moduleCapabilities: [{ key: "assistant", available: true, canConfigure: true, canReadUsage: false }] };
let sent: unknown[] = [];
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  sent = []; settingsHandlers();
  server.use(http.get("/api/platform/settings", () => HttpResponse.json(platformSettingsFixture)),
    http.put("/api/platform/assistant/settings", async ({ request }) => { sent.push(await request.json()); return HttpResponse.json({ version: 21 }); }));
});
const field = () => within(screen.getByRole("region", { name: "Privacidad y retención" })).getByRole("textbox", { name: "Conversaciones del Inicio" });

// Tablero Config-Plat-Base2 (272): «Conversaciones del Inicio», el cuarto plazo de «Privacidad y retención».
describe("Configuración de Plataforma: las conversaciones del Inicio", { timeout: 15_000 }, () => {
  it("muestra el plazo del asistente con su (i); axe", async () => {
    const { container } = mountSettings(operator, "/plataforma/configuracion");
    await waitFor(() => expect(field()).toHaveValue("30"));
    expect(field()).toHaveAccessibleDescription("De 1 a 30 días. Las conversaciones con el asistente.");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("se guarda sin motivo, con la configuración leída y la clave como está", async () => {
    const { user } = mountSettings(operator, "/plataforma/configuracion");
    await waitFor(() => expect(field()).toHaveValue("30"));
    fireEvent.change(field(), { target: { value: "15" } }); fireEvent.blur(field());
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const read = platformSettings();
    await waitFor(() => expect(sent).toEqual([{ defaultModelId: read.defaultModelId, allowedModelIds: read.allowedModelIds, effort: read.effort, dailyMessageLimit: read.dailyMessageLimit,
      personalEnabled: read.personalEnabled, monthlyOrganizationBudget: read.monthlyOrganizationBudget, retentionDays: 15, keyAction: "keep", version: read.version }]));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("más de 30 días no se guarda", async () => {
    const { user } = mountSettings(operator, "/plataforma/configuracion");
    await waitFor(() => expect(field()).toHaveValue("30"));
    fireEvent.change(field(), { target: { value: "31" } }); fireEvent.blur(field());
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Tiene que ser de 1 a 30.")).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it("sin el permiso del asistente no aparece", async () => {
    mountSettings({ ...operator, moduleCapabilities: [{ key: "assistant", available: true, canConfigure: false, canReadUsage: false }] }, "/plataforma/configuracion");
    expect(await screen.findByRole("region", { name: "Privacidad y retención" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Conversaciones del Inicio" })).not.toBeInTheDocument();
  });
});
