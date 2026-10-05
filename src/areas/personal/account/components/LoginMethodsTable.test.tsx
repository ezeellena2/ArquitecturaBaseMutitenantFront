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
    // Tableros Cuenta (el ⋮ de 16, gris medio) y M-Cuenta (.ap-it .ap-ib: de 20, casi negro, en un botón de 44, y la fila de
    // 60); es el ⋮ del set, con los puntos rellenos.
    const kebab = screen.getByRole("button", { name: "Acciones de ana@delta.ejemplo.com" });
    expect(kebab).toHaveClass("size-8", "text-[var(--t2)]", "max-md:size-11", "max-md:rounded-full", "max-md:text-[var(--t1)]");
    expect(kebab.querySelector("svg")).toHaveClass("size-4", "max-md:size-5");
    expect(kebab.querySelectorAll("svg circle[fill='currentColor']")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Acciones de ana@delta.ejemplo.com" }));
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Hacer principal", "Quitar"]);
    expect(screen.getByRole("separator")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Hacer principal" }));
    expect(onAction).toHaveBeenCalledWith("primary", managed);
  });

  // Tableros Cuenta y Cuenta-Metodo: un método verificado no dice «Verificado» (solo «Principal» o «Administrado por…», o
  // nada); Google va por su nombre, con su correo debajo; el principal administrado dice las dos cosas.
  it("no dice «Verificado» y muestra Google por su nombre, con su correo debajo", () => {
    const other: AccountLoginMethod = { ...method, id: "other", value: "ana.trabajo@example.test", isPrimary: false, canRemove: true };
    const google: AccountLoginMethod = { ...method, id: "google", type: "Google", value: "ana@gmail.com", isPrimary: false, canRemove: true };
    const managedPrimary: AccountLoginMethod = { ...method, id: "managed", value: "ana@delta.ejemplo.com",
      managedByTenantId: "tenant-delta", managedByOrganizationName: "Grupo Delta" };
    renderWithProviders(<LoginMethodsTable methods={[managedPrimary, other, google]} onAction={vi.fn()} />);

    const [first, second, third] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("ana@delta.ejemplo.comPrincipal · Administrado por Grupo Delta");
    expect(second).toHaveTextContent(/^ana\.trabajo@example\.test$/);
    expect(second).toHaveClass("min-h-14");
    expect(third).toHaveTextContent(/^Googleana@gmail\.com$/);
    expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
  });

  it("ofrece verificar un pendiente y entrega su id", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const pending = { ...method, id: "pending", isPrimary: false, isVerified: false, canRemove: true };
    renderWithProviders(<LoginMethodsTable methods={[pending]} onAction={onAction} />);
    expect(screen.getByText("Sin verificar")).toBeVisible();
    const row = screen.getByRole("listitem");
    // M-Cuenta (.w-est.amb y .acc-t): en el teléfono, «Sin verificar» lleva el punto ámbar y «Verificar» va en 15, como
    // «Vincular»; en la compu (Cuenta), sin punto y en 13.
    expect(screen.getByText("Sin verificar").querySelector("[data-slot='status-dot']")).toHaveClass("bg-[var(--punto-alerta)]", "hidden", "max-md:block");
    expect(within(row).getByRole("button", { name: "Verificar" })).toHaveClass("text-[13px]", "max-md:text-[15px]");
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
