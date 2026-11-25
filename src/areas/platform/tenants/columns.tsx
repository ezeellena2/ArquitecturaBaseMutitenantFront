import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PlatformTenantDetailResponse, PlatformTenantHistoryResponse, PlatformTenantOwnerResponse, PlatformTenantResponse } from "@/shared/api/types";
import { tenantStatusTones, type StatusTones } from "@/shared/format/statusTones";
export { tenantStatusTones } from "@/shared/format/statusTones";
import type { Column } from "@/shared/ui/DataTable";
import { ListCard } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EmailText } from "@/shared/ui/format/EmailText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

export const organizationPath = (id: string) => `/plataforma/organizaciones/${encodeURIComponent(id)}`;

type OwnerState = "Active" | "Suspended" | "PendingDeletion" | "Deleted" | "Inactive" | "Removed" | "Invited";
const ownerStatusTones: StatusTones<OwnerState> = { enum: "PlatformOwnerState", tones: { Active: "success", Suspended: "warning", PendingDeletion: "warning", Deleted: "neutral", Inactive: "neutral", Removed: "neutral", Invited: "pending" } };
interface OwnerRow { id: string; name?: string | null; email?: string | null; lastSignInAtUtc?: string | null; state: OwnerState }
function ownerState(owner: PlatformTenantOwnerResponse): OwnerState {
  if (owner.identityStatus !== "Active") return owner.identityStatus;
  return owner.membershipStatus;
}
// El contacto pendiente no es una identidad ni una membresía: sólo la fila que dibuja v111 cuando todavía no hay Dueño.
export function organizationOwners(organization: PlatformTenantDetailResponse): OwnerRow[] {
  return organization.owners.length > 0
    ? organization.owners.map((owner) => ({ id: owner.id, name: owner.displayName, email: owner.email, lastSignInAtUtc: owner.lastSignInAtUtc, state: ownerState(owner) }))
    : organization.ownerEmail ? [{ id: "pending-contact", name: null, email: organization.ownerEmail, lastSignInAtUtc: null, state: "Invited" }] : [];
}
export function createOrganizationOwnerColumns(t: TFunction): Column<OwnerRow>[] {
  return [
    // Tablero Organizacion (Dueños, base de la 12): el correo en su columna.
    // Llegan enteros con la ficha: ordenan en el navegador (264).
    { id: "name", sortable: true, header: t("platformTenants:columns.owner"), type: "text", mobile: "primary", value: (row) => row.name },
    { id: "email", sortable: true, header: t("platformTenants:detail.email"), type: "text", value: (row) => row.email },
    { id: "lastSignInAtUtc", sortable: true, sortAs: "date", sortValue: (row) => row.lastSignInAtUtc, header: t("platformTenants:detail.lastSignIn"), type: "custom", cell: (row) => row.lastSignInAtUtc ? <DateText value={row.lastSignInAtUtc} kind="dateTime" /> : t("platformTenants:detail.never") },
    { id: "state", sortable: true, header: t("platformTenants:columns.status"), type: "status", mobile: "status", tones: ownerStatusTones, value: (row) => row.state },
  ];
}
/// 263: en el teléfono cada Dueño es una tarjeta con el estado, el último ingreso y el correo, cada dato con el nombre de su
/// columna.
export function organizationOwnerPhoneRow(row: OwnerRow, t: TFunction): ReactNode {
  return <ListCard key={row.id} title={row.name || <EmptyValue />} fields={[
    { label: t("platformTenants:columns.status"), value: <StatusBadge tones={ownerStatusTones} value={row.state} /> },
    { label: t("platformTenants:detail.lastSignIn"), value: row.lastSignInAtUtc ? <DateText value={row.lastSignInAtUtc} kind="dateTime" /> : t("platformTenants:detail.never") },
    { label: t("platformTenants:detail.email"), value: row.email ? <EmailText value={row.email} /> : <EmptyValue />, wide: true },
  ]} />;
}
export function createOrganizationHistoryColumns(t: TFunction): Column<PlatformTenantHistoryResponse>[] {
  return [
    { id: "occurredAtUtc", header: t("platformTenants:detail.historyColumns.when"), type: "dateTime", value: (row) => row.occurredAtUtc },
    { id: "action", header: t("platformTenants:detail.historyColumns.what"), type: "text", mobile: "primary", value: (row) => row.action },
    { id: "actor", header: t("platformTenants:detail.historyColumns.who"), type: "text", value: (row) => row.actor },
    { id: "reason", header: t("platformTenants:detail.historyColumns.reason"), type: "text", value: (row) => row.reason },
  ];
}

/** El dueño: su nombre o, si todavía no lo tiene, su correo, que se parte después de la @ como en el tablero. */
function ownerOf(organization: PlatformTenantResponse): ReactNode {
  return organization.ownerName || (organization.ownerEmail ? <EmailText value={organization.ownerEmail} /> : <EmptyValue />);
}

/// Tablero M-Filas-Base2 (M-Organizaciones, 263): en el teléfono cada organización es una tarjeta con su estado, el alta, el
/// Dueño y el origen, cada dato con su nombre; las empresas y los miembros se leen en la ficha.
export function organizationPhoneRow(organization: PlatformTenantResponse, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListCard key={organization.id} to={organizationPath(organization.id)} title={organization.name} fields={[
    { label: t("platformTenants:columns.status"), value: <StatusBadge tones={tenantStatusTones} value={organization.status} /> },
    { label: t("platformTenants:columns.created"), value: <DateText value={organization.createdAtUtc} kind="date" /> },
    { label: t("platformTenants:columns.owner"), value: ownerOf(organization) },
    { label: t("platformTenants:columns.source"), value: <EnumText enum="TenantRegistrationSource" value={organization.source} /> },
  ]} trailing={trailing} />;
}
export function createOrganizationColumns(t: TFunction): Column<PlatformTenantResponse>[] {
  return [
    // Tablero Organizaciones (base de la 12): un dato por celda; el alta en su columna y el Dueño por su nombre o su correo.
    { id: "name", header: t("platformTenants:columns.organization"), type: "custom", mobile: "primary", sortable: true, className: "w-[26%]",
      cell: (organization) => <Link className="font-medium text-[var(--t1)] hover:underline" to={organizationPath(organization.id)}>{organization.name}</Link> },
    { id: "createdAtUtc", sortable: true, header: t("platformTenants:columns.created"), type: "date", className: "w-30", value: (organization) => organization.createdAtUtc },
    { id: "ownerName", sortable: true, header: t("platformTenants:columns.owner"), type: "custom", cell: ownerOf },
    { id: "companyCount", sortable: true, header: t("platformTenants:columns.companies"), type: "integer", value: (organization) => organization.companyCount },
    { id: "memberCount", sortable: true, header: t("platformTenants:columns.members"), type: "integer", value: (organization) => organization.memberCount },
    { id: "status", sortable: true, header: t("platformTenants:columns.status"), type: "status", mobile: "status", tones: tenantStatusTones, value: (organization) => organization.status },
  ];
}
