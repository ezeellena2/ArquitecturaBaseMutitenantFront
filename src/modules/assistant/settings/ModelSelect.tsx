import { useTranslation } from "react-i18next";
import type { AssistantModelPriceResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export function ModelSelect({ models, value, onChange, id, ...aria }: {
  models: readonly AssistantModelPriceResponse[]; value: string; onChange: (value: string) => void; id?: string;
  "aria-invalid"?: boolean; "aria-describedby"?: string;
}) {
  const { t } = useTranslation("assistant"); const format = useFormat();
  const saved = models.find((model) => model.id === value);
  return <Select value={value} onValueChange={onChange}><SelectTrigger id={id} {...aria} className="w-full"><SelectValue placeholder={t("settings.selectModel")} /></SelectTrigger><SelectContent>
    {value && !saved?.isActive ? <SelectItem value={value} disabled>{`${saved?.name ?? value} · ${t("settings.unavailableModel")}`}</SelectItem> : null}
    {models.filter((model) => model.isActive).map((model) => <SelectItem key={model.id} value={model.id}
      description={t("settings.modelPrices", { input: format.formatMoney(model.inputPricePerMillion), output: format.formatMoney(model.outputPricePerMillion) })}>{model.name}</SelectItem>)}
  </SelectContent></Select>;
}
