import { screen } from "@testing-library/react";
import type { TFunction } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import type { OrganizationUserResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { createUserColumns } from "./columns";

beforeAll(async () => { await configureI18n(referenceDataFixture().cultures); });

const t = ((key: string) => key) as unknown as TFunction;
const user = (patch: Partial<OrganizationUserResponse>) => ({ memberId: "member-1", userId: null, displayName: "", email: null, phone: null,
  state: "Invited", hasManagedEmail: false, roles: [], companies: [], ...patch }) as unknown as OrganizationUserResponse;
const emailCell = (row: OrganizationUserResponse) => {
  const column = createUserColumns(t).find((entry) => entry.id === "email") as Extract<Column<OrganizationUserResponse>, { cell: unknown }>;
  return renderWithProviders(<p>{column.cell(row)}</p>);
};

// Tablero Usuarios: la columna «Correo» lleva solo el correo, en gris; una invitación por teléfono va con «—».
describe("columna «Correo» de Usuarios", () => {
  it("una invitación por teléfono no repite el teléfono", async () => {
    emailCell(user({ phone: "+5491155558812" }));
    expect(await screen.findByRole("img", { name: "Sin dato" })).toHaveTextContent("—");
    expect(screen.queryByText(/5555/)).not.toBeInTheDocument();
  });

  it("el correo va en gris", () => {
    emailCell(user({ email: "lucia.fernandez@delta.ejemplo.com", displayName: "Lucía Fernández", state: "Active" }));
    expect(screen.getByText("lucia.fernandez@delta.ejemplo.com")).toHaveClass("text-[var(--t2)]");
  });
});
