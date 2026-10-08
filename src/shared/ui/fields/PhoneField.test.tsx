import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { configureI18n } from "@/shared/i18n";
import { FormatProvider } from "@/shared/format/useFormat";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { AppChromeProvider } from "../app/AppChrome";
import { FormField } from "../FormField";
import { PhoneField, type PhoneDraft } from "./PhoneField";

function renderField(props: { allowedCountries?: readonly string[]; usage?: "whatsapp" | "mobile" | "any"; initialValue?: PhoneDraft } = {}, { phone = false } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onValidityChange = vi.fn();
  function Harness() {
    const [value, setValue] = useState<PhoneDraft | null>(props.initialValue ?? null);
    return (
      <FormatProvider>
        <FormField label="Teléfono" hint="Para avisos de la cuenta">
          <PhoneField value={value} onChange={setValue} onValidityChange={onValidityChange} {...props} />
        </FormField>
        <output>{JSON.stringify(value)}</output>
      </FormatProvider>
    );
  }
  render(<QueryClientProvider client={client}>
    <AppChromeProvider value={{ phone, parent: null, subtitle: null, hideBottomNav: () => {} }}><Harness /></AppChromeProvider>
  </QueryClientProvider>);
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
    // El país compacto en una caja de 112 al lado del número: la bandera (una imagen, no un emoji) y «+54». Decisión del
    // usuario del 2026-10-04.
    const country = screen.getByRole("combobox", { name: "País: Argentina, +54" });
    // Lienzo v98: la bandera de 24×16 con esquinas de 2 y un borde gris suave, a 6 del prefijo.
    const flag = await within(country).findByRole("img", { name: "Argentina" });
    expect(flag).toHaveClass("h-4", "w-6", "rounded-[2px]", "shadow-[0_0_0_1px_var(--borde-bandera)]");
    expect(flag.parentElement).toHaveClass("gap-1.5");
    expect(country).toHaveTextContent(/^\+54$/);
    // 112 en la compu (Pagina-Org) y 124 en el teléfono (M-Pagina-Org y M-Cuenta-Agregar, lienzo v99).
    expect(country.parentElement).toHaveClass("w-[112px]", "max-md:w-[124px]");

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
    // Lienzo v98: el nombre del país y, a la derecha y en gris, su prefijo.
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual([
      "Argentina +54", "Uruguay +598",
    ]);
    expect(within(screen.getByRole("option", { name: "Argentina +54" })).getByText("+54")).toHaveClass("ml-auto", "text-[var(--t2)]");
    await userEvent.setup().keyboard("{Escape}");

    fireEvent.change(input, { target: { value: "+598 94 123 456" } });
    expect(screen.getByRole("combobox", { name: "País: Uruguay, +598" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent('"country":"UY"');
    expect(input).not.toHaveValue(expect.stringContaining("+598"));
  });

  // Tablero M-Cuenta-Agregar: en el teléfono el país se elige en la hoja «País», con la bandera, el nombre y el prefijo.
  it("en el teléfono elige el país en la hoja «País»", async () => {
    renderField({}, { phone: true });
    const input = screen.getByRole("textbox", { name: "Teléfono" });
    await waitFor(() => expect(input).toBeEnabled());
    await userEvent.setup().click(screen.getByRole("combobox", { name: "País: Argentina, +54" }));
    const sheet = await screen.findByRole("dialog", { name: "País" });
    expect(within(sheet).getByRole("option", { name: "Argentina +54" })).toHaveAttribute("aria-selected", "true");
  });

  it("no marca válido un número incompleto", async () => {
    const { onValidityChange } = renderField();
    const input = screen.getByRole("textbox", { name: "Teléfono" });
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "11 2" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
  });

  it("WhatsApp espera la capacidad y cruza sus países con los nombres y prefijos del catálogo", async () => {
    let release: (() => void) | undefined;
    server.use(http.get("/api/auth/methods", async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["UY", "ZZ"] }] });
    }));
    renderField({ usage: "whatsapp" });
    const input = screen.getByRole("textbox", { name: "Teléfono" });
    expect(input).toBeDisabled();
    await waitFor(() => expect(release).toBeDefined());
    release?.();
    await waitFor(() => expect(input).toBeEnabled());
    const selector = screen.getByRole("combobox", { name: "País: Uruguay, +598" });
    selector.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual(["Uruguay +598"]);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("sin canal WhatsApp no permite cargar un teléfono aunque el catálogo tenga países", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }] })));
    renderField({ usage: "whatsapp" });
    await waitFor(() => expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-busy", "true"));
    expect(screen.getByRole("textbox", { name: "Teléfono" })).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("conserva visible un país guardado retirado del canal, sin ofrecerlo como opción nueva", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["UY"] }] })));
    renderField({ usage: "whatsapp", initialValue: { country: "AR", number: "11 2345-6789" } });
    const selector = await screen.findByRole("combobox", { name: "País: Argentina, +54" });
    await waitFor(() => expect(selector).toBeEnabled());
    expect(selector).toHaveTextContent(/^\+54$/);
    expect(await within(selector).findByRole("img", { name: "Argentina" })).toBeVisible();
    selector.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(screen.queryByRole("option", { name: "Argentina +54" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Uruguay +598" })).toBeVisible();
  });

  it.each([10, 11])("WhatsApp con %i países muestra buscador sólo al superar diez", async (count) => {
    const fixture = referenceDataFixture();
    const countries = [
      ["AR", "Argentina", "54"], ["UY", "Uruguay", "598"], ["US", "Estados Unidos", "1"],
      ["BR", "Brasil", "55"], ["CL", "Chile", "56"], ["MX", "México", "52"],
      ["ES", "España", "34"], ["FR", "Francia", "33"], ["DE", "Alemania", "49"],
      ["GB", "Reino Unido", "44"], ["CA", "Canadá", "1"],
    ].slice(0, count).map(([code, name, callingCode], index) => ({ ...fixture.countries[0], code, name, callingCode, sortOrder: index }));
    server.use(
      http.get("/api/reference-data", () => HttpResponse.json({ ...fixture, countries })),
      http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: countries.map((item) => item.code) }] })),
    );
    renderField({ usage: "whatsapp" });
    const selector = await screen.findByRole("combobox", { name: "País: Argentina, +54" });
    await waitFor(() => expect(selector).toBeEnabled());
    selector.focus();
    const user = userEvent.setup();
    await user.keyboard("{Enter}");
    expect(screen.getAllByRole("option")).toHaveLength(count);
    if (count === 10) expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    else {
      const search = screen.getByRole("searchbox", { name: "Buscar país" });
      await user.type(search, "+598");
      expect(screen.getAllByRole("option").map((item) => item.textContent)).toEqual(["Uruguay +598"]);
      expect(selector).toHaveTextContent("+54");
    }
  });
});
