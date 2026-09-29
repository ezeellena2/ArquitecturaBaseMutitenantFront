import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { consumerWithOrganizations, businessWithoutPermissions, platformOperator, currentUsers } from "./currentUsers";
import { renderWithProviders } from "../utils/renderWithProviders";

function ProfileProbe() {
  const { data } = useCurrentUser();
  return <output>{data ? `${data.access}: ${data.email}` : "Cargando"}</output>;
}

describe("currentUsers", () => {
  it("distingue persona sola, persona con organización, empresa sin permisos y operador", () => {
    expect(currentUsers["consumer-empty"].organizations).toHaveLength(0);
    expect(consumerWithOrganizations.access).toBe("consumer");
    expect(consumerWithOrganizations.organizations).toHaveLength(1);
    expect(businessWithoutPermissions.access).toBe("business");
    expect(businessWithoutPermissions.permissions ?? []).toHaveLength(0);
    expect(platformOperator.access).toBe("platform");
    expect(currentUsers["business-admin"].permissions ?? []).toContain("users.read");
    expect(platformOperator.permissions ?? []).toContain("platform.tenants.read");
  });

  it("renderiza una sesión y /api/me coherentes con el fixture seleccionado", async () => {
    const view = renderWithProviders(<ProfileProbe />, { as: "business-admin" });
    expect(await screen.findByText("business: ana@example.test")).toBeInTheDocument();
    view.unmount();
    renderWithProviders(<ProfileProbe />, { as: "consumer-empty" });
    expect(await screen.findByText("consumer: ana@example.test")).toBeInTheDocument();
  });
});
