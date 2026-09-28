import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import i18n, { configureI18n } from "@/shared/i18n";
import { ConcurrencyBanner } from "./ConcurrencyBanner";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

const conflict = new ApiError(409, { code: "General.ConcurrencyConflict" });

describe("ConcurrencyBanner", () => {
  it("solo aparece para General.ConcurrencyConflict", () => {
    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <ConcurrencyBanner error={new ApiError(409, { code: "Request.InProgress" })} isDirty onSeeNew={vi.fn()} onContinueEditing={vi.fn()} />
      </I18nextProvider>,
    );
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas")).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ConcurrencyBanner error={conflict} isDirty onSeeNew={vi.fn()} onContinueEditing={vi.fn()} />
      </I18nextProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Otra persona cambió esto mientras lo editabas");
  });

  it("seguir editando cierra el aviso y conserva el formulario", async () => {
    const onSeeNew = vi.fn();
    function Harness() {
      const [value, setValue] = useState("Mi cambio");
      const [error, setError] = useState<ApiError | null>(conflict);
      return <>
        <input aria-label="Nombre" value={value} onChange={(event) => setValue(event.target.value)} />
        <ConcurrencyBanner error={error} isDirty onSeeNew={onSeeNew} onContinueEditing={() => setError(null)} />
      </>;
    }
    render(<I18nextProvider i18n={i18n}><Harness /></I18nextProvider>);

    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Mi cambio");
    expect(onSeeNew).not.toHaveBeenCalled();
  });

  it("Ver lo nuevo confirma antes de descartar cambios y nunca recarga solo", async () => {
    const onSeeNew = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <ConcurrencyBanner error={conflict} isDirty onSeeNew={onSeeNew} onContinueEditing={vi.fn()} />
      </I18nextProvider>,
    );

    expect(onSeeNew).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    expect(onSeeNew).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "¿Salir sin guardar?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Seguir editando" }));
    expect(onSeeNew).not.toHaveBeenCalled();
  });

  it("recarga la ficha al confirmar Ver lo nuevo", async () => {
    const onSeeNew = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <ConcurrencyBanner error={conflict} isDirty onSeeNew={onSeeNew} onContinueEditing={vi.fn()} />
      </I18nextProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ver lo nuevo" }));
    await userEvent.click(screen.getByRole("button", { name: "Salir sin guardar" }));
    expect(onSeeNew).toHaveBeenCalledOnce();
  });
});
