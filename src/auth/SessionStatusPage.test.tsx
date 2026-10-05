import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { asPhone } from "@/test/utils/phone";
import { SessionStatusPage } from "./SessionStatusPage";

function renderStatus(status: Parameters<typeof SessionStatusPage>[0]) {
  return render(<MemoryRouter><SessionStatusPage {...status} /></MemoryRouter>);
}

describe("SessionStatusPage", () => {
  it("reproduce los cinco estados aprobados del tablero Sesion", () => {
    const starting = renderStatus({ status: "starting" });
    expect(screen.getByRole("heading", { name: "Iniciando sesión…" })).toBeInTheDocument();
    expect(screen.getByText("Esto puede tardar unos segundos.")).toBeInTheDocument();
    starting.unmount();

    const toBusiness = renderStatus({ status: "switching", targetName: "Grupo Delta" });
    expect(screen.getByRole("heading", { name: "Cambiando a Grupo Delta…" })).toBeInTheDocument();
    toBusiness.unmount();

    const toPersonal = renderStatus({ status: "switching", targetName: "Personal" });
    expect(screen.getByRole("heading", { name: "Cambiando a Personal…" })).toBeInTheDocument();
    toPersonal.unmount();

    const closing = renderStatus({ status: "closing" });
    expect(screen.getByRole("heading", { name: "Cerrando sesión…" })).toBeInTheDocument();
    closing.unmount();

    renderStatus({ status: "error", loginPath: "/login/empresa" });
    expect(screen.getByRole("heading", { name: "No pudimos iniciar tu sesión" })).toBeInTheDocument();
    expect(screen.getByText("Volvé a ingresar. Si vuelve a pasar, probá en otra ventana.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("href", "/login/empresa");
    // Tablero Sesion (.b.b-pri.lg de 280): el botón principal de 44, con el degradé y la sombra; el título y el texto con
    // la altura normal de su letra.
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("data-variant", "default");
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveClass("h-11", "w-[280px]");
    expect(screen.getByRole("heading", { name: "No pudimos iniciar tu sesión" })).toHaveClass("leading-[normal]");
    expect(screen.getByText("Volvé a ingresar. Si vuelve a pasar, probá en otra ventana.")).toHaveClass("leading-[normal]");
  });

  it("mantiene el estado de error accesible", async () => {
    const { container } = renderStatus({ status: "error" });
    expect(container.querySelector(".brand-mark > span")).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero M-Sesion: en el teléfono la pantalla es blanca, sin la marca arriba; al entrar o salir, la marca grande y
  // un giro chico; al cambiar de lado, las iniciales con el giro alrededor; si falla, «Volver a ingresar» fijo abajo.
  it("en el teléfono es la pantalla de una app", () => {
    const restore = asPhone();
    try {
      const starting = renderStatus({ status: "starting" });
      expect(starting.container.querySelector(".brand-mark")).toHaveClass("size-[76px]!");
      expect(starting.container.querySelectorAll(".brand-mark")).toHaveLength(1);
      starting.unmount();

      const switching = renderStatus({ status: "switching", targetName: "Grupo Delta" });
      expect(screen.getByText("GD")).toHaveClass("size-[66px]", "bg-[var(--marca-t)]");
      switching.unmount();

      renderStatus({ status: "error", loginPath: "/login" });
      expect(screen.getByRole("link", { name: "Volver a ingresar" }).parentElement).toHaveAttribute("data-slot", "fixed-actions");
      // M-Sesion (.cb.cb-pri): el principal con su degradé, como en la compu.
      expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("data-variant", "default");
    } finally {
      restore();
    }
  });
});
