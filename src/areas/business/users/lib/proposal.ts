import type { OrganizationUserResponse } from "@/shared/api/types";
import type { AssistantProposalChangeItem, AssistantProposalChangeRow, AssistantProposalValues } from "@/shared/assistant-actions";
import type { PickerOption } from "@/shared/ui/Picker";
import { organizationRoleIds, uniqueOptions, type CompanyAssignment } from "./access";

/// Las propuestas del asistente en la ficha de una persona (users.edit@1 y users.remove@1, ADR 0068 §9): lo que se aplica,
/// lo que se manda con «Guardar cambios» y «Lo que cambia». La ficha solo las conecta.

/** Lo que propone el asistente al cambiar roles, ya aplicado sobre lo guardado: los roles de la organización y, si nombra
 * una empresa, sus roles, con el nombre que trae la propuesta. */
export interface EditProposal {
  readonly roles: readonly PickerOption[];
  readonly company?: ProposedCompany;
}

export interface ProposedCompany {
  readonly id: string;
  readonly label: string;
  readonly roles: readonly PickerOption[];
}

const optionsOf = (list: AssistantProposalValues["lists"][string] | undefined): PickerOption[] =>
  (list ?? []).map((option) => ({ value: option.id, label: option.label }));

/** Lo propuesto con la forma de la ficha. Sin empresa no entran sus roles: la ficha no abre la propuesta. */
export function toEditProposal(values: AssistantProposalValues): EditProposal | undefined {
  const company = values.fields.company;
  const companyId = typeof company?.value === "string" ? company.value : "";
  const companyRoles = optionsOf(values.lists.companyRoles);
  if (!companyId && companyRoles.length > 0) return undefined;
  return { roles: optionsOf(values.lists.roles), company: companyId ? { id: companyId, label: company?.label ?? "", roles: companyRoles } : undefined };
}

/** Quitar no tiene campos: lo que se confirma es a quién, que es esta ficha. */
export const toRemoveProposal = (): true => true;

/** La empresa que nombra una propuesta, para que lo leído traiga sus roles de ahora. */
export function proposedCompanyId(values: readonly { field: string; value?: unknown }[] | undefined): string | undefined {
  const value = values?.find((entry) => entry.field === "company")?.value;
  return typeof value === "string" ? value : undefined;
}

/** Lo leído sobre lo que se aplica la propuesta: los roles de la organización de ahora y, si nombra una empresa que la
 * persona ya tiene, esa empresa con sus roles de ahora. */
export function userProposalBase(member: OrganizationUserResponse, companyId: string | undefined): AssistantProposalValues {
  const assignment = member.companies.find((company) => company.companyId === companyId);
  return {
    fields: assignment ? { company: { value: assignment.companyId, label: assignment.companyName } } : {},
    lists: {
      roles: member.roles.filter((role) => role.scope === "Organization").map((role) => ({ id: role.id, label: role.name })),
      companyRoles: assignment ? assignment.roles.map((role) => ({ id: role.id, label: role.name })) : [],
    },
    rows: {},
  };
}

/** La empresa de la propuesta como se va a mandar con «Guardar cambios»: `proposed` reemplaza a `saved` (la que la persona
 * ya tiene) o se suma; si ya la tiene con esos mismos roles, en cualquier orden, no hay nada que mandar. */
export interface ProposedCompanyChange {
  readonly saved?: CompanyAssignment;
  readonly proposed?: CompanyAssignment;
}

export function proposedCompanyChange(company: ProposedCompany | undefined, changeable: readonly CompanyAssignment[]): ProposedCompanyChange {
  if (!company) return {};
  const saved = changeable.find((item) => item.companyId === company.id);
  const roleIds = company.roles.map((role) => role.value);
  const same = saved !== undefined && saved.roleIds.length === roleIds.length && saved.roleIds.every((id) => roleIds.includes(id));
  return { saved, proposed: same ? undefined : { companyId: company.id, roleIds } };
}

/** Las empresas que se mandan con «Guardar cambios»: las que se pueden cambiar, con la de la propuesta reemplazada o sumada. */
export function companiesWithProposal(changeable: readonly CompanyAssignment[], proposed: CompanyAssignment | undefined): CompanyAssignment[] {
  return proposed ? [...changeable.filter((item) => item.companyId !== proposed.companyId), proposed] : [...changeable];
}

interface ChangeRowsInput {
  readonly member: OrganizationUserResponse;
  /** Los roles de la organización elegidos ahora: lo propuesto y lo que la persona cambió después. */
  readonly roleIds: readonly string[];
  /** Los nombres de los roles: lo guardado, lo propuesto y lo cargado. */
  readonly roleOptions: readonly PickerOption[];
  readonly company?: ProposedCompany;
  readonly companyChange: ProposedCompanyChange;
  readonly doubtOf: (field: string, item?: string) => string | undefined;
  /** «La organización» y «en la organización», como dicen la fila y su lectura. */
  readonly organization: { readonly where: string; readonly whereIn: string };
}

/** «Lo que cambia», sobre lo guardado y con lo que se va a mandar: la fila de la organización y, si cambia, la de la empresa. */
export function userProposalChangeRows({ member, roleIds, roleOptions, company, companyChange, doubtOf, organization }: ChangeRowsInput): AssistantProposalChangeRow[] {
  const item = (doubtField: string, names: readonly PickerOption[]) => (id: string): AssistantProposalChangeItem =>
    ({ key: id, label: names.find((option) => option.value === id)?.label ?? "", review: Boolean(doubtOf(doubtField, id)) });
  const savedRoleIds = organizationRoleIds(member);
  const roleItem = item("roles", roleOptions);
  const rows: AssistantProposalChangeRow[] = [{ key: "organization", where: organization.where, whereIn: organization.whereIn,
    added: roleIds.filter((id) => !savedRoleIds.includes(id)).map(roleItem), removed: savedRoleIds.filter((id) => !roleIds.includes(id)).map(roleItem) }];
  const proposed = companyChange.proposed;
  if (!company || !proposed) return rows;
  const before = companyChange.saved?.roleIds ?? [];
  const savedNames = member.companies.find((assignment) => assignment.companyId === company.id)?.roles.map((role) => ({ value: role.id, label: role.name }));
  const companyItem = item("companyRoles", uniqueOptions(company.roles, savedNames));
  rows.push({ key: company.id, where: company.label, whereIn: company.label, whereReview: Boolean(doubtOf("company")),
    added: proposed.roleIds.filter((id) => !before.includes(id)).map(companyItem), removed: before.filter((id) => !proposed.roleIds.includes(id)).map(companyItem) });
  return rows;
}
