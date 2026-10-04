import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import i18n, { configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "./app/AppChrome";
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
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ConcurrencyBanner error={conflict} isDirty onSeeNew={vi.fn()} onContinueEditing={vi.fn()} />
      </I18nextProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Otra persona cambió esto mientras lo editabas.");
    // Tablero «Criterio · Avisos»: un cartel de atención, ámbar, redondeado y sin borde, arriba del contenido.
    expect(screen.getByRole("alert")).toHaveClass("rounded-[10px]", "bg-[var(--alerta-t)]");
    expect(screen.getByRole("alert")).not.toHaveClass("border-b");
    // Tablero Avisos («Alguien cambió esto», .w-cartel): el mismo cartel de atención (Banner), de 44 de alto con su
    // botón chico, y el texto sin negrita en --alerta-tx.
    expect(screen.getByRole("alert")).toHaveClass("min-h-11", "py-1.5", "text-[var(--alerta-tx)]");
    expect(screen.getByRole("alert").querySelector("strong")).toBeNull();
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

  // Tablero M-Avisos («Alguien cambió esto»): en el teléfono es una banda ámbar con «Seguir editando» y «Ver lo nuevo»
  // en texto, debajo del aviso.
  it("en el teléfono es una banda con las dos salidas en texto", async () => {
    const onContinueEditing = vi.fn();
    render(<I18nextProvider i18n={i18n}><AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
      <ConcurrencyBanner error={conflict} isDirty={false} onSeeNew={vi.fn()} onContinueEditing={onContinueEditing} />
    </AppChromeProvider></I18nextProvider>);

    const banner = screen.getByRole("alert");
    expect(banner).toHaveClass("bg-[var(--alerta-t)]", "text-[var(--alerta-tx)]", "text-[14.5px]");
    const [first, second] = within(banner).getAllByRole("button");
    expect(first).toHaveTextContent("Seguir editando");
    expect(second).toHaveTextContent("Ver lo nuevo");
    await userEvent.click(first!);
    expect(onContinueEditing).toHaveBeenCalledOnce();
  });

  // Tablero Avisos («Alguien cambió esto»): el aviso termina en punto; «Seguir editando» es un enlace y «Ver lo nuevo»,
  // el botón chico que va último.
  it("en la compu, «Seguir editando» es un enlace antes de «Ver lo nuevo»", () => {
    render(<I18nextProvider i18n={i18n}><ConcurrencyBanner error={conflict} isDirty={false} onSeeNew={vi.fn()} onContinueEditing={vi.fn()} /></I18nextProvider>);

    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent("Otra persona cambió esto mientras lo editabas.");
    const [first, second] = within(banner).getAllByRole("button");
    expect(first).toHaveTextContent("Seguir editando");
    expect(first).toHaveAttribute("data-variant", "link");
    expect(second).toHaveTextContent("Ver lo nuevo");
    expect(second).toHaveAttribute("data-variant", "outline");
  });
});
