import { useTranslation } from "react-i18next";
import type { AssistantModelPriceResponse } from "@/modules/assistant/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { Picker } from "@/shared/ui/Picker";

export function ModelSelect({ models, value, onChange, id, ...aria }: {
  models: readonly AssistantModelPriceResponse[]; value: string; onChange: (value: string) => void; id?: string;
  "aria-invalid"?: boolean; "aria-describedby"?: string;
}) {
  const { t } = useTranslation("assistant"); const format = useFormat();
  const saved = models.find((model) => model.id === value);
  // Lo guardado que ya no se ofrece va primero, apagado con su motivo: se ve qué hay, pero no se vuelve a elegir.
  return <Picker id={id} {...aria} value={value || null} placeholder={t("settings.selectModel")}
    onChange={(next) => { if (next !== value) onChange(next); }}
    options={[...(value && !saved?.isActive ? [{ value, label: `${saved?.name ?? value} · ${t("settings.unavailableModel")}`, disabledReason: t("settings.unavailableModel") }] : []),
      ...models.filter((model) => model.isActive).map((model) => ({ value: model.id, label: model.name,
        description: t("settings.modelPrices", { input: format.formatMoney(model.inputPricePerMillion), output: format.formatMoney(model.outputPricePerMillion) }) }))]} />;
}
