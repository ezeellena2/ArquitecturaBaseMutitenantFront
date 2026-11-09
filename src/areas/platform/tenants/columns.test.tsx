import { screen } from "@testing-library/react";
import type { TFunction } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import type { PlatformTenantResponse } from "@/shared/api/types";
import type { Column } from "@/shared/ui/DataTable";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { createOrganizationColumns } from "./columns";

beforeAll(async () => { await configureI18n(referenceDataFixture().cultures); });

const t = ((key: string) => key) as unknown as TFunction;
const ownerCell = (patch: Partial<PlatformTenantResponse>) => {
  const column = createOrganizationColumns(t).find((entry) => entry.id === "ownerName") as Extract<Column<PlatformTenantResponse>, { cell: unknown }>;
  return renderWithProviders(<p>{column.cell({ ownerName: null, ownerEmail: null, ...patch } as PlatformTenantResponse)}</p>);
};

// Tablero Organizaciones: el dueño con su nombre o, si todavía no lo tiene, su correo, que se parte después de la @.
describe("columna «Dueño» de Organizaciones", () => {
  it("un correo se parte después de la @, no en cualquier letra", () => {
    const { container } = ownerCell({ ownerEmail: "gerencia@omega.ejemplo.com" });
    expect(container.querySelector("p")?.innerHTML).toBe("gerencia@<wbr>omega<wbr>.ejemplo<wbr>.com");
  });

  it("con nombre va el nombre", () => {
    ownerCell({ ownerName: "Lucía Fernández", ownerEmail: "lucia@delta.ejemplo.com" });
    expect(screen.getByText("Lucía Fernández")).toBeVisible();
    expect(screen.queryByText(/lucia@/)).not.toBeInTheDocument();
  });
});
