import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import * as icons from "./icons";

type Icono = (props: { className?: string }) => ReactElement;

const todos = Object.entries(icons).filter(
  (entrada): entrada is [string, Icono] => typeof entrada[1] === "function",
);

describe("el set de íconos", () => {
  it("exporta más de uno", () => {
    // Si el archivo dejara de exportar componentes, los `it.each` de abajo no correrían y el archivo pasaría
    // en verde sin haber probado nada.
    expect(todos.length).toBeGreaterThan(10);
  });

  it.each(todos)("%s se oculta del lector de pantalla", (_nombre, Icono) => {
    // El fundamento visual: el SVG es decorativo y el nombre accesible lo pone el control que lo contiene.
    // Un ícono que se etiquete a sí mismo hace que el botón se anuncie dos veces.
    const { container } = render(<Icono />);
    const svg = container.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it.each(todos)("%s dibuja algo", (_nombre, Icono) => {
    // Un `d` con un typo no rompe nada: el SVG renderiza vacío y el botón queda en blanco. Esto lo atrapa.
    const { container } = render(<Icono />);

    expect(container.querySelectorAll("svg > *").length).toBeGreaterThan(0);
  });

  it.each(todos)("%s usa el trazo del set", (_nombre, Icono) => {
    const { container } = render(<Icono />);

    // Un ícono con otro trazo se nota al lado de los demás, y es lo primero que se cuela cuando alguien copia
    // uno de otra librería.
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "1.75");
  });
});

// Tableros Ingreso, Registro, Registro-Empresa, Invitacion y Perfil-Suspendido (.circulo): las pantallas de estado dibujan
// su edificio, su candado y su reloj, no los de un paquete de íconos.
describe("los íconos de las pantallas de estado", () => {
  it("dibujan el edificio, el candado y el reloj del tablero", () => {
    const building = render(<icons.BuildingIcon />).container.querySelector("svg")!;
    expect([...building.querySelectorAll("path")].map((path) => path.getAttribute("d"))).toEqual([
      "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16", "M15 9h4a1 1 0 0 1 1 1v11", "M3 21h18", "M8 8h3", "M8 12h3", "M8 16h3",
    ]);

    const lock = render(<icons.LockIcon />).container.querySelector("svg")!;
    expect(lock.querySelector("rect")).toHaveAttribute("y", "10.5");
    expect(lock.querySelector("path")).toHaveAttribute("d", "M8 10.5V8a4 4 0 0 1 8 0v2.5");

    const clock = render(<icons.ClockIcon />).container.querySelector("svg")!;
    expect(clock.querySelector("circle")).toHaveAttribute("r", "8.5");
    expect(clock.querySelector("path")).toHaveAttribute("d", "M12 7.5V12l3 2");
  });
});
