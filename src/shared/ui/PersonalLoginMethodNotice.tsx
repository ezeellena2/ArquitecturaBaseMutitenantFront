import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Banner } from "./Banner";
import { Button } from "./button";

export function PersonalLoginMethodNotice({ onAdd }: { onAdd?: () => void }) {
  const { t } = useTranslation("account");
  return <Banner tone="warning" action={onAdd
    ? <Button type="button" variant="outline" size="sm" onClick={onAdd}>{t("addShort")}</Button>
    : <Button asChild variant="outline" size="sm"><Link to="/cuenta">{t("addShort")}</Link></Button>}>
    {t("noOwn")}
  </Banner>;
}
