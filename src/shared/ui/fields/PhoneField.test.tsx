import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { configureI18n } from "@/shared/i18n";
import { FormatProvider } from "@/shared/format/useFormat";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { FormField } from "../FormField";
import { PhoneField, type PhoneDraft } from "./PhoneField";

function renderField(props: { allowedCountries?: readonly string[] } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onValidityChange = vi.fn();
  function Harness() {
    const [value, setValue] = useState<PhoneDraft | null>(null);
    return (
      <FormatProvider>
        <FormField label="Teléfono" hint="Para avisos de la cuenta">
          <PhoneField value={value} onChange={setValue} onValidityChange={onValidityChange} {...props} />
        </FormField>
        <output>{JSON.stringify(value)}</output>
      </FormatProvider>
    );
  }
  render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
  return { onValidityChange };
}

describe("PhoneField", () => {
  beforeEach(async () => {
    localStorage.clear();
    await configureI18n(referenceDataFixture().cultures);
    const fixture = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      countries: [
        fixture.countries[0],
        { ...fixture.countries[0], code: "UY", name: "Uruguay", callingCode: "598", sortOrder: 2 },
        { ...fixture.countries[0], code: "US", name: "Estados Unidos", callingCode: null, sortOrder: 3 },
      ],
    })));
  });

  it("usa el país de la cultura, formatea al escribir y entrega país más número nacional", async () => {
    const { onValidityChange } = renderField();
    const input = screen.getByRole("textbox", { name: "Teléfono" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("autocomplete", "tel-national");
    expect(input).toHaveAccessibleDescription("Para avisos de la cuenta");
    expect(screen.getByRole("combobox", { name: "País: Argentina, +54" })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "1123456789" } });
    expect(input).toHaveValue("11 2345-6789");
    expect(screen.getByRole("status")).toHaveTextContent('"country":"AR","number":"11 2345-6789"');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });

  it("detecta el país cuando se pega un internacional y solo ofrece países telefónicos permitidos", async () => {
    renderField({ allowedCountries: ["AR", "UY"] });
    const input = screen.getByRole("textbox", { name: "Teléfono" });
    await waitFor(() => expect(input).toBeEnabled());
    const selector = screen.getByRole("combobox", { name: "País: Argentina, +54" });
    selector.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
      "Argentina (+54)", "Uruguay (+598)",
    ]);
    await userEvent.setup().keyboard("{Escape}");

    fireEvent.change(input, { target: { value: "+598 94 123 456" } });
    expect(screen.getByRole("combobox", { name: "País: Uruguay, +598" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent('"country":"UY"');
    expect(input).not.toHaveValue(expect.stringContaining("+598"));
  });

  it("no marca válido un número incompleto", async () => {
    const { onValidityChange } = renderField();
    const input = screen.getByRole("textbox", { name: "Teléfono" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "11 2" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
  });
});
