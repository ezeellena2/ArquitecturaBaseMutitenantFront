import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { FormField } from "../FormField";
import { PercentField } from "./PercentField";

describe("PercentField", () => {
  beforeEach(() => { queryClient.clear(); resetHttpClient(); localStorage.clear(); });

  it("muestra porcentaje cultural y emite la fracción HTTP", async () => {
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Porcentaje"><PercentField value={0.125} onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Porcentaje" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("12,5 %");
    fireEvent.change(input, { target: { value: "25,5" } });
    expect(onChange).toHaveBeenLastCalledWith(0.255);
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("invalida un porcentaje mal escrito y avisa después de salir", async () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(<AppProviders><FormField label="Porcentaje"><PercentField value={0.125} onChange={onChange}
      onValidityChange={onValidityChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Porcentaje" });
    await waitFor(() => expect(input).toBeEnabled());

    fireEvent.change(input, { target: { value: "12.5" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un porcentaje válido.");

    fireEvent.change(input, { target: { value: "12,5" } });
    expect(onChange).toHaveBeenLastCalledWith(0.125);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
