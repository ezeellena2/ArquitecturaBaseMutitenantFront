import { Clock3 } from "lucide-react";
import { Link } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import type { PendingDeletionState } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { DateInTimeZoneText } from "@/shared/ui/format/DateInTimeZoneText";

export function PendingDeletionPanel({ pending, onCancel, busy, failure }: { pending: PendingDeletionState; onCancel: () => void; busy: boolean; failure: string | null }) {
  const { t } = useTranslation("auth");
  return <div className="flex flex-col gap-[22px] text-center">
    <span aria-hidden="true" className="flex size-[52px] items-center justify-center self-center rounded-full bg-[var(--s3)] text-[var(--t2)]"><Clock3 size={24} strokeWidth={1.75} /></span>
    <div><h1 className="text-2xl font-bold leading-tight">{t("deletion.title")}</h1><p className="mt-2 text-sm text-[var(--t2)]"><Trans ns="auth" i18nKey="deletion.date" components={{ date: <DateInTimeZoneText value={pending.scheduledForUtc} timeZone={pending.timeZoneId} /> }} /></p></div>
    <FormError message={failure} />
    <div className="flex flex-col gap-2.5"><Button type="button" size="lg" onClick={onCancel} disabled={busy}>{t("deletion.cancelAndEnter")}</Button><Button asChild variant="outline" size="lg"><Link to="/">{t("deletion.leave")}</Link></Button></div>
  </div>;
}
