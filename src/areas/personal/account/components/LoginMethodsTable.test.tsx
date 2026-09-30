import { screen } from "@testing-library/react";
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
    screen.getByRole("button", { name: "Acciones de ana@example.test" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Verificar" }));
    expect(onAction).toHaveBeenCalledWith("verify", pending);
  });
});
