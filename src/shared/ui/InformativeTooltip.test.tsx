import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { InformativeTooltip } from "./InformativeTooltip";
import { TooltipContent, TooltipProvider, Tooltip, TooltipTrigger } from "./tooltip";

const reason = "Guardá los cambios antes de publicar.";
const touch = (target: Element) => userEvent.pointer({ keys: "[TouchA]", target });

function renderInformative(onClick = vi.fn()) {
  render(<InformativeTooltip text={reason}><button type="button" onClick={onClick}>{"Publicar"}</button></InformativeTooltip>);
  return screen.getByRole("button", { name: "Publicar" });
}

// 211 (MA1-A de ArquitecturaBase): lo que solo informa, el motivo de lo apagado y la (i), se abre también con un clic, un
// toque, Enter o Espacio, igual en la compu y en el teléfono, y lo cierran Escape, salir, perder el foco o tocar afuera.
describe("InformativeTooltip · lo que solo informa (211)", () => {
  it("se abre con un clic y queda abierto", async () => {
    await userEvent.click(renderInformative());

    expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
  });

  it("se abre con un toque, que un tooltip común ignora, y queda abierto con otro toque en el control", async () => {
    const button = renderInformative();
    await touch(button);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);

    await touch(button);
    expect(screen.getByRole("tooltip")).toHaveTextContent(reason);
  });

  it("lo cierra un toque afuera", async () => {
    const button = renderInformative();
    await touch(button);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await touch(document.body);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("se abre con el foco y, después de Escape, otra vez con Enter o Espacio", async () => {
    renderInformative();
    await userEvent.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.keyboard(" ");
    expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
  });

  it("un envoltorio enfocable se abre con Enter o Espacio sin mover la página", async () => {
    render(<InformativeTooltip text={reason}><span role="img" tabIndex={0} aria-label={reason}>{"i"}</span></InformativeTooltip>);
    const icon = screen.getByRole("img", { name: reason });
    icon.focus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    icon.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
  });

  it("lo cierra salir con el mouse", async () => {
    const button = renderInformative();
    await userEvent.hover(button);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    // Radix deja pasar el mouse del control al tooltip: lo cierra cuando el puntero sigue fuera de los dos.
    await userEvent.unhover(button);
    await userEvent.pointer({ target: document.body, coords: { clientX: 500, clientY: 500 } });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("pasa axe abierto", async () => {
    const { container } = render(<main><InformativeTooltip text={reason}><button type="button">{"Publicar"}</button></InformativeTooltip></main>);
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    await screen.findByRole("tooltip");

    expect(await axe(container)).toHaveNoViolations();
  });
});

// 211: un texto de varios renglones, como la (i) de un área de Roles con un permiso por renglón, conserva sus saltos.
describe("TooltipContent", () => {
  it("respeta los saltos de renglón", async () => {
    render(<TooltipProvider><Tooltip open><TooltipTrigger>{"i"}</TooltipTrigger><TooltipContent>{"Ver usuarios\nInvitar usuarios"}</TooltipContent></Tooltip></TooltipProvider>);

    const content = document.querySelector("[data-slot='tooltip-content']");
    expect(content).toHaveClass("whitespace-pre-line");
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Ver usuarios Invitar usuarios");
  });
});
