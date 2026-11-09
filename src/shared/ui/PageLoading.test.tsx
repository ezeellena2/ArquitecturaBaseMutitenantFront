import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { AppChromeProvider } from "./app/AppChrome";
import { FormSkeleton } from "./FormSkeleton";
import { Page } from "./Page";
import { PageLoading } from "./PageLoading";

beforeAll(async () => {
  await configureI18n(referenceDataFixture().cultures);
});

describe("Lo que carga no salta (160)", () => {
  // «Criterio · Marco», «Mientras carga una página» (.r711-pag): la banda ya está, con su alto y su borde, y el título es
  // un bloque de carga; el cuerpo, tres barras. Nunca una página en blanco ni un aro suelto.
  it("una página que espera muestra su banda con su borde, el título como bloque y tres barras", async () => {
    const { container } = render(<PageLoading />);

    const loading = screen.getByRole("status", { name: "Cargando…" });
    const band = loading.querySelector("[data-slot='page-loading-band']")!;
    expect(band).toHaveClass("min-h-16", "border-b", "border-[var(--borde)]", "bg-[var(--superficie)]");
    expect(band.children).toHaveLength(2);
    expect(loading.querySelectorAll("[data-slot='page-loading-bar']")).toHaveLength(3);
    expect(loading.querySelector(".animate-spin")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en el teléfono, la barra de arriba con el bloque del título", () => {
    render(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}><PageLoading /></AppChromeProvider>);

    const band = screen.getByRole("status", { name: "Cargando…" }).querySelector("[data-slot='page-loading-band']")!;
    expect(band).toHaveClass("h-15");
    expect(band.children).toHaveLength(1);
  });

  // «Criterio · Formularios», «Un ajuste» (.r711-aj.carga): mientras carga, dibuja sus zonas con el título, el rótulo y el
  // control de cada campo, en dos columnas iguales, y la banda va sin sus botones.
  it("un ajuste que carga dibuja sus zonas con el título, sin los botones de la banda", async () => {
    const { container } = render(<Page title="Configuración"><FormSkeleton zones={3} /></Page>);

    expect(screen.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const skeleton = screen.getByRole("status", { name: "Cargando…" });
    const zones = skeleton.querySelectorAll("[data-slot='form-skeleton-zone']");
    expect(zones).toHaveLength(3);
    for (const zone of zones) {
      expect(zone.firstElementChild).toHaveClass("min-h-10", "bg-[var(--cab)]");
      expect(zone.querySelectorAll("[data-slot='form-skeleton-field']")).toHaveLength(2);
      expect(zone.lastElementChild).toHaveClass("grid-cols-2", "max-md:grid-cols-1");
    }
    expect(within(skeleton).queryByRole("textbox")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
