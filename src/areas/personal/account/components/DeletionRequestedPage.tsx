import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { clearDeletionRequested } from "@/auth/deletionRequestStatus";
import { BrandMark } from "@/shared/ui/BrandMark";
import { Button } from "@/shared/ui/button";

export function DeletionRequestedPage({ date }: { date: string }) {
  const { t } = useTranslation("account");
  const { t: common } = useTranslation("auth");
  const navigate = useNavigate();
  return <main role="status" className="relative flex min-h-dvh flex-col items-center justify-center gap-5 bg-[var(--fondo)] px-6 text-center text-[var(--t1)]">
    <span className="absolute left-6 top-6 flex items-center gap-2.5 text-[17px] font-bold md:left-12 md:top-8"><BrandMark />{common("brand")}</span>
    <span className="flex size-16 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]" aria-hidden="true"><LogOut size={24} strokeWidth={1.75} /></span>
    <div><h1 className="text-xl font-bold tracking-[-0.02em]">{t("closedSession")}</h1><p className="mt-1.5 text-sm text-[var(--t2)]">{t("deletionDate", { date })}</p></div>
    <Button type="button" variant="outline" size="lg" className="w-[280px]" onClick={() => { navigate("/"); clearDeletionRequested(); }}>{t("goHome")}</Button>
  </main>;
}
