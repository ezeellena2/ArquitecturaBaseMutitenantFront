import { useNavigate } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import type { PendingDeletionState } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { DateInTimeZoneText } from "@/shared/ui/format/DateInTimeZoneText";
import { ClockIcon } from "@/shared/ui/icons";
import { AuthStatus } from "./AuthStatus";

export function PendingDeletionPanel({ pending, onCancel, busy, failure }: { pending: PendingDeletionState; onCancel: () => void; busy: boolean; failure: string | null }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  return <AuthStatus icon={ClockIcon} tone="warning" title={t("deletion.title")}
    detail={<Trans ns="auth" i18nKey="deletion.date" components={{ date: <DateInTimeZoneText value={pending.scheduledForUtc} timeZone={pending.timeZoneId} /> }} />}
    actions={<>
      <Button type="button" size="lg" onClick={onCancel} pending={busy} pendingLabel={t("deletion.cancelAndEnter")}>{t("deletion.cancelAndEnter")}</Button>
      <Button type="button" variant="outline" size="lg" onClick={() => { void navigate("/"); }} disabled={busy}>{t("deletion.leave")}</Button>
    </>}>
    <FormError message={failure} />
  </AuthStatus>;
}
