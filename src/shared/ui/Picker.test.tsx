import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AppChromeProvider } from "./app/AppChrome";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormField } from "./FormField";
import { Picker, type PickerOption } from "./Picker";

const roles: PickerOption[] = [
  { value: "owner", label: "Dueño", description: "Tiene todos los permisos de la organización.", disabledReason: "Tiene permisos que no tenés." },
  { value: "people", label: "Administración de personas", description: "Invita y edita personas y roles." },
  { value: "hr", label: "Recursos humanos", description: "Invita, edita y da de baja usuarios." },
  { value: "sales", label: "Ventas", description: "Atiende a los clientes por WhatsApp." },
  { value: "wholesale", label: "Ventas mayoristas" },
];

// Doce: más de diez, así que la lista trae su buscador.
const fields: PickerOption[] = ["Campo Don Pedro", "Campo El Ombú", "Campo El Tala", "Campo La Celina", "Campo La Esperanza", "Campo Los Álamos",
  "Campo San José", "Campo Santa Ana", "Campo Santa Rosa", "Campo Tres Arroyos", "Campo Villa Elisa", "Campo Zapallar"]
  .map((label) => ({ value: label.toLowerCase(), label }));

const phone = { phone: true, parent: null, subtitle: null, hideBottomNav: () => {} };

function Roles({ initial = [], max }: { initial?: string[]; max?: number }) {
  const [value, setValue] = useState<string[]>(initial);
  return <>
    <FormField label="Roles de la organización">
      <Picker label="Roles de la organización" multiple options={roles} value={value} onChange={setValue} placeholder="Sin roles" max={max} />
    </FormField>
    <button type="button">{"Después"}</button>
  </>;
}

function Field({ initial = null, options = fields, onChange }: { initial?: string | null; options?: PickerOption[]; onChange?: (value: string) => void }) {
  const [value, setValue] = useState<string | null>(initial);
  return <>
    <FormField label="Campo asignado">
      <Picker label="Campo asignado" options={options} value={value} onChange={(next) => { onChange?.(next); setValue(next); }}
        first={{ value: "", label: "Sin campo asignado" }} />
    </FormField>
    <button type="button">{"Después"}</button>
  </>;
}

async function openList(name: RegExp) {
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name });
  await act(async () => { trigger.focus(); });
  await user.keyboard("{Enter}");
  return { user, list: await screen.findByRole("listbox") };
}

const closed = () => waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());

describe("Picker cerrada", () => {
  it("dice lo elegido, con el nombre del campo en su nombre, y lo vacío en gris", async () => {
    await act(async () => { renderWithProviders(<><Field initial="campo el tala" /><Roles /></>); });

    const trigger = screen.getByRole("button", { name: "Campo asignado Campo El Tala" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // «Criterio · Menús» (213): en el teléfono mide 48, con letra de 16.
    expect(trigger).toHaveClass("h-9", "max-md:h-12", "max-md:text-[1rem]");
    expect(screen.getByText("Sin roles", { ignore: "[hidden]" })).toHaveClass("text-[var(--t3)]");
  });

  it("dice varias por su nombre, en el orden de la lista", async () => {
    await act(async () => { renderWithProviders(<Roles initial={["sales", "hr"]} />); });

    expect(screen.getByRole("button", { name: "Roles de la organización Recursos humanos, Ventas" })).toHaveTextContent("Recursos humanos, Ventas");
  });

  it("dice una sola con su descripción en gris cuando lo pide, como la zona horaria", async () => {
    renderWithProviders(<Picker label="Zona horaria" describeChosen value="ba" onChange={() => {}}
      options={[{ value: "ba", label: "Buenos Aires", description: "hora de Argentina · GMT−3" }]} />);

    expect(screen.getByRole("button", { name: "Zona horaria Buenos Aires · hora de Argentina · GMT−3" })).toBeInTheDocument();
    expect(screen.getByText("· hora de Argentina · GMT−3", { exact: false, ignore: "[hidden]" })).toHaveClass("text-[var(--t3)]");
  });

  it("apagada con su motivo sigue en el Tab, no abre y lo dice", async () => {
    renderWithProviders(<Picker label="Roles en la empresa" value={null} onChange={() => {}} options={roles} placeholder="Elegí una empresa primero"
      disabledReason="Elegí una empresa primero." />);
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /^Roles en la empresa/ });

    expect(trigger).toHaveAttribute("aria-disabled", "true");
    expect(trigger).not.toBeDisabled();
    expect(trigger).toHaveAccessibleDescription("Elegí una empresa primero.");
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("en la barra de un listado es el botón del filtro, con lo elegido en el color de la marca", async () => {
    renderWithProviders(<Picker trigger="button" active label="Estado" triggerLabel="Estado: activos" value="active" onChange={() => {}}
      first={{ value: "", label: "Todos" }} options={[{ value: "active", label: "Activos" }, { value: "inactive", label: "Dados de baja" }]} />);

    const trigger = screen.getByRole("button", { name: "Estado: activos" });
    expect(trigger).toHaveTextContent("Estado: activos");
    expect(trigger).toHaveClass("border-[var(--marca)]", "text-[var(--marca-tx)]");
  });
});

describe("Picker abierta", () => {
  it("abre con Enter sobre la elegida, y Escape cierra y devuelve el foco al botón", async () => {
    renderWithProviders(<Field options={fields.slice(0, 5)} initial="campo el tala" />);
    const { user, list } = await openList(/^Campo asignado/);

    expect(list).toHaveAccessibleName("Campo asignado");
    expect(list).toHaveFocus();
    const chosen = within(list).getByRole("option", { name: "Campo El Tala" });
    expect(chosen).toHaveAttribute("aria-selected", "true");
    expect(list).toHaveAttribute("aria-activedescendant", chosen.id);

    await user.keyboard("{Escape}");
    await closed();
    await waitFor(() => expect(screen.getByRole("button", { name: "Campo asignado Campo El Tala" })).toHaveFocus());
  });

  it("pone primero «Sin …», separada por una línea", async () => {
    renderWithProviders(<Field options={fields.slice(0, 3)} />);
    const { list } = await openList(/^Campo asignado/);

    const items = within(list).getAllByRole("option").map((option) => option.textContent);
    expect(items[0]).toBe("Sin campo asignado");
    expect(list.querySelector("li[role=presentation]")).not.toBeNull();
  });

  it("elige con las flechas y Enter, y cierra", async () => {
    renderWithProviders(<Field options={fields.slice(0, 5)} initial="campo el tala" />);
    const { user, list } = await openList(/^Campo asignado/);

    await user.keyboard("{ArrowDown}");
    expect(list).toHaveAttribute("aria-activedescendant", within(list).getByRole("option", { name: "Campo La Celina" }).id);
    await user.keyboard("{Enter}");

    await closed();
    expect(screen.getByRole("button", { name: "Campo asignado Campo La Celina" })).toBeInTheDocument();
  });

  it("elegir la ya elegida también avisa", async () => {
    const changed = vi.fn();
    renderWithProviders(<Field options={fields.slice(0, 5)} initial="campo el tala" onChange={changed} />);
    const { user } = await openList(/^Campo asignado/);

    await user.keyboard("{Enter}");

    await closed();
    expect(changed).toHaveBeenCalledWith("campo el tala");
  });

  it("en varias marca y desmarca sin cerrar, y lee la línea gris como descripción", async () => {
    renderWithProviders(<Roles initial={["sales"]} />);
    const { user, list } = await openList(/^Roles/);

    expect(list).toHaveAttribute("aria-multiselectable", "true");
    expect(list).toHaveAttribute("aria-activedescendant", within(list).getByRole("option", { name: "Ventas" }).id);
    expect(within(list).getByRole("option", { name: "Recursos humanos" })).toHaveAccessibleDescription("Invita, edita y da de baja usuarios.");
    await user.keyboard("{Enter}");
    expect(within(list).getByRole("option", { name: "Ventas" })).toHaveAttribute("aria-selected", "false");
    await user.click(within(list).getByRole("option", { name: "Recursos humanos" }));
    expect(within(list).getByRole("option", { name: "Recursos humanos" })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Escape}");
    await closed();
    expect(screen.getByRole("button", { name: "Roles de la organización Recursos humanos" })).toBeInTheDocument();
  });

  it("deja apagada la que no se puede elegir, con su motivo", async () => {
    renderWithProviders(<Roles />);
    const { user, list } = await openList(/^Roles/);

    const owner = within(list).getByRole("option", { name: "Dueño" });
    expect(owner).toHaveAttribute("aria-disabled", "true");
    expect(owner).toHaveAccessibleDescription("Tiene todos los permisos de la organización. Tiene permisos que no tenés.");
    await user.click(owner);
    expect(owner).toHaveAttribute("aria-selected", "false");
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Tiene permisos que no tenés.");
  });

  it("con un tope dice «Hasta 2» y, al llegar, «Elegiste 2 de 2» y apaga las demás", async () => {
    renderWithProviders(<Roles initial={["sales"]} max={2} />);
    const { user, list } = await openList(/^Roles/);

    expect(screen.getByText("Hasta 2")).toBeInTheDocument();
    await user.click(within(list).getByRole("option", { name: "Recursos humanos" }));
    expect(screen.getByText("Elegiste 2 de 2", { ignore: "[hidden]" })).toBeInTheDocument();
    expect(within(list).getByRole("option", { name: "Ventas mayoristas" })).toHaveAttribute("aria-disabled", "true");
    expect(within(list).getByRole("option", { name: "Ventas" })).not.toHaveAttribute("aria-disabled");
  });

  it("cierra con Tab y sigue al campo siguiente", async () => {
    renderWithProviders(<Roles />);
    const { user } = await openList(/^Roles/);

    await user.keyboard("{Tab}");

    await closed();
    await waitFor(() => expect(screen.getByRole("button", { name: "Después" })).toHaveFocus());
  });

  it("sin buscador, una letra lleva a la primera opción que empieza así", async () => {
    renderWithProviders(<Roles />);
    const { user, list } = await openList(/^Roles/);

    await user.keyboard("v");

    expect(list).toHaveAttribute("aria-activedescendant", within(list).getByRole("option", { name: "Ventas" }).id);
  });

  it("con más de diez trae el buscador con el foco y la cantidad, busca sin tildes y Enter no manda el formulario", async () => {
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    renderWithProviders(<form onSubmit={(event) => submit(event.nativeEvent as SubmitEvent)}><Field /></form>);
    const { user, list } = await openList(/^Campo asignado/);

    const search = screen.getByRole("combobox", { name: "Buscar en Campo asignado" });
    expect(search).toHaveFocus();
    expect(screen.getByText("12 opciones")).toBeInTheDocument();
    await user.type(search, "alamos");
    expect(within(list).getAllByRole("option").map((option) => option.textContent)).toEqual(["Campo Los Álamos"]);
    expect(screen.getByText("1 opción")).toBeInTheDocument();
    await user.keyboard("{Enter}");

    await closed();
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Campo asignado Campo Los Álamos" })).toBeInTheDocument();
  });

  it("dice cuando nada coincide", async () => {
    renderWithProviders(<Field />);
    const { user } = await openList(/^Campo asignado/);

    await user.type(screen.getByRole("combobox", { name: "Buscar en Campo asignado" }), "zzz");

    expect(screen.getByText("Ninguna opción coincide con «zzz».")).toBeInTheDocument();
    expect(screen.queryByText(/0 opciones/)).not.toBeInTheDocument();
  });

  it("no tiene problemas de accesibilidad, cerrada ni abierta", async () => {
    const { container } = renderWithProviders(<Roles initial={["sales"]} />);
    expect(await axe(container)).toHaveNoViolations();

    await openList(/^Roles/);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("Picker y el foco al cerrarse", () => {
  // Una elección que su dueño pide confirmar antes de aplicarla.
  function Asked() {
    const [value, setValue] = useState<string | null>("campo el tala");
    const [asked, setAsked] = useState<string | null>(null);
    return <>
      <FormField label="Campo asignado">
        <Picker label="Campo asignado" options={fields.slice(0, 5)} value={value} onChange={(next) => { if (next !== value) setAsked(next); }} />
      </FormField>
      <ConfirmDialog open={asked !== null} onOpenChange={(open) => { if (!open) setAsked(null); }} title="¿Cambiar el campo?" confirmLabel="Cambiar"
        onConfirm={() => { setValue(asked); setAsked(null); }} />
    </>;
  }

  it("con una confirmación que se cancela, vuelve al botón", async () => {
    renderWithProviders(<Asked />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Campo asignado Campo El Tala" }));
    await user.click(await screen.findByRole("option", { name: "Campo El Ombú" }));
    await screen.findByRole("dialog", { name: "¿Cambiar el campo?" });
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Campo asignado Campo El Tala" })).toHaveFocus());
  });

  // Una elección que muestra un campo con el foco puesto.
  function Origin() {
    const [value, setValue] = useState<string | null>("file");
    return <>
      <FormField label="Desde">
        <Picker label="Desde" options={[{ value: "file", label: "Subir un archivo" }, { value: "paste", label: "Pegar desde Excel" }]} value={value} onChange={setValue} />
      </FormField>
      {value === "paste" ? <input aria-label="Pegar filas" autoFocus /> : null}
    </>;
  }

  it("se queda donde la llevó la elección", async () => {
    renderWithProviders(<Origin />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Desde Subir un archivo" }));
    await user.click(await screen.findByRole("option", { name: "Pegar desde Excel" }));

    const field = await screen.findByRole("textbox", { name: "Pegar filas" });
    await waitFor(() => expect(field).toHaveFocus());
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    expect(field).toHaveFocus();
  });
});

describe("Picker del servidor", () => {
  function remote(overrides: Partial<RemoteOptions>): RemoteOptions {
    return { search: "", onSearch: () => {}, hasMore: false, loading: false, error: null, onLoadMore: () => {}, onRetry: () => {}, ...overrides };
  }

  function People({ state, total, value = [] as string[], others = [] as PickerOption[] }: { state: RemoteOptions; total?: number; value?: string[]; others?: PickerOption[] }) {
    return <Picker label="Clientes" multiple remote={state} total={total} value={value} onChange={() => {}} selectedOptions={others}
      options={state.loading || state.error ? [] : [{ value: "aceros", label: "Aceros Rosario" }, { value: "frio", label: "Frío Sur" }]} />;
  }

  it("dice «Buscando…» mientras busca, sin cantidad", async () => {
    renderWithProviders(<People state={remote({ search: "tom", loading: true })} total={0} />);
    await openList(/^Clientes/);

    expect(screen.getByText("Buscando…")).toBeInTheDocument();
    expect(screen.queryByText(/opciones/)).not.toBeInTheDocument();
  });

  it("si falla dice que no pudo y ofrece «Reintentar»", async () => {
    const onRetry = vi.fn();
    renderWithProviders(<People state={remote({ error: new Error("caída"), onRetry })} />);
    const { user } = await openList(/^Clientes/);

    expect(screen.getByText("No pudimos traer las opciones.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("pone primero las elegidas de otra página, cuenta el total y ofrece «Mostrar 50 más»", async () => {
    const onLoadMore = vi.fn();
    renderWithProviders(<People state={remote({ hasMore: true, onLoadMore })} total={1240} value={["rosales"]}
      others={[{ value: "rosales", label: "Ferretería Rosales" }]} />);
    expect(screen.getByRole("button", { name: "Clientes Ferretería Rosales" })).toBeInTheDocument();
    const { user, list } = await openList(/^Clientes/);

    expect(within(list).getAllByRole("option").map((option) => option.textContent)).toEqual(["Ferretería Rosales", "Aceros Rosario", "Frío Sur"]);
    expect(screen.getByText("1240 opciones")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mostrar 50 más" }));
    expect(onLoadMore).toHaveBeenCalled();
  });
});

describe("Picker en el teléfono", () => {
  it("ocupa la pantalla con el nombre del campo, y varias se aplican con «Listo (N)»", async () => {
    renderWithProviders(<AppChromeProvider value={phone}><Roles initial={["sales"]} /></AppChromeProvider>);
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: /^Roles de la organización/ });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");

    await user.click(trigger);
    const screenList = await screen.findByRole("dialog", { name: "Roles de la organización" });
    const option = within(screenList).getByRole("option", { name: "Recursos humanos" });
    expect(option).toHaveClass("min-h-14", "text-[1rem]");
    await user.click(option);
    // Marcar todavía no cambia el valor: lo aplica «Listo».
    expect(trigger).toHaveAccessibleName("Roles de la organización Ventas");

    await user.click(within(screenList).getByRole("button", { name: "Listo (2)" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Roles de la organización Recursos humanos, Ventas" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /^Roles de la organización/ })).toHaveFocus());
  });

  // M-Usuario-Base2 («Elegir los roles»): en una ficha del teléfono, la pieza es la fila con su nombre, lo elegido en gris y
  // la flecha, y abre la misma lista a pantalla completa, con la descripción, lo apagado con su motivo y «Listo (N)».
  it("como fila de una ficha dice su nombre y lo elegido, y abre la lista a pantalla completa", async () => {
    function Row() {
      const [value, setValue] = useState<string[]>(["sales"]);
      return <ul><li><Picker trigger="row" label="Roles de la organización" multiple options={roles} value={value} onChange={setValue} placeholder="Ninguno" /></li></ul>;
    }
    renderWithProviders(<AppChromeProvider value={phone}><Row /></AppChromeProvider>);
    const user = userEvent.setup();
    const row = screen.getByRole("button", { name: "Roles de la organización Ventas" });
    expect(row).toHaveTextContent(/^Roles de la organizaciónVentas$/u);
    expect(row).toHaveClass("min-h-14");
    expect(row).toHaveAttribute("aria-haspopup", "dialog");

    await user.click(row);
    const screenList = await screen.findByRole("dialog", { name: "Roles de la organización" });
    expect(within(screenList).getByRole("option", { name: /^Dueño/u })).toHaveAttribute("aria-disabled", "true");
    expect(within(screenList).getByText("Invita, edita y da de baja usuarios.")).toBeInTheDocument();
    await user.click(within(screenList).getByRole("option", { name: /^Recursos humanos/u }));
    await user.click(within(screenList).getByRole("button", { name: "Listo (2)" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Roles de la organización Recursos humanos, Ventas" })).toBeInTheDocument();
  });

  it("la ✕ descarta lo marcado", async () => {
    renderWithProviders(<AppChromeProvider value={phone}><Roles initial={["sales"]} /></AppChromeProvider>);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Roles de la organización/ }));
    const screenList = await screen.findByRole("dialog", { name: "Roles de la organización" });
    fireEvent.click(within(screenList).getByRole("option", { name: "Recursos humanos" }));

    await user.click(within(screenList).getByRole("button", { name: "Cerrar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Roles de la organización Ventas" })).toBeInTheDocument();
  });

  it("con «Sin …» primero y crear, «Sin …» elegida no es algo creado: va una sola vez, con su tilde", async () => {
    const user = userEvent.setup();
    function Tag() {
      const [value, setValue] = useState("none");
      return <Picker label="Etiqueta para todos" creatable value={value} onChange={setValue}
        first={{ value: "none", label: "Sin etiqueta" }} options={[{ value: "Mayorista", label: "Mayorista" }]} />;
    }
    renderWithProviders(<Tag />);
    await user.click(screen.getByRole("button", { name: "Etiqueta para todos Sin etiqueta" }));
    expect(screen.getAllByRole("option").map((option) => [option.textContent, option.getAttribute("aria-selected")]))
      .toEqual([["Sin etiqueta", "true"], ["Mayorista", "false"]]);
    await user.type(screen.getByRole("combobox", { name: "Buscar en Etiqueta para todos" }), "VIP");
    await user.click(screen.getByRole("option", { name: "Crear «VIP»" }));
    expect(screen.getByRole("button", { name: "Etiqueta para todos VIP" })).toBeInTheDocument();
  });
});
