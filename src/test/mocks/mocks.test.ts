import { screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { createElement } from "react";
import { useTranslation } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { server } from "./server";
import { renderRouteWithProviders, renderWithProviders } from "../utils/renderWithProviders";

function QueryLabel() {
  const { t } = useTranslation("common");
  const query = useQuery({
    queryKey: ["test-support"],
    queryFn: async () => {
      const response = await fetch("/api/test-support");
      return (await response.json()) as { value: string };
    },
    retry: false,
  });

  return createElement("p", null, `${t("actions.cancel")}: ${query.data?.value ?? "…"}`);
}

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("soporte HTTP y componentes", () => {
  it("renderiza con i18n y Query y aísla la caché entre renders", async () => {
    server.use(http.get("/api/test-support", () => HttpResponse.json({ value: "uno" })));
    const first = renderWithProviders(createElement(QueryLabel));
    expect(await screen.findByText("Cancelar: uno")).toBeInTheDocument();
    first.unmount();

    server.use(http.get("/api/test-support", () => HttpResponse.json({ value: "dos" })));
    renderWithProviders(createElement(QueryLabel));
    expect(await screen.findByText("Cancelar: dos")).toBeInTheDocument();
  });

  it("ofrece un router de memoria sin requerir auth", async () => {
    const { router } = renderRouteWithProviders("/");
    expect(router.state.location.pathname).toBe("/");
    expect(await screen.findByRole("main")).toBeInTheDocument();
  });

  it("rechaza pedidos sin handler en vez de tocar la red", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(fetch("http://localhost/api/unhandled-by-test")).rejects.toThrow();
      expect(error).toHaveBeenCalledWith(expect.stringContaining("[MSW]"));
    } finally {
      error.mockRestore();
    }
  });
});
