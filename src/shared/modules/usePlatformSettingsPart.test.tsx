import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { useEditForm } from "@/shared/hooks/useEditForm";
import type { PlatformSettingsPartHandle } from "./types";
import { usePlatformSettingsPart } from "./usePlatformSettingsPart";

interface Read { readonly days: number; readonly version: number }
interface Values { days: number }
const partKey = ["platform", "part"] as const;
const homeKey = ["home", "state"] as const;
const toValues = (read: Read): Values => ({ days: read.days });

/// Una parte mínima de Plataforma › Configuración: su formulario con versión y la mecánica compartida.
function Part({ settings, register, send, onReset }: {
  settings: Read;
  register: (handle: PlatformSettingsPartHandle | null) => void;
  send: (values: Values, version: number) => Promise<{ version: number }>;
  onReset: () => void;
}) {
  const edit = useEditForm({ read: settings, toValues });
  usePlatformSettingsPart({ register, edit, settings, reload: () => Promise.resolve({ days: 9, version: 8 }), queryKey: partKey,
    shownIn: [homeKey], serverFields: { days: "days" }, send, onReset });
  return <>
    <input aria-label="Días" {...edit.form.register("days", { valueAsNumber: true })} />
    <p>{edit.form.formState.errors.days?.message}</p>
  </>;
}

function mount(send: (values: Values, version: number) => Promise<{ version: number }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(partKey, { days: 30, version: 4 });
  client.setQueryData(homeKey, { retentionDays: 30 });
  const handles: (PlatformSettingsPartHandle | null)[] = [];
  const onReset = vi.fn();
  const view = render(<QueryClientProvider client={client}>
    <Part settings={{ days: 30, version: 4 }} register={(handle) => handles.push(handle)} send={send} onReset={onReset} />
  </QueryClientProvider>);
  const last = () => handles.at(-1);
  return { client, handles, last, onReset, view, user: userEvent.setup() };
}

// Toda parte de Plataforma › Configuración se anota y se guarda con la misma mecánica (WhatsApp, el asistente).
describe("usePlatformSettingsPart", () => {
  it("se anota sin cambios, se vuelve a anotar al cambiar y se borra al desmontarse", async () => {
    const { last, view, user, handles } = mount(() => Promise.resolve({ version: 5 }));
    expect(last()?.isDirty).toBe(false);
    await user.clear(screen.getByRole("textbox", { name: "Días" }));
    await user.type(screen.getByRole("textbox", { name: "Días" }), "7");
    expect(last()?.isDirty).toBe(true);
    view.unmount();
    expect(handles.at(-1)).toBeNull();
  });

  it("guarda con la versión con que arrancó y relee la parte y lo que muestra lo guardado", async () => {
    const send = vi.fn((_values: Values, _version: number) => Promise.resolve({ version: 5 }));
    const { client, last, onReset, user } = mount(send);
    await user.clear(screen.getByRole("textbox", { name: "Días" }));
    await user.type(screen.getByRole("textbox", { name: "Días" }), "7");
    let saved: boolean | undefined;
    await act(async () => { saved = await last()!.save(); });
    expect(saved).toBe(true);
    expect(send).toHaveBeenCalledWith({ days: 7 }, 4);
    expect(onReset).toHaveBeenCalled();
    expect(client.getQueryState(partKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(homeKey)?.isInvalidated).toBe(true);
    expect(last()?.isDirty).toBe(false);
  });

  it("un 400 en sus campos queda en el campo y devuelve false; un 409 se tira para que lo muestre la página", async () => {
    const invalid = new ApiError(400, { status: 400, code: "Validation.Failed", errors: { days: ["Usá un número de 1 a 30."] } });
    const { last } = mount(() => Promise.reject(invalid));
    let saved: boolean | undefined;
    await act(async () => { saved = await last()!.save(); });
    expect(saved).toBe(false);
    expect(await screen.findByText("Usá un número de 1 a 30.")).toBeInTheDocument();

    const conflict = new ApiError(409, { status: 409, code: "Concurrency.Conflict" });
    const second = mount(() => Promise.reject(conflict));
    await act(async () => { await expect(second.last()!.save()).rejects.toBe(conflict); });
  });

  it("descartar vuelve a la última lectura y «Ver lo nuevo» a la relectura, cada uno con lo que la parte vuelve a cero", async () => {
    const { last, onReset, user } = mount(() => Promise.resolve({ version: 5 }));
    const input = screen.getByRole("textbox", { name: "Días" });
    await user.clear(input);
    await user.type(input, "7");
    act(() => last()!.discard());
    expect(input).toHaveValue("30");
    await act(async () => { await last()!.reload(); });
    expect(input).toHaveValue("9");
    expect(onReset).toHaveBeenCalledTimes(2);
  });
});
