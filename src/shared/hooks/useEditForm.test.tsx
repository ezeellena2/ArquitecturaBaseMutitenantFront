import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useEditForm, type EditForm } from "./useEditForm";

/// Una lectura de la ficha, con su versión, como `RoleResponse` o `OrganizationSettingsResponse`.
interface Read { readonly name: string; readonly note: string; readonly version: number }
interface Values { name: string; note: string }

const first: Read = { name: "Grupo Delta", note: "Lo guardado", version: 1 };
const toValues = (read: Read | undefined): Values => ({ name: read?.name ?? "", note: read?.note ?? "" });

/// Una ficha mínima que arma el formulario con el hook, como Configuración. `expose` deja a la prueba hacer lo que hace
/// la pantalla después de una relectura propia («Ver lo nuevo», «Descartar cambios», una escritura que salió bien).
function Editor({ read, onSave, expose }: {
  read: Read;
  onSave: (request: Values & { version: number | undefined }) => void;
  expose: (edit: EditForm<Read, Values, Values>) => void;
}) {
  const edit = useEditForm({ read, toValues });
  expose(edit);
  const submit = edit.form.handleSubmit((values) => onSave({ ...values, version: edit.version }));
  return <form onSubmit={(event) => { void submit(event); }}>
    <input aria-label="Nombre" {...edit.form.register("name")} />
    <input aria-label="Nota" {...edit.form.register("note")} />
    <p data-testid="estado">{edit.form.formState.isDirty ? "Cambios sin guardar" : ""}</p>
    <button type="submit">{"Guardar"}</button>
  </form>;
}

function renderEditor() {
  const onSave = vi.fn();
  let edit: EditForm<Read, Values, Values> | undefined;
  const expose = (current: EditForm<Read, Values, Values>) => { edit = current; };
  const view = render(<Editor read={first} onSave={onSave} expose={expose} />);
  return {
    onSave,
    edit: () => edit!,
    // Lo que hace TanStack Query cuando relee en el fondo: la pantalla recibe la lectura nueva.
    readAgain: (read: Read) => view.rerender(<Editor read={read} onSave={onSave} expose={expose} />),
  };
}

describe("useEditForm", () => {
  it("manda la versión de la lectura con la que arrancó, aunque llegue una relectura con otra", async () => {
    const user = userEvent.setup();
    const { onSave, readAgain } = renderEditor();

    readAgain({ name: "Grupo Delta Sur", note: "Lo cambió otra persona", version: 2 });
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Grupo Delta");
    await user.type(screen.getByRole("textbox", { name: "Nota" }), " y más");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSave).toHaveBeenCalledWith({ name: "Grupo Delta", note: "Lo guardado y más", version: 1 });
  });

  it("«Ver lo nuevo» y «Descartar cambios» reinician con una lectura: lo que se ve y la versión salen de ella", async () => {
    const user = userEvent.setup();
    const { onSave, edit, readAgain } = renderEditor();
    const fresh = { name: "Grupo Delta Sur", note: "Lo cambió otra persona", version: 2 };
    readAgain(fresh);
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), " Norte");

    act(() => edit().resetTo(fresh));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Grupo Delta Sur");
    expect(screen.getByTestId("estado")).toBeEmptyDOMElement();
    await user.type(screen.getByRole("textbox", { name: "Nota" }), ".");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSave).toHaveBeenCalledWith({ name: "Grupo Delta Sur", note: "Lo cambió otra persona.", version: 2 });
  });

  it("después de una escritura propia que partió de la base, su relectura es la base y lo que se sigue escribiendo queda", async () => {
    const user = userEvent.setup();
    const { onSave, edit } = renderEditor();
    await user.clear(screen.getByRole("textbox", { name: "Nombre" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Borrador");

    act(() => edit().wrote(1, { ...first, note: "Lo que dejó la escritura", version: 2 }));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Borrador");
    expect(screen.getByRole("textbox", { name: "Nota" })).toHaveValue("Lo que dejó la escritura");
    expect(screen.getByTestId("estado")).toHaveTextContent("Cambios sin guardar");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSave).toHaveBeenCalledWith({ name: "Borrador", note: "Lo que dejó la escritura", version: 2 });
  });

  it("una escritura que partió de otra versión no mueve la base: el próximo guardado da 409", async () => {
    const user = userEvent.setup();
    const { onSave, edit } = renderEditor();

    act(() => edit().wrote(7, { ...first, note: "Lo de otra persona", version: 8 }));
    await user.type(screen.getByRole("textbox", { name: "Nota" }), ".");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onSave).toHaveBeenCalledWith({ name: "Grupo Delta", note: "Lo guardado.", version: 1 });
  });
});
