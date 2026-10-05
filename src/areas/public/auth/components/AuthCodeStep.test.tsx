import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { AuthCodeStep, type AuthCodeStepProps } from "./AuthCodeStep";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ], "es-AR");
});

type Overrides = Partial<Omit<AuthCodeStepProps, "code" | "onCodeChange">>;

function Harness(props: Overrides) {
  const [code, setCode] = useState("");
  return <AuthCodeStep destination="ana@example.com" code={code} onCodeChange={setCode} onBack={vi.fn()} onVerify={vi.fn()} onResend={vi.fn()}
    resendSeconds={0} {...props} />;
}

// El paso del código del ingreso y de los dos registros (tableros Ingreso, Registro y Registro-Empresa).
describe("AuthCodeStep", () => {
  it("arma el paso con «Usar otro correo», el título, a quién mandamos el código y los seis casilleros", async () => {
    const onBack = vi.fn();
    const { container } = render(<Harness onBack={onBack} />);

    expect(screen.getByRole("heading", { level: 1, name: "Revisá tu correo" })).toHaveClass("text-[24px]", "tracking-[-0.02em]");
    const hint = screen.getByText(/Te mandamos un código a/);
    expect(hint).toHaveTextContent("Te mandamos un código a ana@example.com. Vence en 10 minutos.");
    expect(hint).toHaveClass("mt-1.5", "text-sm", "leading-normal", "text-[var(--t2)]");
    expect(screen.getByText("ana@example.com").tagName).toBe("STRONG");
    const group = screen.getByRole("group", { name: "Código" });
    expect(group).toHaveAttribute("aria-describedby", hint.id);
    expect(within(group).getAllByRole("textbox")).toHaveLength(6);
    // «Usar otro correo» es un enlace de texto (.lnk): la variante link de Button, en --marca-tx, a 4 de su flecha.
    expect(screen.getByRole("button", { name: "Usar otro correo" })).toHaveAttribute("data-variant", "link");
    expect(screen.getByRole("button", { name: "Usar otro correo" })).toHaveClass("text-[var(--marca-tx)]", "gap-1", "self-start");
    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });

  // «Criterio · Botones»: «Verificar» no se apaga; si falta el código, la franja dice qué falta y un dígito nuevo la saca.
  it("con el código incompleto, «Verificar» pide los seis números sin verificar", () => {
    const onVerify = vi.fn();
    render(<Harness onVerify={onVerify} />);

    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribí los 6 números del código.");
    expect(onVerify).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: "1" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.paste(screen.getByRole("textbox", { name: "Código 1" }), { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(onVerify).toHaveBeenCalledOnce();
  });

  it("muestra el error del servidor con sus líneas y marca los casilleros", () => {
    render(<Harness invalid message={{ text: "El código no es válido.", details: ["Te quedan 3 intentos."] }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("El código no es válido.Te quedan 3 intentos.");
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveAttribute("aria-invalid", "true");
  });

  it("«Reenviar código» cuenta los segundos, muestra la espera del servidor y se apaga mientras tanto", () => {
    const onResend = vi.fn();
    const { rerender } = render(<Harness onResend={onResend} resendSeconds={42} />);
    expect(screen.getByRole("button", { name: "Reenviar en 42 s" })).toBeDisabled();

    rerender(<Harness onResend={onResend} resendSeconds={0} resendRetryLabel="Reintentá en 0:30" />);
    expect(screen.getByRole("button", { name: "Reintentá en 0:30" })).toBeDisabled();

    rerender(<Harness onResend={onResend} resendSeconds={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    expect(onResend).toHaveBeenCalledOnce();
  });

  it("bloquea los casilleros y «Verificar» cuando se pide, con el texto propio del registro y lo de abajo", () => {
    render(<Harness locked verifyDisabled verifyLabel="Verificar y crear la cuenta" resendDisabled footer={<p>{"Volver a ingresar"}</p>} />);

    expect(screen.getByRole("textbox", { name: "Código 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Verificar y crear la cuenta" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reenviar código" })).toBeDisabled();
    expect(screen.getByText("Volver a ingresar")).toBeVisible();
  });

  // «Criterio · Botones», Guardando: mientras espera la respuesta, el botón dice qué hace, con el aro, y no se puede tocar.
  it("mientras verifica dice «Verificando…» y mientras manda otro código, «Enviando…», con el aro", () => {
    render(<Harness verifyPending resendPending />);

    for (const name of ["Verificando…", "Enviando…"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-pending", "true");
      expect(button.querySelector("[data-slot='button-ring']")).not.toBeNull();
    }
  });
});
