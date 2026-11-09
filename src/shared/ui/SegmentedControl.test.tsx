import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
  it("is a named group of buttons that say which one is pressed", () => {
    render(
      <SegmentedControl
        aria-label="Mostrar"
        options={[
          { key: "all", label: "Todos", pressed: true, onSelect: vi.fn() },
          { key: "picked", label: "Elegidos · 3", pressed: false, onSelect: vi.fn() },
        ]}
      />,
    );

    // Sin nombre, el lector anuncia dos botones sueltos y no dice qué eligen.
    const group = screen.getByRole("group", { name: "Mostrar" });

    expect(group).toContainElement(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Elegidos · 3" })).toHaveAttribute("aria-pressed", "false");
  });

  it("selects the option that was clicked", async () => {
    const onAll = vi.fn();
    const onPicked = vi.fn();
    render(
      <SegmentedControl
        aria-label="Mostrar"
        options={[
          { key: "all", label: "Todos", pressed: true, onSelect: onAll },
          { key: "picked", label: "Elegidos · 3", pressed: false, onSelect: onPicked },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Elegidos · 3" }));

    expect(onPicked).toHaveBeenCalledTimes(1);
    expect(onAll).not.toHaveBeenCalled();
  });

  // «Criterio · Formularios», «Lo elegido, sin dudas» (142): la elegida, rellena con la marca y la letra blanca; las
  // otras, blancas sobre una vía con borde. En el teléfono, cada opción mide 44 × 44 (187), y un rótulo largo va entero.
  it("rellena la elegida con la marca, deja las otras blancas y mide 44 × 44 en el teléfono", () => {
    render(
      <SegmentedControl
        aria-label="Bandeja"
        options={[
          { key: "customers", label: "Clientes", detail: "5", pressed: true, onSelect: vi.fn() },
          { key: "internal", label: "Internos y equipos de la organización", detail: "2", pressed: false, onSelect: vi.fn() },
        ]}
      />,
    );

    const group = screen.getByRole("group", { name: "Bandeja" });
    expect(group).toHaveClass("bg-[var(--superficie)]", "shadow-[inset_0_0_0_1px_var(--borde2)]");
    expect(group).not.toHaveClass("bg-[var(--s3)]");
    const chosen = screen.getByRole("button", { name: "Clientes 5" });
    const other = screen.getByRole("button", { name: "Internos y equipos de la organización 2" });
    expect(chosen).toHaveClass("bg-[var(--marca)]", "text-[var(--superficie)]", "font-semibold");
    expect(other).toHaveClass("text-[var(--t2)]");
    expect(other).not.toHaveClass("bg-[var(--marca)]");
    // La cantidad de la elegida va en su letra blanca; la de las otras, en gris claro.
    expect(chosen.querySelector("[data-slot='segmented-detail']")).not.toHaveClass("text-[var(--t3)]");
    expect(other.querySelector("[data-slot='segmented-detail']")).toHaveClass("text-[var(--t3)]");
    for (const option of [chosen, other]) {
      expect(option).toHaveClass("max-md:min-h-11", "max-md:min-w-11");
      expect(option).not.toHaveClass("truncate", "whitespace-nowrap");
      expect(option.querySelector(".truncate")).toBeNull();
    }
  });

  it("se apaga entero mientras se manda algo", () => {
    render(
      <SegmentedControl
        aria-label="Qué querés agregar"
        disabled
        options={[
          { key: "email", label: "Correo", pressed: true, onSelect: vi.fn() },
          { key: "phone", label: "WhatsApp", pressed: false, onSelect: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Correo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "WhatsApp" })).toBeDisabled();
  });

  it("never submits the form it lives in", async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <SegmentedControl
          aria-label="Mostrar"
          options={[{ key: "all", label: "Todos", pressed: false, onSelect: vi.fn() }]}
        />
      </form>,
    );

    // El editor de un rol lo pone adentro de su `<form>`: un botón sin `type` lo enviaría.
    await userEvent.click(screen.getByRole("button", { name: "Todos" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
