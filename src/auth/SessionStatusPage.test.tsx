import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
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
  });

  it("mantiene el estado de error accesible", async () => {
    const { container } = renderStatus({ status: "error" });
    expect(container.querySelector(".brand-mark > span")).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
