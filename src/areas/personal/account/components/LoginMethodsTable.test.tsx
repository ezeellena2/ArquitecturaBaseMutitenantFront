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
  it("muestra principal y bloquea quitar el último según el servidor", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderWithProviders(<LoginMethodsTable methods={[method]} onAction={onAction} />);
    expect(screen.getByText("Principal")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeVisible();
    expect(screen.getByText("Principal")).not.toHaveClass("rounded-full");
    await user.click(screen.getByRole("button", { name: "Acciones de ana@example.test" }));
    expect(screen.getByRole("menuitem", { name: "Quitar" })).toHaveAttribute("aria-disabled", "true");
    expect(onAction).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
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
  });
});
