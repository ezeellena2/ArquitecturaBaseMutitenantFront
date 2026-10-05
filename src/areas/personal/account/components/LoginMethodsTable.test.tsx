import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import type { AccountLoginMethod } from "@/shared/api/types";
import { LoginMethodsTable } from "./LoginMethodsTable";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
const method: AccountLoginMethod = { id: "only", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: true, canRemove: false, canMakePrimary: false };

describe("métodos de cuenta", () => {
  it("muestra principal y, si el servidor no deja quitar el último, no ofrece ⋮", () => {
    renderWithProviders(<LoginMethodsTable methods={[method]} onAction={vi.fn()} />);
    expect(screen.getByText("Principal")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeVisible();
    expect(screen.getByText("Principal")).not.toHaveClass("rounded-full");
    // Criterio · Menús: solo lo que se puede hacer con esa fila; nada de opciones grises.
    expect(screen.queryByRole("button", { name: "Acciones de ana@example.test" })).not.toBeInTheDocument();
  });
  // Tablero Cuenta (lienzo v96): el ⋮ va solo en las filas con acciones. El principal, único método personal, no lo
  // lleva; el correo de la empresa sí, con «Hacer principal» y, separado, «Quitar».
  it("el correo de la empresa lleva ⋮ con «Hacer principal» y «Quitar»; el principal personal, no", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const managed: AccountLoginMethod = { ...method, id: "managed", value: "ana@delta.ejemplo.com", isPrimary: false, canRemove: true, canMakePrimary: true,
      managedByTenantId: "tenant-delta", managedByOrganizationName: "Grupo Delta" };
    renderWithProviders(<LoginMethodsTable methods={[method, managed]} onAction={onAction} />);

    expect(screen.queryByRole("button", { name: "Acciones de ana@example.test" })).not.toBeInTheDocument();
    expect(screen.getByText("Administrado por Grupo Delta")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Acciones de ana@delta.ejemplo.com" }));
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Hacer principal", "Quitar"]);
    expect(screen.getByRole("separator")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Hacer principal" }));
    expect(onAction).toHaveBeenCalledWith("primary", managed);
  });

  it("ofrece verificar un pendiente y entrega su id", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const pending = { ...method, id: "pending", isPrimary: false, isVerified: false, canRemove: true };
    renderWithProviders(<LoginMethodsTable methods={[pending]} onAction={onAction} />);
    expect(screen.getByText("Sin verificar")).toBeVisible();
    const row = screen.getByRole("listitem");
    await user.click(within(row).getByRole("button", { name: "Verificar" }));
    expect(onAction).toHaveBeenCalledWith("verify", pending);
  });

  it("muestra Google sin vincular en la misma lista cuando puede agregarse", async () => {
    renderWithProviders(<LoginMethodsTable methods={[]} canLinkGoogle onAction={() => {}} />);

    const row = screen.getByRole("listitem");
    expect(within(row).getByText("Google")).toBeVisible();
    expect(within(row).getByText("Sin vincular")).toBeVisible();
    expect(within(row).getByRole("button", { name: "Vincular Google" })).toBeVisible();
    // Tablero Cuenta: «Vincular» es un botón con borde, no un enlace.
    expect(within(row).getByRole("button", { name: "Vincular Google" })).toHaveAttribute("data-variant", "outline");
    // Es el botón chico de siempre (32 y letra de 13), no uno propio de 28.
    expect(within(row).getByRole("button", { name: "Vincular Google" })).toHaveClass("h-8", "text-[13px]");
    expect(within(row).getByRole("button", { name: "Vincular Google" })).not.toHaveClass("h-7", "text-[12.5px]");
  });
});
