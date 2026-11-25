import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { pickerChoice, pickerList, type PickerOption, type PickerListInput } from "./pickerRows";

const t = ((key: string, values?: Record<string, unknown>) => key === "fields.createOption" ? `Crear «${String(values?.value)}»`
  : key === "picker.chosenOf" ? `Elegiste ${String(values?.count)} de ${String(values?.max)}` : key) as unknown as TFunction;

const options: PickerOption[] = [
  { value: "ventas", label: "Ventas" },
  { value: "rrhh", label: "Recursos humanos", description: "Personas y legajos" },
  { value: "compras", label: "Compras", keywords: "proveedores" },
  { value: "sistemas", label: "Áreas de sistemas" },
];

const input = (over: Partial<PickerListInput>): PickerListInput =>
  ({ options, multiple: false, values: [], chosen: new Set(), search: "", ...over });
const labels = (list: ReturnType<typeof pickerList>) => list.rows.map((row) => row.option.label);

// 262: lo que muestra la lista de la pieza para elegir sale de una función sin estado, que se lee y se prueba sola.
describe("pickerList", () => {
  it("busca sin tildes: primero lo que empieza así, después una palabra, en cualquier parte y al final las otras palabras", () => {
    expect(labels(pickerList(input({ search: "a" }), t))).toEqual(["Áreas de sistemas", "Ventas", "Recursos humanos", "Compras"]);
    expect(labels(pickerList(input({ search: "provee" }), t))).toEqual(["Compras"]);
    expect(pickerList(input({ search: "zzz" }), t).rows).toEqual([]);
  });

  it("«Sin …» y las elegidas de otra página van primero sin buscar; buscando, solo lo que responde", () => {
    const first = { value: "", label: "Sin área" };
    const other = { value: "legales", label: "Legales" };
    const list = pickerList(input({ first, selectedOptions: [other], values: ["legales"], chosen: new Set(["legales"]) }), t);
    expect(labels(list)).toEqual(["Sin área", "Legales", "Ventas", "Recursos humanos", "Compras", "Áreas de sistemas"]);
    expect(list.rows.map((row) => row.separated)).toEqual([false, true, true, false, false, false]);
    expect(labels(pickerList(input({ first, selectedOptions: [other], values: ["legales"], chosen: new Set(["legales"]), search: "ven" }), t))).toEqual(["Ventas"]);
  });

  it("ofrece crear lo buscado solo si no hay una igual, y lo creado se ve elegido con su texto", () => {
    expect(pickerList(input({ creatable: true, search: "Logística" }), t).create).toEqual({ value: "Logística", label: "Crear «Logística»" });
    expect(pickerList(input({ creatable: true, search: "ventas" }), t).create).toBeNull();
    expect(pickerList(input({ creatable: true, search: "Nueva", remote: { loading: true, error: null } }), t).create).toBeNull();
    const created = pickerList(input({ creatable: true, multiple: true, values: ["Logística"], chosen: new Set(["Logística"]) }), t);
    expect(created.others).toEqual([{ value: "Logística", label: "Logística" }]);
    expect(created.rows[0]).toMatchObject({ option: { label: "Logística" }, selected: true });
  });

  it("con el tope alcanzado, las no elegidas quedan apagadas con «Elegiste N de N»", () => {
    const list = pickerList(input({ multiple: true, max: 1, values: ["ventas"], chosen: new Set(["ventas"]) }), t);
    expect(list.full).toBe(true);
    expect(list.rows.map((row) => row.reason)).toEqual([null, "Elegiste 1 de 1", "Elegiste 1 de 1", "Elegiste 1 de 1"]);
  });
});

describe("pickerChoice", () => {
  it("dice lo elegido en el orden de la lista, con su línea gris si se pide, o invita a elegir", () => {
    expect(pickerChoice({ options, others: [], values: ["compras", "ventas"], multiple: true }).spoken).toBe("Ventas, Compras");
    expect(pickerChoice({ options, others: [], values: ["rrhh"], multiple: false, describeChosen: true }).spoken).toBe("Recursos humanos · Personas y legajos");
    expect(pickerChoice({ options, others: [], values: [], multiple: false, placeholder: "Elegí un área" })).toMatchObject({ empty: true, spoken: "Elegí un área" });
    expect(pickerChoice({ options, first: { value: "todas", label: "Todas" }, others: [], values: ["todas"], multiple: false })).toMatchObject({ empty: true, spoken: "Todas" });
  });
});
