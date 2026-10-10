import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { PlatformAccountResponse } from "@/shared/api/types";
import { defineStatusTones } from "@/shared/format/statusTones";
import { Avatar } from "@/shared/ui/Avatar";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { EnumText } from "@/shared/ui/format/EnumText";
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
export function accountPhoneRow(account: PlatformAccountResponse, t: TFunction, trailing: ReactNode): ReactNode {
  const invitation = isOperatorInvitation(account); const named = Boolean(account.displayName);
  const status = <span className="inline-flex max-w-full items-center gap-1"><StatusBadge tones={accountStateTones} value={account.state} />{" · "}{invitation ? <>{t("platformAccounts:columns.expiresInline")} <DateText value={account.invitationExpiresAtUtc} kind="shortDate" /></> : profiles(account, t)}</span>;
  return <ListRow key={account.id} to={accountPath(account.id)}
    leading={<Avatar size="row" muted={!named} initials={named || invitation ? accountName(account).trim().charAt(0).toUpperCase() : "—"} />}
    title={accountName(account) || <EmptyValue />} meta={invitation ? undefined : <DateText value={account.lastSignInAtUtc} kind="relative" />}
    lines={[named ? account.maskedPrimaryPhone || account.primaryEmail || "" : invitation ? t("platformAccounts:profiles.operator") : "", status]} trailing={trailing} />;
}
export function createAccountColumns(t: TFunction): Column<PlatformAccountResponse>[] {
  return [
    { id: "name", header: t("platformAccounts:columns.account"), type: "custom", mobile: "primary", sortable: true,
      cell: (account) => <Link className={`block truncate hover:underline ${account.displayName ? "font-medium text-[var(--t1)]" : "text-[var(--t3)]"}`} to={accountPath(account.id)}>{accountName(account) || <EmptyValue />}</Link>,
      detail: (account) => account.displayName ? account.maskedPrimaryPhone || account.primaryEmail || null : null },
    { id: "profiles", header: t("platformAccounts:columns.profiles"), type: "custom", cell: (account) => profiles(account, t) },
    { id: "lastSignInAtUtc", header: t("platformAccounts:columns.lastSignIn"), type: "custom",
      cell: (account) => isOperatorInvitation(account) ? t("platformAccounts:columns.never") : <DateText value={account.lastSignInAtUtc} kind="relative" />,
      detail: (account) => isOperatorInvitation(account) ? account.invitationExpiresAtUtc ? <>{t("platformAccounts:columns.expiresPrefix")} <DateText value={account.invitationExpiresAtUtc} /></> : null : account.lastSignInMethod ? <EnumText enum="LoginAuditMethod" value={account.lastSignInMethod} /> : null },
    { id: "state", header: t("platformAccounts:columns.state"), type: "status", tones: accountStateTones, value: (account) => account.state, mobile: "status" },
  ];
}
