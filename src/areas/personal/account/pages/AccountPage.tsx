import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { AccountProfileForm } from "../components/AccountProfileForm";

export function AccountPage() {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useCurrentUser();
  if (isPending) return <p role="status" className="p-6">{t("states.loading")}</p>;
  if (!data) return <div className="p-6"><FormError message={error instanceof Error ? error.message : t("states.error")} /><Button onClick={() => { void refetch(); }}>{t("actions.retry")}</Button></div>;
  return <AccountProfileForm key={data.id} account={data} />;
}
