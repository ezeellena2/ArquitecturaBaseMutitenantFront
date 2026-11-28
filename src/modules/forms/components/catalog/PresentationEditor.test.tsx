import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { pickerName } from "@/test/picker";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import type { FormCatalogPresentationDetail, FormCatalogPresentationIssues, FormCatalogValueType } from "../../api/types";
import { presentedOption, type PlaceText } from "../../lib/catalogPresentation";
import { CatalogPreviewPhone } from "./CatalogPreviewPhone";
import { PresentationEditor } from "./PresentationEditor";

// Tablero FRM-Catalogo-13: «Proveedores», con CUIT y Zona; el título es el texto y la descripción, CUIT y Zona.
const fields = [{ id: "f-cuit", name: "CUIT" }, { id: "f-zona", name: "Zona" }];
const abrasivos: Record<string, string> = { text: "Abrasivos del Sur", code: "ABR", detail: "", "field:f-cuit": "30-71234567-1", "field:f-zona": "Capital" };
const placeText = (values: Record<string, string>): PlaceText => (place) => values[place] ?? "";
const none: FormCatalogPresentationIssues = { count: 0, examples: [] };

function mount({ initial = { title: ["text"], description: ["field:f-cuit", "field:f-zona"] }, valueType = "Text", example = placeText(abrasivos),
  issues = none, editable = true }: {
  initial?: FormCatalogPresentationDetail; valueType?: FormCatalogValueType; example?: PlaceText | null; issues?: FormCatalogPresentationIssues;
  editable?: boolean;
} = {}) {
  const changes: FormCatalogPresentationDetail[] = [];
  function Harness() {
    const [value, setValue] = useState(initial);
    return <PresentationEditor value={value} valueType={valueType} fields={fields} example={example} issues={issues} editable={editable}
      onChange={(next) => { changes.push(next); setValue(next); }} />;
  }
  const view = renderWithProviders(<Harness />);
  return { ...view, changes, user: userEvent.setup() };
}

const titlePicker = () => screen.findByRole("button", { name: pickerName("Título · hasta 30 caracteres") });
const descriptionPicker = () => screen.findByRole("button", { name: pickerName("Descripción · hasta 300") });
/** El nombre de cada opción de la lista abierta, sin el motivo de la apagada. */
const optionLabels = () => screen.getAllByRole("option").map((option) => document.getElementById(option.getAttribute("aria-labelledby")!)?.textContent);

describe("«En WhatsApp» (FRM-Catalogo-13, E13 y 285)", () => {
  it("cada pieza lista los lugares en el orden del catálogo, con el valor solo si es tipado", async () => {
    const { user } = mount();
    expect(await descriptionPicker()).toHaveAccessibleName("Descripción · hasta 300 CUIT, Zona");
    await user.click(await descriptionPicker());
    expect(optionLabels()).toEqual(["Texto", "Código", "CUIT", "Zona", "Detalle"]);
    await user.keyboard("{Escape}");
    await user.click(await titlePicker());
    expect(optionLabels()).toEqual(["Texto", "Código", "CUIT", "Zona", "Detalle"]);
  });

  it("en un catálogo tipado suma «Valor» después del código", async () => {
    const { user } = mount({ valueType: "DecimalNumber" });
    await user.click(await titlePicker());
    expect(optionLabels()).toEqual(["Texto", "Código", "Valor", "CUIT", "Zona", "Detalle"]);
  });

  it("con un solo lugar en el título, ese no se quita, con su motivo; con dos, sí, y lo elegido queda en el orden del catálogo", async () => {
    const { user, changes } = mount();
    await user.click(await titlePicker());
    const texto = screen.getByRole("option", { name: /^Texto/ });
    expect(texto).toHaveAttribute("aria-disabled", "true");
    expect(texto).toHaveAccessibleDescription("El título no puede quedar vacío.");
    await user.click(texto);
    expect(changes).toEqual([]);
    await user.click(screen.getByRole("option", { name: /^Detalle/ }));
    await user.click(screen.getByRole("option", { name: /^CUIT/ }));
    expect(changes.at(-1)).toEqual({ title: ["text", "field:f-cuit", "detail"], description: ["field:f-cuit", "field:f-zona"] });
    expect(screen.getByRole("option", { name: /^Texto/ })).not.toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("option", { name: /^Texto/ }));
    expect(changes.at(-1)?.title).toEqual(["field:f-cuit", "detail"]);
  });

  it("«Por ejemplo» arma la primera opción activa como el servidor, y sin opciones activas no va", async () => {
    const { user, unmount } = mount();
    await titlePicker();
    const example = screen.getByRole("group", { name: "Por ejemplo" });
    expect(within(example).getByText("Abrasivos del Sur")).toBeInTheDocument();
    expect(within(example).getByText("30-71234567-1 · Capital")).toBeInTheDocument();
    await user.click(await descriptionPicker());
    await user.click(screen.getByRole("option", { name: /^Código/ }));
    expect(within(example).getByText("ABR · 30-71234567-1 · Capital")).toBeInTheDocument();
    unmount();
    mount({ example: null });
    await titlePicker();
    expect(screen.queryByRole("group", { name: "Por ejemplo" })).not.toBeInTheDocument();
  });

  it("un título que no entra: en rojo en «Por ejemplo» y en el teléfono, y debajo cuántas son y hasta tres ejemplos", async () => {
    const long = "Aceros y perfiles laminados para estructuras";
    const issues: FormCatalogPresentationIssues = { count: 5, examples: [
      { itemId: "i-2", text: long, issue: "TitleTooLong" },
      { itemId: "i-7", text: "Herramientas eléctricas y manuales", issue: "TitleTooLong" },
      { itemId: "i-9", text: "Cementos y morteros de alta resistencia", issue: "TitleTooLong" }] };
    const { container } = mount({ initial: { title: ["detail"], description: [] }, example: placeText({ ...abrasivos, detail: long }), issues });
    await titlePicker();
    expect(within(screen.getByRole("group", { name: "Por ejemplo" })).getByText(long)).toHaveClass("text-[var(--peligro)]");
    const notice = screen.getByText("5 opciones superan los 30 caracteres del título.").parentElement!;
    expect(notice).toHaveAttribute("role", "status");
    expect(within(notice).getAllByRole("listitem").map((item) => item.textContent)).toEqual([long, "Herramientas eléctricas y manuales",
      "Cementos y morteros de alta resistencia"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("si los ejemplos no entran por motivos distintos, dice que no entran; con una sola, en singular", async () => {
    const { unmount } = mount({ issues: { count: 2, examples: [{ itemId: "i-1", text: "Sin código", issue: "TitleEmpty" },
      { itemId: "i-2", text: "Largo", issue: "DescriptionTooLong" }] } });
    expect(await screen.findByText("2 opciones no entran en WhatsApp.")).toBeInTheDocument();
    unmount();
    mount({ issues: { count: 1, examples: [{ itemId: "i-2", text: "Largo", issue: "DescriptionTooLong" }] } });
    expect(await screen.findByText("1 opción supera los 300 caracteres de la descripción.")).toBeInTheDocument();
  });

  it("quien solo lee ve las dos piezas apagadas", async () => {
    mount({ editable: false });
    expect(await titlePicker()).toBeDisabled();
    expect(await descriptionPicker()).toBeDisabled();
  });

  it("el teléfono muestra el título y la descripción que arma, con lo que no entra en rojo", () => {
    const long = "Aceros y perfiles laminados para estructuras";
    const presentation = { title: ["detail"], description: ["field:f-cuit", "field:f-zona"] };
    renderWithProviders(<CatalogPreviewPhone withSwitch={false} options={[
      presentedOption("a", presentation, placeText({ ...abrasivos, detail: "Abrasivos" })),
      presentedOption("b", presentation, placeText({ ...abrasivos, detail: long, "field:f-zona": "Gran Buenos Aires" }))]} />);
    fireEvent.click(screen.getByRole("button", { name: /Elegí una opción/ }));
    expect(screen.getByText("Abrasivos")).not.toHaveClass("text-[var(--peligro)]");
    expect(screen.getByText(long)).toHaveClass("text-[var(--peligro)]");
    expect(screen.getByText("30-71234567-1 · Gran Buenos Aires")).toBeInTheDocument();
  });
});
