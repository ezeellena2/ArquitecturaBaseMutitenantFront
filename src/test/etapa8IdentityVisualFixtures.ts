import type { AccountLoginMethodsResponse, MeResponse, PlatformAccountDetailResponse, PlatformAccountResponse } from "@/shared/api/types";
import { visualOwner, visualPersonal } from "./mocks/currentUsers.ts";
import { platformAccountRows } from "./mocks/platformAccounts.ts";
import { platformAccountDetailFixture } from "./mocks/platformAccountDetail.ts";

// Variantes de datos aprobadas por N2/N3. No son estados nuevos del lienzo ni evidencia del backend.
export const etapa8IdentityVariants = [
  { key: "phone-sin-nombre", label: "Phone principal sin nombre, con correo de respaldo", name: null, email: null, mask: "•••• 4521", principal: "Phone" },
  { key: "phone-con-nombre", label: "Nombre con Phone principal y correo de respaldo", name: "Lucía Fernández", email: null, mask: "•••• 4521", principal: "Phone" },
  { key: "email-principal", label: "Correo principal, Phone de respaldo", name: null, email: "lucia.fer@gmail.com", mask: null, principal: "Email" },
  { key: "sin-identidad", label: "Sin nombre, correo ni máscara recibidos", name: null, email: null, mask: null, principal: null },
] as const;
export type Etapa8IdentityVariant = typeof etapa8IdentityVariants[number];

export function etapa8IdentityMe(variant: Etapa8IdentityVariant, access: "consumer" | "business" = "consumer"): MeResponse {
  const base = access === "business" ? visualOwner : visualPersonal;
  return { ...base, displayName: variant.name, firstName: variant.name ? "Lucía" : null, lastName: variant.name ? "Fernández" : null,
    email: access === "business" ? base.email : variant.email, maskedPrimaryPhone: variant.mask };
}

export function etapa8IdentityMethods(variant: Etapa8IdentityVariant): AccountLoginMethodsResponse {
  return { methods: variant.principal === null ? [] : [
    { id: "phone-lucia", type: "Phone", value: "+5491155554521", isVerified: true, isPrimary: variant.principal === "Phone", canRemove: true, canMakePrimary: variant.principal !== "Phone" },
    { id: "email-lucia", type: "Email", value: "lucia.fer@gmail.com", isVerified: true, isPrimary: variant.principal === "Email", canRemove: true, canMakePrimary: variant.principal !== "Email" },
  ], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] };
}

export function etapa8IdentityAccount(variant: Etapa8IdentityVariant): PlatformAccountResponse {
  return { ...platformAccountRows[0], displayName: variant.name, primaryEmail: variant.email, maskedPrimaryPhone: variant.mask, lastSignInMethod: "WhatsAppCode" };
}

export function etapa8IdentityAccountDetail(variant: Etapa8IdentityVariant): PlatformAccountDetailResponse {
  const account = etapa8IdentityAccount(variant);
  return { ...platformAccountDetailFixture(), displayName: account.displayName, primaryEmail: account.primaryEmail, maskedPrimaryPhone: account.maskedPrimaryPhone,
    loginMethods: variant.principal === null ? [] : [
      { id: "method-phone", type: "Phone", maskedValue: "•••• 4521", isPrimary: variant.principal === "Phone", verifiedAtUtc: "2026-02-03T14:47:00Z", canSignIn: true, managedByOrganizationName: null },
      { id: "method-email", type: "Email", maskedValue: "lu•••@gmail.com", isPrimary: variant.principal === "Email", verifiedAtUtc: "2026-05-10T17:20:00Z", canSignIn: true, managedByOrganizationName: null },
    ] };
}
