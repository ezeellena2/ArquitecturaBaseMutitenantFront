import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { expect, it } from "vitest";
import { axe } from "vitest-axe";
import es from "@/modules/assistant/locales/es/assistant.json";
import en from "@/modules/assistant/locales/en/assistant.json";
import type { AssistantToolEventResponse } from "@/modules/assistant/api/types";
import { beginAssistantTurn, reduceAssistantTurn } from "../runtime/assistantTurnState";
import { ToolStatus } from "./ToolStatus";

const event = (labelKey: string, state: AssistantToolEventResponse["state"] = "running", toolKey = labelKey): AssistantToolEventResponse => ({ turnId: "turn", toolKey, labelKey, state });
const started = () => reduceAssistantTurn(beginAssistantTurn("chat", { text: "Consulta" }), { event: "start", data: { turnId: "turn", userMessageId: "user", assistantMessageId: "answer", conversationVersion: 1 } });
async function mount(tools: AssistantToolEventResponse[], language = "es") {
  const instance = createInstance();
  await instance.init({ lng: language, fallbackLng: false, resources: { es: { assistant: es }, en: { assistant: en } }, interpolation: { escapeValue: false } });
  const view = (events: AssistantToolEventResponse[]) => <I18nextProvider i18n={instance}><ToolStatus turn={{ ...started(), tools: events }} pending /></I18nextProvider>;
  const result = render(view(tools));
  return { ...result, update: (events: AssistantToolEventResponse[]) => result.rerender(view(events)) };
}

it.each(["es", "en"])("traduce el catálogo publicado completo y oculta identificadores en %s", async (language) => {
  // Claves cotejadas con Assistant.resx; el CI del front no tiene checkout del back.
  const published = Object.keys(es.tools.labels).map((key) => `Tool.${key}`);
  const app = await mount(published.map((key, index) => event(key, "running", `private-${index}`)), language);
  expect(screen.getAllByRole("status")).toHaveLength(published.length);
  expect(published).toHaveLength(19);
  for (const key of published) expect(app.container.textContent).not.toContain(key);
  expect(app.container.textContent).not.toMatch(/private-|tools\.|Consultando información|Looking up information/);
  expect(screen.getByText(language === "es" ? "Consultando tus organizaciones…" : "Looking up your organizations…")).toBeVisible();
  expect(screen.getByText(language === "es" ? "Consultando el uso del asistente…" : "Looking up assistant usage…")).toBeVisible();
  expect(await axe(app.container)).toHaveNoViolations();
});

it.each(["es", "en"])("completa y agrupa la pareja aprobada sin perder otros estados ni orden en %s", async (language) => {
  let turn = started();
  const send = (data: AssistantToolEventResponse) => { turn = reduceAssistantTurn(turn, { event: "tool", data }); };
  send(event("Tool.org_companies", "complete", "companies"));
  send(event("Tool.org_users", "running", "users"));
  const app = await mount([...turn.tools], language);
  expect(screen.getAllByRole("status").map((node) => node.textContent)).toEqual(language === "es" ? ["Consultó Empresas", "Consultando usuarios…"] : ["Looked up companies", "Looking up users…"]);
  send(event("Tool.org_users", "complete", "users"));
  send(event("Tool.org_users", "running", "users")); // Replay antiguo no revierte el resultado.
  send(event("Tool.org_roles", "failed", "roles"));
  app.update([...turn.tools]);
  expect(screen.getAllByRole("status").map((node) => node.textContent)).toEqual(language === "es" ? ["Consultó Empresas y Usuarios", "No se pudo consultar roles."] : ["Looked up Companies and Users", "Could not look up roles."]);
  expect(turn.tools.map((tool) => tool.toolKey)).toEqual(["companies", "users", "roles"]);
});

it("claves y estados desconocidos usan texto genérico sin revelar identificadores", async () => {
  const app = await mount([event("private.Tool.payload"), event("__proto__", "failed"), event("Tool.org_users", "private-state" as AssistantToolEventResponse["state"])]);
  expect(screen.getAllByRole("status").map((node) => node.textContent)).toEqual(["Consultando información…", "No se pudo consultar la información.", "Consultando información…"]);
  expect(app.container.textContent).not.toMatch(/private|__proto__|org_users|tools\./);
});
