import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { platformPermissions } from "@/auth/usePermissions";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { consumerWithOrganizations, businessWithoutPermissions, platformOperator, currentUsers } from "./currentUsers";
import { renderWithProviders } from "../utils/renderWithProviders";

function ProfileProbe() {
  const { data } = useCurrentUser();
  return <output>{data ? `${data.access}: ${data.email}` : "Cargando"}</output>;
}

describe("currentUsers", () => {
  it("los fixtures de operadores son exclusivos de Plataforma y reflejan sus permisos reales", () => {
    expect(platformOperator.effectivePermissions.platform).toEqual([...platformPermissions]);
    expect(currentUsers["platform-operator-reader"].effectivePermissions.platform).toEqual(["platform.tenants.read", "platform.accounts.read"]);
    expect(currentUsers["visual-operator"]).toMatchObject({ displayName: "Martín Sosa", email: "martin.sosa@arquitecturabase.ejemplo.com" });
    for (const as of ["platform-operator", "platform-operator-reader", "visual-operator"] as const) {
      expect(currentUsers[as].hasPersonalSpace).toBe(false);
      expect(currentUsers[as].organizations).toEqual([]);
      expect(currentUsers[as].effectivePermissions.organization).toEqual([]);
      expect(currentUsers[as].permissions).toEqual(currentUsers[as].effectivePermissions.organization);
      expect(currentUsers[as].permissions).toEqual([]);
      expect(currentUsers[as].effectivePermissions.companies).toEqual({});
    }
  });

  it("Node importa los fixtures como datos puros, como los arneses de captura y vista en vivo", () => {
    const module = pathToFileURL(resolve("src/test/mocks/currentUsers.ts")).href;
    const source = `const { currentUsers } = await import(${JSON.stringify(module)}); process.stdout.write(currentUsers["visual-operator"].displayName);`;
    expect(execFileSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8" })).toBe("Martín Sosa");
  });
  it("distingue persona sola, persona con organización, empresa sin permisos y operador", () => {
    expect(currentUsers["consumer-empty"].organizations).toHaveLength(0);
    expect(consumerWithOrganizations.access).toBe("consumer");
    expect(consumerWithOrganizations.organizations).toHaveLength(1);
    expect(businessWithoutPermissions.access).toBe("business");
    expect(businessWithoutPermissions.effectivePermissions.organization).toHaveLength(0);
    expect(platformOperator.access).toBe("platform");
    expect(currentUsers["business-admin"].effectivePermissions.organization).toContain("users.read");
    // Como /api/me: `permissions` repite los de la organización.
    expect(currentUsers["business-admin"].permissions).toEqual(currentUsers["business-admin"].effectivePermissions.organization);
  });

  it("renderiza una sesión y /api/me coherentes con el fixture seleccionado", async () => {
    const view = renderWithProviders(<ProfileProbe />, { as: "business-admin" });
    expect(await screen.findByText("business: ana@example.test")).toBeInTheDocument();
    view.unmount();
    renderWithProviders(<ProfileProbe />, { as: "consumer-empty" });
    expect(await screen.findByText("consumer: ana@example.test")).toBeInTheDocument();
  });
});
