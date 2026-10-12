import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import type { AssistantModelListQuery, AssistantModelPriceResponse } from "@/modules/assistant/api/types";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { ListRow } from "@/shared/ui/app/ListRow";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import { EnumText } from "@/shared/ui/format/EnumText";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import type { AssistantScope } from "../api/assistant";
import { assistantModelsKey, fetchAssistantModels } from "../api/models";

const filterKeys = [] as const;
export function ModelCatalog({ scope, onEdit }: { scope: AssistantScope; onEdit: (model: AssistantModelPriceResponse, trigger: HTMLElement | null) => void }) {
  const { t } = useTranslation(["assistant", "common"]);
  const { result, paginationProps } = usePagedQuery({ filterKeys,
    toQuery: (page): AssistantModelListQuery => ({ page: page.page, pageSize: page.pageSize }),
    queryKey: (query) => assistantModelsKey(scope, query), queryFn: fetchAssistantModels, meta: { silent: true },
  });
  const rowActions = (model: AssistantModelPriceResponse) => <RowActions label={t("assistant:settings.modelActions", { name: model.name })} title={model.name}
    actions={[{ label: t("assistant:settings.editModel"), accessibleName: t("assistant:settings.editNamedModel", { name: model.name }), icon: Pencil, onSelect: (trigger) => onEdit(model, trigger) }]} />;
  const columns: Column<AssistantModelPriceResponse>[] = [
    { id: "name", header: t("assistant:settings.model"), type: "text", value: (row) => row.name, mobile: "primary" },
    { id: "provider", header: t("assistant:settings.provider"), type: "enum", enum: "AssistantProvider", value: (row) => row.provider },
    { id: "providerModelId", header: t("assistant:settings.catalogId"), type: "text", value: (row) => row.providerModelId },
    { id: "inputPricePerMillion", header: t("assistant:settings.catalogInputPrice"), type: "money", value: (row) => row.inputPricePerMillion },
    { id: "outputPricePerMillion", header: t("assistant:settings.catalogOutputPrice"), type: "money", value: (row) => row.outputPricePerMillion },
    { id: "isActive", header: t("assistant:settings.state"), type: "custom", cell: (row) => t(row.isActive ? "assistant:settings.active" : "assistant:settings.inactive") },
    { id: "actions", header: t("assistant:settings.actions"), type: "actions", cell: rowActions },
  ];
  return <>
    <Surface><DataTable columns={columns} rows={result.data?.items ?? []} rowKey={(row) => row.id} isLoading={result.isPending} isFetching={result.isFetching}
      error={result.isError ? apiErrorMessage(result.error, t) : undefined} onRetry={() => { void result.refetch(); }} emptyTitle={t("assistant:settings.emptyModels")}
      mobileRow={(model) => <ListRow title={model.name} meta={t(model.isActive ? "assistant:settings.active" : "assistant:settings.inactive")}
        lines={[<><EnumText enum="AssistantProvider" value={model.provider} />{" · "}{model.providerModelId}</>, <><MoneyText value={model.inputPricePerMillion} />{" / "}<MoneyText value={model.outputPricePerMillion} /> {t("assistant:settings.perMillion")}</>]} trailing={rowActions(model)} />} />
      {paginationProps ? <Pagination {...paginationProps} /> : null}
    </Surface>
  </>;
}
