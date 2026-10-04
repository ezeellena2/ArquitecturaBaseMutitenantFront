import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Dialog mobile layout", () => {
  it("opens from the bottom on phones and stays centered from tablet size", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>{"Editar"}</DialogTitle></DialogHeader>
          <DialogFooter><button type="button">{"Guardar"}</button></DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    const content = screen.getByRole("dialog", { name: "Editar" });
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass("bg-[var(--velo)]");
    expect(content).toHaveClass("bottom-0", "md:top-1/2", "md:max-w-[560px]");
    expect(content).toHaveClass("max-h-[calc(100dvh-1rem)]");
    // Tablero M-Usuarios-Invitar (.ap-hoja): en el teléfono es una hoja con esquinas de 20 y manija; el título de 18
    // va sin fondo arena, el ✕ mide 44 y los botones de 48 van uno al lado del otro, a lo ancho.
    expect(content).toHaveClass("rounded-t-[20px]", "shadow-[var(--sombra-hoja)]");
    expect(content.querySelector("[data-slot='dialog-handle']")).toHaveClass("md:hidden", "h-[5px]", "w-9");
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass("size-11", "md:size-8");
    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass("md:bg-[var(--cab)]", "md:min-h-12", "max-md:bg-transparent");
    expect(screen.getByRole("heading", { name: "Editar" })).toHaveClass("max-md:text-[18px]", "max-md:font-bold");
    expect(screen.getByRole("button", { name: "Guardar" }).parentElement).toHaveClass("max-md:[&_button]:h-12", "max-md:[&_button]:flex-1", "max-md:border-0");
  });

  // Hojas del teléfono (.ap-hoja .hc): debajo de la manija (8 + 5 + 4), el encabezado mide 52 con 4 arriba y abajo, y el ✕
  // de 44, con su cruz de 22, queda centrado con el título, a 6 del borde.
  it("centers the phone sheet ✕ with the title, as the M-* sheets", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>{"Sumar empresa"}</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass("min-h-[52px]", "py-1", "md:min-h-12", "md:py-2");
    const close = screen.getByRole("button", { name: "Cerrar" });
    expect(close).toHaveClass("top-[21px]", "right-1.5", "size-11", "md:top-2", "md:right-2");
    expect(close.querySelector("svg")).toHaveClass("size-[22px]", "md:size-4");
  });

  // Un diálogo que en el teléfono es la hoja de una confirmación (Cuenta-Baja y M-Cuenta-Baja): la ✕ va solo en la compu.
  it("can keep the ✕ only on the desktop", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton="desktop">
          <DialogHeader><DialogTitle>{"¿Dar de baja tu cuenta?"}</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass("max-md:hidden", "md:flex");
    // Sin ✕ en el teléfono, el encabezado no le guarda lugar: mide lo del título, con 20 a la derecha (.hc de M-Cuenta-Baja).
    const header = document.querySelector('[data-slot="dialog-header"]');
    expect(header).not.toHaveClass("min-h-[52px]");
    expect(header).toHaveClass("pr-5", "md:min-h-12");
  });

  // M-Configuracion-Quitar y M-Avisos: la hoja de una confirmación, sin ✕, con el encabezado del alto del título.
  it("keeps the short header in a confirmation sheet without ✕", () => {
    render(<ConfirmDialog open onOpenChange={() => {}} title="¿Quitar delta.ejemplo.com?" confirmLabel="Quitar" destructive onConfirm={() => {}} />);

    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    const header = document.querySelector('[data-slot="dialog-header"]');
    expect(header).not.toHaveClass("min-h-[52px]");
    expect(header).toHaveClass("py-1", "pr-5");
  });

  // Una hoja a todo el alto (Empresa y Empresas): arriba la manija y el título, el cuerpo ocupa lo que sobra y los botones
  // van abajo de todo. El título no queda flotando en el medio.
  it("gives form dialogs nearly the full phone height with the title on top and confirmations a narrower desktop width", () => {
    const { unmount } = render(
      <Dialog open>
        <DialogContent mobileFullHeight>
          <DialogHeader><DialogTitle>{"Editar"}</DialogTitle></DialogHeader>
          <DialogBody><p>{"Nombre"}</p></DialogBody>
          <DialogFooter><button type="button">{"Guardar"}</button></DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Editar" })).toHaveClass("min-h-[calc(100dvh-1rem)]", "grid-rows-[auto_auto_1fr_auto]");
    // Si el cuerpo y los botones van adentro de un <form>, el cuerpo crece igual y empuja los botones abajo.
    expect(screen.getByText("Nombre").parentElement).toHaveClass("flex-1");
    unmount();

    render(<ConfirmDialog open onOpenChange={() => {}} title="Eliminar" confirmLabel="Eliminar" onConfirm={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Eliminar" })).toHaveClass("md:max-w-[420px]");
  });
});
