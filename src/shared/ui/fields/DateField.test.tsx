import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { FormField } from "../FormField";
import { DateField } from "./DateField";

describe("DateField", () => {
  beforeEach(() => { queryClient.clear(); resetHttpClient(); localStorage.clear(); });

  it("edita una fecha civil cultural y emite DateOnly sin cambiarla por zona", async () => {
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Fecha"><DateField value="2026-09-27" onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Fecha" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("27/09/2026");

    fireEvent.change(input, { target: { value: "28/09/2026" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-09-28");
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("marca el calendario imposible sin emitir un contrato incorrecto", async () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<AppProviders><FormField label="Fecha"><DateField value={null} onChange={onChange}
      onValidityChange={onValidityChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Fecha" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "31/02/2026" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá una fecha válida.");
    fireEvent.change(input, { target: { value: "28/02/2026" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-02-28");
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("admite el mensaje del formulario y cede la alerta a FormField sin perder validez (E5)", async () => {
    const message = "Escribí la fecha como dd/mm/aaaa.";
    const { rerender } = render(<AppProviders><FormField label="Hasta"><DateField value={null} onChange={vi.fn()} invalidMessage={message} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Hasta" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "31/02/2026" } });
    fireEvent.blur(input);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(input).toHaveAccessibleDescription(message);
    expect((input as HTMLInputElement).checkValidity()).toBe(false);

    rerender(<AppProviders><FormField label="Hasta" error={message}><DateField value={null} onChange={vi.fn()} invalidMessage={null} /></FormField></AppProviders>);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(message);
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
    fireEvent.change(input, { target: { value: "18/10/2026" } });
    expect((input as HTMLInputElement).checkValidity()).toBe(true);
  });
});
