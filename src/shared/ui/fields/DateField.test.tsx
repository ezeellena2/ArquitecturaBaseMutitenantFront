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
    render(<AppProviders><FormField label="Fecha"><DateField value={null} onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Fecha" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "31/02/2026" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect((input as HTMLInputElement).checkValidity()).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá una fecha válida.");
    expect(onChange).not.toHaveBeenCalled();
  });
});
