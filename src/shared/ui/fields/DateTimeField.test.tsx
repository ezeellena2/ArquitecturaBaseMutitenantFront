import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { FormField } from "../FormField";
import { DateTimeField } from "./DateTimeField";
import { TimeField } from "./TimeField";

describe("DateTimeField y TimeField", () => {
  beforeEach(() => { queryClient.clear(); resetHttpClient(); localStorage.clear(); });

  it("muestra la zona efectiva y emite el instante ISO UTC", async () => {
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Fecha y hora"><DateTimeField value="2026-09-27T17:35:00Z" onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Fecha y hora" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("27/09/2026 14:35");
    fireEvent.change(input, { target: { value: "28/09/2026 14:35" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-09-28T17:35:00Z");
  });

  it("mantiene TimeOnly como hora civil sin zona", async () => {
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Hora"><TimeField value="14:35:00" onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Hora" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("14:35");
    fireEvent.change(input, { target: { value: "16:15" } });
    expect(onChange).toHaveBeenLastCalledWith("16:15:00");
  });

  it("usa la cultura local elegida sin cambiar la zona predeterminada", async () => {
    localStorage.setItem("arquitecturabasemt.culture", "en-US");
    const onChange = vi.fn();
    render(<AppProviders><FormField label="Date and time"><DateTimeField value="2026-09-27T17:35:00Z" onChange={onChange} /></FormField></AppProviders>);
    const input = await screen.findByRole("textbox", { name: "Date and time" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("09/27/2026 2:35 PM");
    fireEvent.change(input, { target: { value: "09/28/2026 2:35 PM" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-09-28T17:35:00Z");
  });
});
