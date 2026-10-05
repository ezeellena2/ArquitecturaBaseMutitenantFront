import { describe, expect, it } from "vitest";
import { companyAssignments, orderLike, organizationRoleIds, sentence } from "./access";

const role = (id: string, scope: "Organization" | "AnyCompany" | "SpecificCompany") => ({ id, name: id, isSystemRole: false, scope, companyId: null });
const company = (companyId: string, status: "Active" | "Inactive", roleIds: string[] = []) => ({
  companyId, companyName: companyId, status, roles: roleIds.map((id) => role(id, "AnyCompany")),
});

describe("organizationRoleIds", () => {
  it("toma solo los roles de la organización, en el orden de la ficha", () => {
    expect(organizationRoleIds({ roles: [role("dueno", "Organization"), role("admin", "AnyCompany"), role("soporte", "Organization")] }))
      .toEqual(["dueno", "soporte"]);
  });
});

describe("orderLike", () => {
  // Volver a lo guardado no cuenta como un cambio: lo que ya estaba conserva su lugar.
  it("lo que ya estaba conserva su lugar aunque se haya vuelto a elegir", () => {
    expect(orderLike(["a", "b"], ["b", "a"])).toEqual(["a", "b"]);
  });

  it("lo nuevo va al final, en el orden en que se eligió", () => {
    expect(orderLike(["a"], ["c", "a", "b"])).toEqual(["a", "c", "b"]);
  });

  it("lo que se sacó no vuelve, y sin nada guardado queda lo elegido", () => {
    expect(orderLike(["a", "b"], ["b"])).toEqual(["b"]);
    expect(orderLike(undefined, ["b", "a"])).toEqual(["b", "a"]);
  });
});

describe("companyAssignments", () => {
  // Tablero Usuario: una empresa inactiva (en la ficha o en el registro de empresas) se conserva como está y no se cambia.
  it("separa las empresas inactivas de las que se pueden cambiar", () => {
    const result = companyAssignments(
      [company("delta", "Active", ["admin"]), company("norte", "Inactive"), company("sur", "Active", ["ventas"])],
      [{ id: "delta", status: "Active" }, { id: "sur", status: "Inactive" }],
    );
    expect([...result.preserved]).toEqual(["norte", "sur"]);
    expect(result.changeable).toEqual([{ companyId: "delta", roleIds: ["admin"] }]);
  });
});

describe("sentence", () => {
  // «Sumamos a Ana a Delta S.A.» no lleva otro punto: el nombre ya termina en uno.
  it("no repite el punto final", () => {
    expect(sentence("Sumamos a Ana a Delta S.A..")).toBe("Sumamos a Ana a Delta S.A.");
    expect(sentence("Quitamos a Ana de Delta.")).toBe("Quitamos a Ana de Delta.");
  });
});
