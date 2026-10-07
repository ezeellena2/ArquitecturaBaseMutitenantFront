import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { PublicPageCard } from "./PublicPageCard";

// Los datos de los tableros Pagina-Publica y Pagina-Org (Grupo Delta).
const delta = {
  name: "Grupo Delta", description: "Grupo Delta y sus empresas, en un solo lugar.", logoDataUri: null,
  address: "Av. Corrientes 1234, piso 5, Buenos Aires", contactPhone: "+541143215678",
  contactEmail: "contacto@delta.ejemplo.com", website: "https://delta.ejemplo.com",
};

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("PublicPageCard (tableros Pagina-Publica y M-Pagina-Publica)", () => {
  it("permite iniciar OIDC y ocultar el CTA sin cambiar los datos ni la vista previa por defecto", () => {
    const onSignIn = vi.fn();
    const { rerender } = renderWithProviders(<PublicPageCard page={delta} onSignIn={onSignIn} />);
    fireEvent.click(screen.getByRole("button", { name: "Ingresá para continuar" }));
    expect(onSignIn).toHaveBeenCalledOnce();
    rerender(<PublicPageCard page={delta} showSignIn={false} onSignIn={onSignIn} />);
    expect(screen.queryByText("Ingresá para continuar")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: delta.name })).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  // La tarjeta tal cual: las iniciales si no hay logo, el nombre, la descripción, los cuatro datos con su ícono y su
  // rótulo, e «Ingresá para continuar». Sin enlaces ni a dónde ir, nada lleva a ningún lado (así la usa la vista previa).
  it("muestra las iniciales, el nombre, la descripción, los cuatro datos e «Ingresá para continuar» sin acción", async () => {
    const { container } = renderWithProviders(<main><PublicPageCard page={delta} /></main>);

    expect(await screen.findByText("011 4321-5678")).toHaveClass("text-[var(--marca-tx)]");
    expect(screen.getByText("GD")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("GD")).toHaveClass("size-[84px]", "rounded-[20px]", "max-md:size-[72px]");
    expect(screen.getByRole("heading", { level: 1, name: "Grupo Delta" })).toHaveClass("text-[30px]", "max-md:text-[26px]");
    expect(screen.getByText("Grupo Delta y sus empresas, en un solo lugar.")).toHaveClass("text-[16px]", "text-[var(--t2)]");
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "DirecciónAv. Corrientes 1234, piso 5, Buenos Aires",
      "Teléfono011 4321-5678",
      "Correocontacto@delta.ejemplo.com",
      "Sitio webdelta.ejemplo.com",
    ]);
    for (const row of rows) expect(row.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Ingresá para continuar")).toHaveClass("h-11", "w-full", "max-md:h-12");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  // «Solo lo que la organización cargó»: un dato vacío no deja su fila, y con logo va la imagen en lugar de las iniciales.
  it("muestra solo los datos cargados y el logo si lo hay", () => {
    const { container } = renderWithProviders(<PublicPageCard page={{
      name: "Grupo Delta", description: "  ", logoDataUri: "data:image/png;base64,AAAA", address: "", contactPhone: null,
      contactEmail: "contacto@delta.ejemplo.com", website: null,
    }} />);

    expect(screen.getAllByRole("listitem").map((row) => row.textContent)).toEqual(["Correocontacto@delta.ejemplo.com"]);
    expect(container.querySelector("img")).toHaveAttribute("src", "data:image/png;base64,AAAA");
    expect(screen.queryByText("GD")).not.toBeInTheDocument();
    expect(container.querySelector("p")).toBeNull();
  });

  // La página del subdominio (Etapa 7): el teléfono, el correo y el sitio web llevan a su lugar, y el botón al ingreso.
  it("con enlaces, cada dato lleva a su lugar y «Ingresá para continuar» lleva al ingreso", async () => {
    renderWithProviders(<PublicPageCard page={delta} links signInHref="/login" />);

    expect(await screen.findByRole("link", { name: "011 4321-5678" })).toHaveAttribute("href", "tel:+541143215678");
    expect(screen.getByRole("link", { name: "contacto@delta.ejemplo.com" })).toHaveAttribute("href", "mailto:contacto@delta.ejemplo.com");
    expect(screen.getByRole("link", { name: "delta.ejemplo.com" })).toHaveAttribute("href", "https://delta.ejemplo.com");
    expect(screen.getByRole("link", { name: "Ingresá para continuar" })).toHaveAttribute("href", "/login");
  });
});
