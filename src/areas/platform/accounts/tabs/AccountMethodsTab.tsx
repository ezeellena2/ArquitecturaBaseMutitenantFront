import { useTranslation } from "react-i18next";
import type { PlatformAccountLoginMethodResponse } from "@/shared/api/types";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DateText } from "@/shared/ui/format/DateText";
import { EnumText } from "@/shared/ui/format/EnumText";
import { List, ListItem } from "@/shared/ui/List";
import { StatusDot } from "@/shared/ui/StatusDot";
import { Surface } from "@/shared/ui/Surface";

export function AccountMethodsTab({ methods }: { methods: readonly PlatformAccountLoginMethodResponse[] }) {
  const { t } = useTranslation("platformAccounts"); const { phone } = useAppChrome();
  return <Surface phoneFlush><List label={t("detail.methods")}>
    {methods.length === 0 ? <ListItem title={t("detail.methodsEmpty")} /> : methods.map((method) => {
      const status = <StatusDot tone={method.canSignIn ? "success" : "neutral"} label={t(method.canSignIn ? "detail.canSignIn" : "detail.cannotSignIn")} />;
      const managed = method.managedByOrganizationName ? t("detail.managedBy", { organization: method.managedByOrganizationName }) : null;
      const principal = method.isPrimary ? t("detail.primary") : null;
      return phone ? <ListRow key={method.id} title={method.maskedValue} meta={<EnumText enum="LoginMethodType" value={method.type} />}
        lines={[<span key="verification">{[managed, principal].filter(Boolean).join(" · ")}{managed || principal ? " · " : null}{t(managed || principal ? "detail.verifiedInline" : "detail.verified")} <DateText value={method.verifiedAtUtc} /></span>, status]} />
        : <ListItem key={method.id} title={method.maskedValue} detail={<><EnumText enum="LoginMethodType" value={method.type} />{principal ? ` · ${principal}` : null}{managed ? ` · ${managed}` : null}</>}>{method.canSignIn ? null : status}</ListItem>;
    })}
  </List></Surface>;
}
