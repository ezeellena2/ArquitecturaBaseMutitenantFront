import { useCurrentUser } from "@/auth/useCurrentUser";

export function useAccess() {
  const { data: account, isLoading } = useCurrentUser();

  return {
    access: account?.access ?? null,
    activeTenantId: account?.activeTenantId ?? null,
    hasPersonalSpace: account?.hasPersonalSpace ?? false,
    organizations: account?.organizations ?? [],
    isLoading,
  };
}
