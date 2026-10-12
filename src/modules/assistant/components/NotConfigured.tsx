import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Sparkles } from "lucide-react";
import { Surface } from "@/shared/ui/Surface";

export function NotConfigured({ canConfigure, onConfigure }: { canConfigure: boolean; onConfigure?: () => void }) {
  const { t } = useTranslation("assistant");
  return <Surface className="flex flex-col items-center justify-center gap-3 p-8 text-center">
    <span className="flex size-9 items-center justify-center rounded-full bg-[var(--s2)] text-[var(--t3)]"><Sparkles className="size-5" aria-hidden="true" /></span>
    <h2 className="text-lg font-semibold">{t("notConfigured.title")}</h2>
    {canConfigure && onConfigure ? <Button onClick={onConfigure}>{t("notConfigured.configure")}</Button> : null}
  </Surface>;
}
