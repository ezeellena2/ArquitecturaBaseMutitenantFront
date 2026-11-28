import { act, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import { choose, pickerName } from "@/test/picker";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import type { FormCatalogFieldDetail, FormCatalogItemSortInput, FormCatalogResponse } from "../../api/types";
import { useCatalogDraft } from "../../hooks/useCatalogDraft";
import { withoutFields } from "../../test/support";
import { SortDialog } from "./SortDialog";

// Tablero FRM-Catalogo-Ordenar-13: «Proveedores» con un texto, un catálogo, un número, una fecha y un sí o no; «Rubro» está quitado.
const detail = (id: string, name: string, type: FormCatalogFieldDetail["type"], isActive = true): FormCatalogFieldDetail =>
  ({ id, key: id, name, type, required: false, unique: false, isActive, valuesCount: 0 });
const fields = [detail("f-cuit", "CUIT", "Text"), detail("f-zona", "Zona", "Catalog"), detail("f-plazo", "Plazo de pago", "WholeNumber"),
  detail("f-alta", "Alta", "Date"), detail("f-iva", "Retiene IVA", "YesNo"), detail("f-rubro", "Rubro", "Text", false)];

function mount(initial: FormCatalogItemSortInput | null = null) {
  const sorted: FormCatalogItemSortInput[] = [];
  renderWithProviders(<SortDialog open initial={initial} fields={fields} onOpenChange={() => {}} onSort={(sort) => sorted.push(sort)} />);
  return { sorted, user: userEvent.setup() };
}

const orderOf = () => screen.getByRole("button", { name: pickerName("Orden") });

describe("SortDialog con campos (FRM-Catalogo-Ordenar-13, 224)", () => {
  it("ofrece «Texto», «Código» y los campos activos guardados, y dice el sentido según el tipo", async () => {
    const { user, sorted } = mount();
    await user.click(screen.getByRole("button", { name: pickerName("Columna") }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Texto", "Código", "CUIT", "Zona", "Plazo de pago", "Alta", "Retiene IVA"]);
    await user.keyboard("{Escape}");
    expect(orderOf()).toHaveAccessibleName("Orden De la A a la Z");
    await choose(user, "Columna", "Plazo de pago");
    expect(orderOf()).toHaveAccessibleName("Orden De menor a mayor");
    await choose(user, "Columna", "Alta");
    expect(orderOf()).toHaveAccessibleName("Orden De la más antigua a la más reciente");
    await choose(user, "Columna", "Retiene IVA");
    expect(orderOf()).toHaveAccessibleName("Orden Primero «No»");
    await choose(user, "Orden", "Primero «Sí»");
    await choose(user, "Columna", "Zona");
    expect(orderOf()).toHaveAccessibleName("Orden De la Z a la A");
    await user.click(screen.getByRole("button", { name: "Ordenar" }));
    expect(sorted).toEqual([{ column: "f-zona", descending: true }]);
  });

  it("un orden pendiente por un campo que ya no está abre en «Texto»", () => {
    mount({ column: "f-rubro", descending: false });
    expect(screen.getByRole("button", { name: pickerName("Columna") })).toHaveAccessibleName("Columna Texto");
  });

  it("quitar el campo elegido en «Campos de …» cancela el orden pendiente; quitar otro lo conserva", () => {
    const catalog: FormCatalogResponse = {
      id: "c-proveedores", name: "Proveedores", source: "Manual", valueType: "Text", isActive: true, usable: true, canManage: true,
      itemCounts: { total: 0, active: 0 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 3, ...withoutFields(), fields,
    };
    const client = createQueryClient({ queries: { retry: false } });
    const wrapper = ({ children }: { children: ReactNode }) => <AppProviders client={client}>{children}</AppProviders>;
    const { result } = renderHook(() => useCatalogDraft({ pageRows: [], extraRows: [], saved: catalog, valueType: "Text" }), { wrapper });
    act(() => result.current.setSort({ column: "f-plazo", descending: false }));
    act(() => result.current.setFields({ ...result.current.fields, fields: result.current.fields.fields.filter((field) => field.id !== "f-alta") }));
    expect(result.current.sort).toEqual({ column: "f-plazo", descending: false });
    expect(result.current.fieldsDirty).toBe(true);
    act(() => result.current.setFields({ ...result.current.fields, fields: result.current.fields.fields.filter((field) => field.id !== "f-plazo") }));
    expect(result.current.sort).toBeNull();
  });
});
