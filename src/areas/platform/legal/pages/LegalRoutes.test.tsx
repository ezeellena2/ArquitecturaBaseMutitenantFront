import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

const documents = [{ kind: "Terms", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }, { kind: "Privacy", currentVersion: null, currentEffectiveAtUtc: null, versions: [] }];
const paths = ["/plataforma/legales", "/plataforma/legales/nueva"];
beforeAll(async () => { await import("./LegalDocumentsPage"); await import("./PublishLegalVersionPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json(documents)));
});

describe("rutas reales de Documentos legales", () => {
  it.each(paths)("%s aplica legal.manage antes de consultar el recurso", async (path) => {
    let reads = 0;
    server.use(http.get("/api/platform/legal-documents", () => { reads++; return HttpResponse.json(documents); }));
    renderRouteWithProviders(path, { as: "platform-operator-reader" });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(reads).toBe(0); expect(screen.queryByRole("textbox", { name: "En español" })).not.toBeInTheDocument();
  });
  it.each(paths)("%s conserva carga/error local y Reintentar consulta de nuevo", async (path) => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let reads = 0;
    server.use(http.get("/api/platform/legal-documents", async () => {
      reads++;
      if (reads === 1) { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.error(); }
      return HttpResponse.json(documents);
    }));
    renderRouteWithProviders(path, { as: "platform-operator" });
    await waitFor(() => expect(release).toBeDefined()); expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    await act(async () => { release?.(); });
    await user.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: path.endsWith("nueva") ? "Publicar versión nueva" : "Documentos legales", level: 1 })).toBeVisible();
    await waitFor(() => expect(reads).toBe(2));
  });
  it.each(paths)("%s trata 403 de lectura principal como Sin permiso", async (path) => {
    server.use(http.get("/api/platform/legal-documents", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "No autorizado." }, { status: 403 })));
    renderRouteWithProviders(path, { as: "platform-operator" });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "En español" })).not.toBeInTheDocument();
  });
  it("query documento inválida conserva default Terms y otro documento abandona formulario/confirmación", async () => {
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/legales/nueva?documento=otro", { as: "platform-operator" });
    expect(await screen.findByRole("combobox", { name: "Documento" })).toHaveTextContent("Términos y condiciones");
    fireEvent.change(screen.getByRole("textbox", { name: "Vigente desde" }), { target: { value: "01/11/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" })); await screen.findByRole("alertdialog");
    await act(async () => { void page.router.navigate("/plataforma/legales/nueva?documento=Privacy"); });
    expect(await screen.findByRole("combobox", { name: "Documento" })).toHaveTextContent("Política de privacidad");
    expect(screen.getByRole("textbox", { name: "En español" })).toHaveValue(""); expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
  it("publicar vigente vuelve inmediatamente y aceptación requerida sigue el gate existente", async () => {
    const user = userEvent.setup(); let published = false;
    server.use(http.get("/api/platform/legal-documents", () => published
      ? HttpResponse.json({ code: "Legal.AcceptanceRequired", detail: "Aceptá la nueva versión." }, { status: 403 })
      : HttpResponse.json(documents)),
    http.post("/api/platform/legal-documents", () => {
      published = true;
      server.use(meHandlerFor({ ...platformOperator, pendingLegalDocuments: [{ id: "t3", kind: "Terms", version: 3 }] }));
      return HttpResponse.json({ id: "t3", version: 3 }, { status: 201 });
    }));
    const page = renderRouteWithProviders("/plataforma/legales/nueva", { as: "platform-operator" });
    fireEvent.change(await screen.findByRole("textbox", { name: "Vigente desde" }), { target: { value: "27/09/2026" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En español" }), { target: { value: "Texto es" } });
    fireEvent.change(screen.getByRole("textbox", { name: "En inglés" }), { target: { value: "Text en" } });
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Publicar" }));
    expect(await screen.findByText("Publicamos la versión 3 de Términos y condiciones.")).toBeVisible();
    await waitFor(() => expect(page.router.state.location.pathname).toBe("/aceptar-terminos"));
    expect(page.router.state.location.state).toMatchObject({ returnTo: "/plataforma/legales" });
  });
});
