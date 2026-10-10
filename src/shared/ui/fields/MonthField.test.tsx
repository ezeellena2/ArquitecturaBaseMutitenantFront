import { useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { FormField } from "../FormField";
import { MonthField } from "./MonthField";

describe("MonthField", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
    await changeCulture("es-AR");
  });

  it("elige mes y año por teclado, devuelve foco y nunca envía el formulario", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    function Example() {
      const [value, setValue] = useState<string | null>("2026-10");
      return <form onSubmit={submit}><FormField label="Mes"><MonthField value={value} onChange={setValue} /></FormField></form>;
    }
    renderWithProviders(<Example />);
    const trigger = screen.getByRole("combobox", { name: /Mes/ });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).toHaveTextContent("Octubre de 2026");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Octubre" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Noviembre de 2026"));
    expect(trigger).toHaveFocus();
    await user.keyboard(" ");
    const year = screen.getByRole("textbox", { name: "Año" });
    fireEvent.change(year, { target: { value: "0001" } });
    await user.click(screen.getByRole("option", { name: "Febrero" }));
    expect(trigger).toHaveTextContent("Febrero de 0001");
    expect(trigger).toHaveFocus();
    expect(submit).not.toHaveBeenCalled();
  });

  it("valida el año del desplegable sin emitir un mes inválido y permite los extremos", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    renderWithProviders(<MonthField aria-label="Mes" value="9999-12" onChange={change} />);
    const trigger = screen.getByRole("combobox", { name: "Mes" });
    await waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Año siguiente" })).toBeDisabled();
    const year = screen.getByRole("textbox", { name: "Año" });
    fireEvent.change(year, { target: { value: "0000" } });
    fireEvent.blur(year);
    expect(year).toHaveAttribute("aria-invalid", "true");
    expect(year).toHaveAccessibleDescription("Ingresá un año entre 0001 y 9999.");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
    fireEvent.change(year, { target: { value: "0001" } });
    expect(screen.getByRole("button", { name: "Año anterior" })).toBeDisabled();
    await user.click(screen.getByRole("option", { name: "Enero" }));
    expect(change).toHaveBeenLastCalledWith("0001-01");
  });

  it("actualiza valor controlado y descarta el año interno al releer o reiniciar", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { rerender } = renderWithProviders(<MonthField aria-label="Mes" value="2026-10" onChange={change} />);
    const trigger = screen.getByRole("combobox", { name: "Mes" });
    await waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);
    fireEvent.change(screen.getByRole("textbox", { name: "Año" }), { target: { value: "1234" } });
    rerender(<MonthField aria-label="Mes" value="0099-02" onChange={change} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Febrero de 0099");
    await user.click(trigger);
    expect(screen.getByRole("textbox", { name: "Año" })).toHaveValue("0099");
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Febrero" })).toHaveFocus();
    rerender(<MonthField aria-label="Mes" value="0099-02" disabled onChange={change} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toBeDisabled();
    rerender(<MonthField aria-label="Mes" value="0099-02" onChange={change} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<MonthField aria-label="Mes" value={null} onChange={change} />);
    expect(trigger).toHaveTextContent("Elegí un mes");
    await user.click(trigger);
    expect(screen.getAllByRole("option").every((option) => option.getAttribute("aria-selected") === "false")).toBe(true);
    await user.keyboard("{Escape}");
    expect(change).not.toHaveBeenCalled();
  });

  it("distingue un valor inválido del vacío opcional y mantiene la asociación del error", async () => {
    const validity = vi.fn();
    const { rerender } = renderWithProviders(<FormField label="Mes"><MonthField value="2026-13" onChange={vi.fn()} onValidityChange={validity} /></FormField>);
    const trigger = screen.getByRole("combobox", { name: /Mes/ });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Ingresá un mes válido.");
    expect(validity).toHaveBeenLastCalledWith(false);
    rerender(<FormField label="Mes"><MonthField value={null} onChange={vi.fn()} onValidityChange={validity} /></FormField>);
    expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    expect(validity).toHaveBeenLastCalledWith(true);
  });

  it("cierra al pasar a otro control sin quitarle el foco", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><MonthField aria-label="Mes" value="2026-10" onChange={vi.fn()} /><button type="button">{"Otro control"}</button></>);
    const trigger = screen.getByRole("combobox", { name: "Mes" });
    await waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);
    const other = screen.getByRole("button", { name: "Otro control" });
    await user.click(other);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(other).toHaveFocus();
  });

  it("espera el catálogo, aplica el último valor recibido y localiza en inglés", async () => {
    await changeCulture("en-US");
    let release: (() => void) | undefined;
    server.use(http.get("/api/reference-data", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json(referenceDataFixture());
    }));
    const { rerender } = renderWithProviders(<MonthField aria-label="Month" value="2026-10" onChange={vi.fn()} />);
    const trigger = screen.getByRole("combobox", { name: "Month" });
    expect(trigger).toBeDisabled();
    rerender(<MonthField aria-label="Month" value="0100-02" onChange={vi.fn()} />);
    await waitFor(() => expect(release).toBeDefined());
    release?.();
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(trigger).toHaveTextContent("February 0100");
  });

  it("en el teléfono conserva un solo popup accesible, el rótulo y la descripción externa", async () => {
    const restore = asPhone();
    try {
      const user = userEvent.setup();
      renderWithProviders(<main><FormField label="Mes" required error="Revisá el período"><MonthField value="2026-10" onChange={vi.fn()} /></FormField></main>);
      const trigger = screen.getByRole("combobox", { name: /Mes/ });
      await waitFor(() => expect(trigger).toBeEnabled());
      expect(trigger).toHaveAccessibleDescription("Revisá el período");
      expect(trigger).toHaveAttribute("aria-required", "true");
      await user.click(trigger);
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(screen.getAllByRole("listbox")).toHaveLength(1);
      expect(await axe(document.body)).toHaveNoViolations();
      await user.keyboard("{Escape}");
      expect(trigger).toHaveFocus();
    } finally { restore(); }
  });
});
