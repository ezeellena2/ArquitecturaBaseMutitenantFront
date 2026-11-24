import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PlatformAccountResponse } from "@/shared/api/types";
import { defineStatusTones } from "@/shared/format/statusTones";
import { Avatar } from "@/shared/ui/Avatar";
import { ListCard } from "@/shared/ui/app/ListRow";
import { EmailText } from "@/shared/ui/format/EmailText";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";

export const accountStateTones = defineStatusTones("PlatformAccountState", { Active: "success", Suspended: "warning", NeedsRecovery: "danger", PendingDeletion: "warning", Deleted: "neutral", Invited: "pending", InvitationExpired: "warning" });
export const accountPath = (id: string) => `/plataforma/cuentas/${encodeURIComponent(id)}`;
export const accountName = (account: Pick<PlatformAccountResponse, "displayName" | "maskedPrimaryPhone" | "primaryEmail">) => account.displayName || account.maskedPrimaryPhone || account.primaryEmail || "";
export const accountLabel = (account: Pick<PlatformAccountResponse, "displayName" | "maskedPrimaryPhone" | "primaryEmail">, t: TFunction) => accountName(account) || t("format:emptyLabel");
export const isOperatorInvitation = (account: Pick<PlatformAccountResponse, "state">) => account.state === "Invited" || account.state === "InvitationExpired";
function profiles(account: PlatformAccountResponse, t: TFunction): ReactNode {
  if (account.state === "Deleted") return <EmptyValue />;
  if (account.kind === "Operator") return t("platformAccounts:profiles.operator");
  if (!account.hasPersonalSpace) return account.organizationCount > 0 ? t("platformAccounts:profiles.organizations", { count: account.organizationCount }) : <EmptyValue />;
  return account.organizationCount > 0 ? t("platformAccounts:profiles.personalOrganizations", { count: account.organizationCount }) : t("platformAccounts:profiles.personal");
}
/// Tablero M-Cuentas-Base2 (263): en el teléfono cada cuenta es una tarjeta con su círculo, sus perfiles, su estado y el último
/// ingreso; una invitación de operador lleva hasta cuándo vale en lugar del último ingreso. Cada dato con su nombre, sin el
/// correo. Un correo se parte después de la @.
export function accountPhoneRow(account: PlatformAccountResponse, t: TFunction, trailing: ReactNode): ReactNode {
  const invitation = isOperatorInvitation(account); const named = Boolean(account.displayName);
  const name = accountName(account);
  return <ListCard key={account.id} to={accountPath(account.id)}
    leading={<Avatar size="row" muted={!named} initials={named || invitation ? name.trim().charAt(0).toUpperCase() : "—"} />}
    title={name ? <EmailText value={name} /> : <EmptyValue />} fields={[
      { label: t("platformAccounts:columns.profiles"), value: profiles(account, t) },
      { label: t("platformAccounts:columns.state"), value: <StatusBadge tones={accountStateTones} value={account.state} /> },
      invitation ? { label: t("platformAccounts:columns.expires"), value: <DateText value={account.invitationExpiresAtUtc} kind="dateTime" /> }
        : { label: t("platformAccounts:columns.lastSignIn"), value: <DateText value={account.lastSignInAtUtc} kind="dateTime" />, wide: true },
    ]} trailing={trailing} />;
}
export function createAccountColumns(t: TFunction): Column<PlatformAccountResponse>[] {
  return [
    // Tablero Cuentas (base de la 12): un dato por celda; el correo o el teléfono principal, en su columna.
    { id: "name", header: t("platformAccounts:columns.account"), type: "custom", mobile: "primary", sortable: true, className: "w-[24%]",
      cell: (account) => <Link className={`hover:underline ${account.displayName ? "font-medium text-[var(--t1)]" : "text-[var(--t3)]"}`} to={accountPath(account.id)}>{accountName(account) || <EmptyValue />}</Link> },
    { id: "contact", header: t("platformAccounts:columns.contact"), type: "custom", className: "w-[24%]",
      cell: (account) => account.maskedPrimaryPhone || account.primaryEmail
        ? <span className="text-[var(--t2)]">{account.maskedPrimaryPhone || <EmailText value={account.primaryEmail ?? ""} />}</span> : <EmptyValue /> },
    { id: "profiles", header: t("platformAccounts:columns.profiles"), type: "custom", cell: (account) => profiles(account, t) },
    { id: "lastSignInAtUtc", header: t("platformAccounts:columns.lastSignIn"), type: "custom", className: "w-40",
      cell: (account) => isOperatorInvitation(account) ? t("platformAccounts:columns.never") : <DateText value={account.lastSignInAtUtc} kind="dateTime" /> },
    { id: "state", header: t("platformAccounts:columns.state"), type: "status", tones: accountStateTones, value: (account) => account.state, mobile: "status" },
  ];
}
