import { describe, expect, it } from "vitest";
import type { OrganizationUserResponse } from "@/shared/api/types";
import { emptyAssistantProposalValues, type AssistantProposalValues } from "@/shared/assistant-actions";
import { companiesWithProposal, proposedCompanyChange, proposedCompanyId, toEditProposal, userProposalBase, userProposalChangeRows } from "./proposal";

const role = (id: string, name: string, scope: "Organization" | "AnyCompany") => ({ id, name, isSystemRole: false, scope, companyId: null });

// Tomás, con Ventas y Soporte en la organización y Administrador en Delta S.A.
const member = {
  roles: [role("ventas", "Ventas", "Organization"), role("admin", "Administrador", "AnyCompany"), role("soporte", "Soporte", "Organization")],
  companies: [{ companyId: "delta", companyName: "Delta S.A.", roles: [role("admin", "Administrador", "AnyCompany")] }],
} as unknown as OrganizationUserResponse;

const values = (overrides: Partial<AssistantProposalValues>): AssistantProposalValues => ({ ...emptyAssistantProposalValues, ...overrides });

describe("toEditProposal", () => {
  it("pasa lo propuesto a la ficha, con el nombre de cada rol y de la empresa", () => {
    expect(toEditProposal(values({
      fields: { company: { value: "delta", label: "Delta S.A." } },
      lists: { roles: [{ id: "caja", label: "Caja" }], companyRoles: [{ id: "lectura", label: "Solo lectura" }] },
    }))).toEqual({ roles: [{ value: "caja", label: "Caja" }], company: { id: "delta", label: "Delta S.A.", roles: [{ value: "lectura", label: "Solo lectura" }] } });
  });

  it("roles de empresa sin la empresa no entran: la ficha no abre la propuesta", () => {
    expect(toEditProposal(values({ lists: { companyRoles: [{ id: "lectura", label: "Solo lectura" }] } }))).toBeUndefined();
  });
});

describe("proposedCompanyId", () => {
  it("lee la empresa que nombra la propuesta, si es un id", () => {
    expect(proposedCompanyId([{ field: "roles", value: { op: "add", id: "caja" } }, { field: "company", value: "delta" }])).toBe("delta");
    expect(proposedCompanyId([{ field: "company", value: 3 }])).toBeUndefined();
    expect(proposedCompanyId(undefined)).toBeUndefined();
  });
});

describe("userProposalBase", () => {
  it("lo leído: los roles de la organización y, si la propuesta nombra una empresa que ya tiene, sus roles de ahora", () => {
    expect(userProposalBase(member, "delta")).toEqual({
      fields: { company: { value: "delta", label: "Delta S.A." } },
      lists: { roles: [{ id: "ventas", label: "Ventas" }, { id: "soporte", label: "Soporte" }], companyRoles: [{ id: "admin", label: "Administrador" }] },
      rows: {},
    });
  });

  it("una empresa que no tiene no trae roles", () => {
    expect(userProposalBase(member, "norte")).toMatchObject({ fields: {}, lists: { companyRoles: [] } });
  });
});

describe("proposedCompanyChange", () => {
  const changeable = [{ companyId: "delta", roleIds: ["admin", "ventas"] }];

  it("con los mismos roles, en otro orden, no hay nada que mandar", () => {
    const company = { id: "delta", label: "Delta S.A.", roles: [{ value: "ventas", label: "Ventas" }, { value: "admin", label: "Administrador" }] };
    expect(proposedCompanyChange(company, changeable)).toEqual({ saved: changeable[0], proposed: undefined });
  });

  it("con otros roles reemplaza lo guardado, y una empresa que no tiene se suma", () => {
    const delta = { id: "delta", label: "Delta S.A.", roles: [{ value: "admin", label: "Administrador" }] };
    expect(proposedCompanyChange(delta, changeable)).toEqual({ saved: changeable[0], proposed: { companyId: "delta", roleIds: ["admin"] } });
    const norte = { id: "norte", label: "Norte S.R.L.", roles: [] };
    expect(proposedCompanyChange(norte, changeable)).toEqual({ saved: undefined, proposed: { companyId: "norte", roleIds: [] } });
    expect(companiesWithProposal(changeable, { companyId: "norte", roleIds: [] })).toEqual([...changeable, { companyId: "norte", roleIds: [] }]);
    expect(companiesWithProposal(changeable, { companyId: "delta", roleIds: ["admin"] })).toEqual([{ companyId: "delta", roleIds: ["admin"] }]);
  });

  it("sin empresa en la propuesta no cambia ninguna", () => {
    expect(proposedCompanyChange(undefined, changeable)).toEqual({});
    expect(companiesWithProposal(changeable, undefined)).toEqual(changeable);
  });
});

describe("userProposalChangeRows", () => {
  const organization = { where: "Organización", whereIn: "en la organización" };
  const doubts = new Map([["roles:caja", "Assistant.Action.Doubt.Similar"], ["company:", "Assistant.Action.Doubt.Similar"]]);
  const doubtOf = (field: string, item?: string) => doubts.get(`${field}:${item ?? ""}`);

  it("la organización con lo que se suma y lo que se quita, sobre lo guardado y con su «Revisá»", () => {
    const rows = userProposalChangeRows({ member, roleIds: ["ventas", "caja"], organization, doubtOf, companyChange: {},
      roleOptions: [{ value: "ventas", label: "Ventas" }, { value: "soporte", label: "Soporte" }, { value: "caja", label: "Caja" }] });
    expect(rows).toEqual([{ key: "organization", where: "Organización", whereIn: "en la organización",
      added: [{ key: "caja", label: "Caja", review: true }], removed: [{ key: "soporte", label: "Soporte", review: false }] }]);
  });

  it("la empresa que cambia, con el nombre de lo guardado y de lo propuesto", () => {
    const company = { id: "delta", label: "Delta S.A.", roles: [{ value: "lectura", label: "Solo lectura" }] };
    const companyChange = proposedCompanyChange(company, [{ companyId: "delta", roleIds: ["admin"] }]);
    const rows = userProposalChangeRows({ member, roleIds: ["ventas", "soporte"], roleOptions: [], company, companyChange, doubtOf, organization });
    expect(rows[1]).toEqual({ key: "delta", where: "Delta S.A.", whereIn: "Delta S.A.", whereReview: true,
      added: [{ key: "lectura", label: "Solo lectura", review: false }], removed: [{ key: "admin", label: "Administrador", review: false }] });
  });
});
