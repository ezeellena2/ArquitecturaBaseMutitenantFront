import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { http, HttpResponse } from "msw";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import i18n from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import App from "./App";

describe("App", () => {
  beforeEach(() => { queryClient.clear(); resetHttpClient(); localStorage.clear(); });

  it("muestra un error traducido con reintento y avisos si falla el catálogo inicial", async () => {
    let failing = true;
    server.use(http.get("/api/reference-data", () => failing
      ? new HttpResponse(null, { status: 503 })
      : HttpResponse.json(referenceDataFixture())));

    render(<AppProviders><App /></AppProviders>);

    expect(i18n.isInitialized).toBe(true);
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    expect(screen.getByRole("alert")).toHaveTextContent("Algo salió mal");
    expect(screen.getByRole("region", { name: /^Notificaciones/ })).toBeInTheDocument();

    failing = false;
    fireEvent.click(retry);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument());
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("monta la ruta vacía", () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
