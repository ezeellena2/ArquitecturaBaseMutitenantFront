import { describe, expect, it } from "vitest";
import type { MeResponse } from "@/shared/api/types";
import { businessWithoutPermissions, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { formsRegistration } from "./registration";

const business = (...organization: string[]): MeResponse => ({ ...businessWithoutPermissions, features: ["forms"],
  effectivePermissions: { ...businessWithoutPermissions.effectivePermissions, organization } });
const route = (path: string) => formsRegistration.routes.find((entry) => entry.path === path)!;

describe("registro de Formularios", () => {
  it("instala el listado, el nuevo y el editor, solo en Empresa", () => {
    expect(formsRegistration.routes.map((entry) => [entry.access, entry.path]))
      .toEqual([["business", "/org/formularios/catalogos"], ["business", "/org/formularios/catalogos/nuevo"], ["business", "/org/formularios/catalogos/:id"]]);
    expect(formsRegistration.permissions).toEqual({ organization: ["formcatalogs.read", "formcatalogs.manage"], platform: [] });
    expect(Object.keys(formsRegistration.resources?.es ?? {})).toEqual(["forms", "enums"]);
    expect(Object.keys(formsRegistration.resources?.en ?? {})).toEqual(["forms", "enums"]);
  });

  it("el listado y el editor piden el módulo y «Ver catálogos»; el nuevo, «Administrar catálogos»; nunca roles", () => {
    for (const path of ["/org/formularios/catalogos", "/org/formularios/catalogos/:id"]) {
      expect(route(path).guard(business("formcatalogs.read"))).toBe("allowed");
      expect(route(path).guard({ ...business("formcatalogs.read"), features: [] })).toBe("unavailable");
      expect(route(path).guard(business())).toBe("forbidden");
      expect(route(path).guard({ ...business(), permissions: ["formcatalogs.read"] })).toBe("forbidden");
    }
    const create = route("/org/formularios/catalogos/nuevo");
    expect(create.guard(business("formcatalogs.read"))).toBe("forbidden");
    expect(create.guard(business("formcatalogs.read", "formcatalogs.manage"))).toBe("allowed");
    expect(create.guard({ ...business("formcatalogs.manage"), features: [] })).toBe("unavailable");
  });

  it("Personal y Plataforma no entran, aunque tengan la llave", () => {
    for (const entry of formsRegistration.routes) {
      expect(entry.guard({ ...consumerWithoutOrganizations, features: ["forms"] })).toBe("forbidden");
      expect(entry.guard({ ...platformOperator, features: ["forms"] })).toBe("forbidden");
    }
  });
});
