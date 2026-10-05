import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

function renderDialog(onOpenChange: (open: boolean) => void) {
  render(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{"Invitar usuario"}</DialogTitle>
        <input aria-label="Correo" />
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog: cómo se cierra (Criterio-Dialogos)", () => {
  it("no se cierra con un clic afuera, para no perder lo escrito", async () => {
    // El velo tiene pointer-events: none mientras el diálogo es modal; el clic igual llega al documento.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    await user.click(document.body);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Invitar usuario" })).toBeInTheDocument();
  });

  it("se cierra con ✕ y con Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

// Tablero «Criterio · Dialogos»: encabezado arena de 48 con el título de 15 y sin bajada; cuerpo con 20 de margen y
// 14 entre campos; pie de 60 con una línea arriba; atrás, la pantalla solo oscurecida.
describe("Dialog: medidas (Criterio-Dialogos)", () => {
  it("arma encabezado, cuerpo y pie con las medidas del tablero", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>{"Verificar tu correo"}</DialogTitle></DialogHeader>
          <DialogBody><p>{"Te mandamos un código."}</p></DialogBody>
          <DialogFooter><button type="button">{"Verificar"}</button></DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    const title = screen.getByRole("heading", { name: "Verificar tu correo" });
    expect(title).toHaveClass("md:text-[15px]", "font-semibold");
    expect(title.parentElement).toHaveClass("md:min-h-12", "md:bg-[var(--cab)]", "md:border-b");
    expect(screen.getByText("Te mandamos un código.").parentElement).toHaveClass("flex", "flex-col", "gap-3.5", "md:p-5");
    expect(screen.getByRole("button", { name: "Verificar" }).parentElement).toHaveClass("md:border-t", "md:py-3");
    // «Criterio · Diálogos» (v97): atrás, la pantalla oscurecida, sin difuminar.
    const overlay = document.querySelector("[data-slot='dialog-overlay']");
    expect(overlay).toHaveClass("bg-[var(--velo)]");
    expect(overlay?.className).not.toMatch(/backdrop-blur/);
  });

  // Tableros Cuenta-Baja, Cuenta-Verificar y Avisos (.p-dlg .tx): lo que aclara el título, adentro del cuerpo, va de
  // 13,5 con interlineado 1,55 en la compu y de 14,5 en el teléfono (.ap-txt-l), gris.
  it("el texto del diálogo va con la letra de los tableros", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>{"¿Dar de baja tu cuenta?"}</DialogTitle></DialogHeader>
          <DialogBody><DialogDescription>{"Cerramos todas tus sesiones."}</DialogDescription></DialogBody>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText("Cerramos todas tus sesiones.")).toHaveClass("text-[13.5px]", "leading-[1.55]", "text-[var(--t2)]", "max-md:text-[14.5px]", "max-md:leading-normal");
  });

  // «Criterio · Diálogos», Los dos anchos: el chico de 420 (uno o dos campos, y confirmaciones) y el normal de 560. Quien
  // usa el diálogo declara el chico; no hay otros anchos.
  it("declara el ancho: el chico de 420 o el normal de 560", () => {
    const { unmount } = render(
      <Dialog open>
        <DialogContent size="sm"><DialogHeader><DialogTitle>{"Agregar miembro"}</DialogTitle></DialogHeader></DialogContent>
      </Dialog>,
    );
    const small = screen.getByRole("dialog", { name: "Agregar miembro" });
    expect(small).toHaveClass("md:max-w-[420px]");
    expect(small).not.toHaveClass("md:max-w-[560px]");
    unmount();

    render(
      <Dialog open>
        <DialogContent><DialogHeader><DialogTitle>{"Editar empresa"}</DialogTitle></DialogHeader></DialogContent>
      </Dialog>,
    );
    const normal = screen.getByRole("dialog", { name: "Editar empresa" });
    expect(normal).toHaveClass("md:max-w-[560px]");
    expect(normal).not.toHaveClass("md:max-w-[420px]");
  });

  // La única excepción a los dos anchos (tablero Pagina-Org, «Borrador: vista previa», v107): la vista previa de la
  // Página pública mide 640, para que la tarjeta de la página pública entre tal cual, con su fondo alrededor.
  it("la vista previa declara su ancho de 640", () => {
    render(
      <Dialog open>
        <DialogContent size="preview" aria-describedby={undefined}><DialogHeader><DialogTitle>{"Vista previa"}</DialogTitle></DialogHeader></DialogContent>
      </Dialog>,
    );
    const preview = screen.getByRole("dialog", { name: "Vista previa" });
    expect(preview).toHaveClass("md:max-w-[640px]");
    expect(preview).not.toHaveClass("md:max-w-[560px]");
  });
});
