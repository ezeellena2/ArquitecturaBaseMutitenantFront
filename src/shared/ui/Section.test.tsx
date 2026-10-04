import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppChromeProvider } from "./app/AppChrome";
import { Section } from "./Section";

const phone = { phone: true, parent: null, subtitle: null, hideBottomNav: () => {} };

// «Criterio · Formularios» (una caja por tema, con el título en el encabezado arena) y tableros M-Cuenta, M-Usuario y
// M-Configuracion (en el teléfono, el título gris arriba y una tarjeta blanca, o los campos sueltos).
describe("Section", () => {
  it("en la compu es una caja con el título en el encabezado arena y la acción chica a la derecha", async () => {
    const onClick = vi.fn();
    render(<Section title="Dominio de correo" action={{ label: "Agregar dominio", onClick }}><p>{"delta.ejemplo.com"}</p></Section>);

    const region = screen.getByRole("region", { name: "Dominio de correo" });
    expect(screen.getByRole("heading", { name: "Dominio de correo" }).parentElement).toHaveClass("min-h-10", "bg-[var(--cab)]");
    await userEvent.click(screen.getByRole("button", { name: "Agregar dominio" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(region).toContainElement(screen.getByText("delta.ejemplo.com"));
  });

  it("en el teléfono lleva el título gris arriba, la acción en texto y una tarjeta blanca", () => {
    render(<AppChromeProvider value={phone}><Section title="Empresas" action={{ label: "Sumar empresa", onClick: vi.fn() }}><p>{"Delta S.A."}</p></Section></AppChromeProvider>);

    expect(screen.getByRole("region", { name: "Empresas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Empresas" })).toHaveClass("text-[13.5px]", "font-semibold");
    expect(screen.getByRole("button", { name: "Sumar empresa" })).toHaveClass("text-[14.5px]", "text-[var(--marca-tx)]");
    expect(screen.getByText("Delta S.A.").parentElement).toHaveClass("mx-4", "rounded-[14px]", "bg-[var(--lado-activo)]");
  });

  it("en el teléfono, dentro de una página con margen, la tarjeta y el título van sin margen propio", () => {
    render(<AppChromeProvider value={phone}><Section title="Permisos" meta="1 de 2 elegidos" phone="inset"><p>{"Miembros"}</p></Section></AppChromeProvider>);

    expect(screen.getByText("Miembros").parentElement).toHaveClass("rounded-[14px]");
    expect(screen.getByText("Miembros").parentElement).not.toHaveClass("mx-4");
    expect(screen.getByText("1 de 2 elegidos")).toHaveClass("text-[13.5px]", "text-[var(--t3)]");
  });

  it("en el teléfono, sin título a la vista, deja los campos sueltos sobre blanco", () => {
    render(<AppChromeProvider value={phone}><Section title="Datos" phone="untitled"><p>{"Nombre"}</p></Section></AppChromeProvider>);

    expect(screen.getByRole("region", { name: "Datos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Datos" })).toHaveClass("sr-only");
    expect(screen.getByText("Nombre").parentElement).not.toHaveClass("rounded-[14px]");
  });

  it("en la compu, lo que cuenta la caja va gris a la derecha del título", () => {
    render(<Section title="Permisos" meta="1 de 2 elegidos"><p>{"Miembros"}</p></Section>);

    expect(screen.getByText("1 de 2 elegidos")).toHaveClass("text-[12px]", "font-normal", "text-[var(--t3)]");
  });
});
