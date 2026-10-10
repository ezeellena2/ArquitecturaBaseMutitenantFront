import { useContext, useState, type ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { accountIdentity } from "@/auth/accountIdentity";
import { useSignOut } from "@/auth/useSignOut";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { useAccess } from "./useAccess";
import { useSwitchAccess } from "./useSwitchAccess";
import { isSelectable, loginPathOf } from "./access";
import { accountPagePaths } from "@/shared/api/accountContract";
import { mainSiteUrl, siteOfHost } from "./publicSite";
import { PublicSiteHostContext } from "./usePublicSite";

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export interface ProfileEntry {
  key: string;
  name: string;
  /** El rol o por qué no está disponible («Suspendida»). */
  detail: string | null;
  /** El perfil en el que estás. */
  checked: boolean;
  unavailable: boolean;
  /** Cambia a este perfil; en el que estás no hace nada. */
  select: () => void;
}

/// Lo que comparten el menú de la cuenta (compu) y «Más» (teléfono): quién sos, tus perfiles para cambiar de uno a
/// otro sin volver a ingresar, y Salir. Mientras cambia de perfil o si falla, `status` es la pantalla que va.
export function useProfiles() {
  const { t } = useTranslation();
  const auth = useAuth();
  const location = useLocation();
  const host = useContext(PublicSiteHostContext) ?? globalThis.location.host;
  const storefront = siteOfHost(host).kind === "storefront";
  const signOutFromAccess = useSignOut(storefront ? "consumer" : undefined);
  const signOut = () => storefront
    ? signOutFromAccess({ post_logout_redirect_uri: `${globalThis.location.origin}/` })
    : signOutFromAccess();
  const { data: account } = useCurrentUser();
  const { access, activeTenantId, hasPersonalSpace, organizations } = useAccess();
  const switching = useSwitchAccess({ mainSite: storefront });
  const accountHref = storefront ? mainSiteUrl(accountPagePaths.account) : accountPagePaths.account;
  const [targetName, setTargetName] = useState("");
  const identity = accountIdentity(account);
  const { name } = identity;
  const nameLabel = name || t("format:emptyLabel");
  const personal = t("accessMenu.personal");

  function switchTo(target: Parameters<typeof switching.switchAccess>[0], destinationName: string) {
    setTargetName(destinationName);
    void switching.switchAccess(target);
  }

  const profiles: ProfileEntry[] = [];
  if (hasPersonalSpace || access === "business") profiles.push({
    key: "personal", name: personal, detail: t("accessMenu.personalDetail"), checked: access === "consumer", unavailable: false,
    select: () => { if (access !== "consumer") switchTo({ access: "consumer" }, personal); },
  });
  for (const organization of organizations) {
    const checked = access === "business" && activeTenantId === organization.id;
    const unavailable = !isSelectable(organization);
    const detail = organization.status === "Suspended" ? t("accessMenu.suspended")
      : organization.status === "PendingApproval" ? t("accessMenu.pendingApproval")
        : organization.status === "Closed" ? t("accessMenu.closed")
          : organization.memberStatus !== "Active" ? t("accessMenu.inactiveMembership")
            : organization.isSelectable === false ? t("accessMenu.unavailable") : organization.roleName ?? null;
    profiles.push({
      key: organization.id, name: organization.name, detail, checked, unavailable,
      select: () => { if (!checked) switchTo({ access: "business", tenantId: organization.id }, organization.name); },
    });
  }

  const status: ReactNode = switching.isSwitching ? <SessionStatusPage status="switching" targetName={targetName} />
    : switching.hasError ? <SessionStatusPage status="error" loginPath={loginPathOf(access)} onRetry={storefront ? () => {
      void auth.signinRedirect({ extraQueryParams: { access: "consumer", prompt: "login" },
        state: { returnTo: `${location.pathname}${location.search}${location.hash}` } });
    } : undefined} />
      : null;

  return { account, ...identity, nameLabel, email: account?.email ?? null, access, profiles, signOut, status, accountHref };
}
