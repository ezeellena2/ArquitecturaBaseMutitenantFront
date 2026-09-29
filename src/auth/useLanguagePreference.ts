import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import i18n, { changeCulture } from "@/shared/i18n";
import { updateMe } from "@/areas/personal/account/api/account";
import { currentUserQueryKey, useCurrentUser } from "./useCurrentUser";

export function useLanguagePreference(): { change: (culture: string) => Promise<void> } {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  async function change(culture: string): Promise<void> {
    const previous = i18n.language;
    if (culture === previous) return;

    await changeCulture(culture);
    if (!user) return;

    try {
      const updated = await updateMe({
        displayName: user.displayName,
        culture,
        timeZoneId: user.timeZoneId,
      });
      queryClient.setQueryData(currentUserQueryKey, updated);
    } catch {
      await changeCulture(previous);
      toast.error(t("language.saveFailed"));
    }
  }

  return { change };
}
