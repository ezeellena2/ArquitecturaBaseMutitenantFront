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

// Tableros Inicio-Org, Usuarios, Roles, Empresas, Cuenta y sus M-* (.ab-sidebar__link, .ini-ico, .banda-pag .ico): el marco,
// el título y los atajos de los inicios dibujan las áreas con los íconos del lienzo, no con los de lucide, que llenan más
// la caja (2 a 4 px más grandes a 18 y a 24 px).
describe("los íconos de las áreas", () => {
  const paths = (Icono: Icono) => [...render(<Icono />).container.querySelectorAll("svg > *")].map((element) =>
    element.tagName === "circle" ? `circle ${element.getAttribute("cx")} ${element.getAttribute("cy")} ${element.getAttribute("r")}` : element.getAttribute("d"));

  it("dibujan los del marco del tablero", () => {
    expect(paths(icons.HomeIcon)).toEqual(["M3 11 12 4l9 7", "M5 10v10h14V10", "M10 20v-6h4v6"]);
    expect(paths(icons.UsersIcon)).toEqual([
      "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20", "circle 10 8 3.5", "M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4", "M15.5 4.7a3.5 3.5 0 0 1 0 6.6",
    ]);
    expect(paths(icons.KeyIcon)).toEqual(["circle 8 15 4", "m10.8 12.2 8.2-8.2", "m17 6 2 2", "m14 9 2 2"]);
    expect(paths(icons.SlidersHorizontalIcon)).toEqual(["M4 6h10", "circle 16 6 2", "M4 12h4", "M12 12h8", "circle 10 12 2", "M4 18h12", "circle 18 18 2"]);
    expect(paths(icons.ClipboardIcon)).toEqual(["M9 3.5h6v3H9z", "M15 5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3", "M9 12h6", "M9 16h4"]);
    expect(paths(icons.ShieldCheckIcon)).toEqual(["M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z", "m9.5 12 1.8 1.8 3.4-3.6"]);
    expect(paths(icons.ShieldIcon)).toEqual(["M12 3 5 6v5.5c0 4.2 2.9 7.8 7 9.5 4.1-1.7 7-5.3 7-9.5V6z"]);
    expect(paths(icons.UserIcon)).toEqual(["circle 12 8 3.75", "M5 20a7 7 0 0 1 14 0"]);
  });
});

// «Criterio · Formularios» (.aviso-mal), «Criterio · Avisos» y tableros Usuario, Rol y M-Usuario (.w-cartel, .f-banda): el
// ícono de error es un círculo de 8,5, la raya de 8 a 12,5 y el punto en 15,8; los avisos lo piden con trazo 2.
describe("el ícono de error", () => {
  it("dibuja el del tablero y acepta su trazo", () => {
    const svg = render(<icons.AlertCircleIcon strokeWidth={2} />).container.querySelector("svg")!;
    expect(svg.querySelector("circle")).toHaveAttribute("r", "8.5");
    expect([...svg.querySelectorAll("path")].map((path) => path.getAttribute("d"))).toEqual(["M12 8v4.5", "M12 15.8h.01"]);
    expect(svg).toHaveAttribute("stroke-width", "2");
  });
});

// Los controles de los tableros (.fb-sel, .sel, .pag, el menú de la cuenta): la flecha del desplegable es la chica del
// lienzo y las flechas de los controles van con trazo 2.
describe("las flechas de los controles", () => {
  it("dibujan la del tablero y aceptan su trazo", () => {
    const chevron = render(<icons.ChevronDownIcon strokeWidth={2} />).container.querySelector("svg")!;
    expect(chevron.querySelector("path")).toHaveAttribute("d", "m7 10 5 5 5-5");
    expect(chevron).toHaveAttribute("stroke-width", "2");
  });
});
