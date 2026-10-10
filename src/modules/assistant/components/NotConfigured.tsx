import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

export function NotConfigured({ canConfigure, onConfigure }: { canConfigure: boolean; onConfigure?: () => void }) {
  const { t } = useTranslation("assistant");
  return <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
    <h2 className="text-lg font-semibold">{t("notConfigured.title")}</h2>
    {canConfigure && onConfigure ? <Button onClick={onConfigure}>{t("notConfigured.configure")}</Button> : null}
  </div>;
}
