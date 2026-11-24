import { useTranslation } from "react-i18next";
import type { PlatformAccountLoginMethodResponse } from "@/shared/api/types";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { ListCard } from "@/shared/ui/app/ListRow";
import { BooleanText } from "@/shared/ui/format/BooleanText";
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
      // 263: en el teléfono cada método es una tarjeta con el tipo, si sirve para ingresar, cuándo se verificó, si es el
      // principal y, si lo administra una organización, cuál; cada dato con su nombre y sin unirlos con «·».
      return phone ? <ListCard key={method.id} title={method.maskedValue} fields={[
        { label: t("detail.methodType"), value: <EnumText enum="LoginMethodType" value={method.type} /> },
        { label: t("columns.state"), value: status },
        { label: t("detail.verified"), value: <DateText value={method.verifiedAtUtc} /> },
        { label: t("detail.primary"), value: <BooleanText value={method.isPrimary} /> },
        ...(method.managedByOrganizationName ? [{ label: t("detail.managedByLabel"), value: method.managedByOrganizationName, wide: true }] : []),
      ]} />
        : <ListItem key={method.id} title={method.maskedValue} detail={<><EnumText enum="LoginMethodType" value={method.type} />{principal ? ` · ${principal}` : null}{managed ? ` · ${managed}` : null}</>}>{method.canSignIn ? null : status}</ListItem>;
    })}
  </List></Surface>;
}
