import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { apiErrorMessage, toastActionError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { usePagination } from "@/shared/hooks/usePagination";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DataTable } from "@/shared/ui/DataTable";
import { RotateIcon, SwapIcon, UnlinkIcon, WhatsAppIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import type { WhatsAppNumberResponse } from "../../api/types";
import { checkNumber, connectNumber, disconnectNumber, fetchNumber, fetchNumbers, numberQueryKey, numbersQueryKey, numbersQueryRoot } from "../api/numbers";
import { createNumberColumns, numberPhoneRow } from "../columns";
import { ConnectNumberDialog } from "../components/ConnectNumberDialog";
import { NumberCompanyDialog } from "../components/NumberCompanyDialog";
import { PaymentMissingDialog } from "../components/PaymentMissingDialog";
import { useConnectNumber } from "../signup/useConnectNumber";

type Open =
  | { kind: "connect" }
  | { kind: "company" | "disconnect" | "payment"; number: WhatsAppNumberResponse; trigger?: HTMLElement | null };

/** «Para resolver» lleva acá el número sin medio de pago (`?numero=<id>`): se abre su aviso (WA-Admin-Pago). */
const focusKey = "numero";

/// Administración › WhatsApp › Números (WA-Admin, WA-Admin-Pago, WA-Admin-Vacio, WA-Alta y sus M-*): los números de la
/// organización, con a quién atiende cada uno, su estado y los mensajes de servicio del mes (D1), y el alta embebida de
/// Meta. La lista es de a 10 desde el back, con el resumen de sin medio de pago (CC07).
export function NumbersPage() {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState<Open | null>(null);
  const query = { page: pagination.page, pageSize: pagination.pageSize };
  const list = useQuery({ queryKey: numbersQueryKey(query), queryFn: ({ signal }) => fetchNumbers(query, signal), placeholderData: keepPreviousData,
    meta: { silent: true, blocksView: true } });
  const focusId = searchParams.get(focusKey);
  const focused = useQuery({ queryKey: numberQueryKey(focusId ?? ""), queryFn: ({ signal }) => fetchNumber(focusId ?? "", signal), enabled: focusId !== null,
    meta: { silent: true } });
  const refresh = () => queryClient.invalidateQueries({ queryKey: numbersQueryRoot });
  const connection = useConnectNumber({ variant: "organization", connect: connectNumber, onConnected: refresh });
  const check = useMutation({
    mutationFn: (number: WhatsAppNumberResponse) => checkNumber(number.id, { version: number.version }),
    onSuccess: async (result) => {
      if (result.status === "PaymentMissing") toast.info(t("whatsapp:numbers.payment.stillMissing"));
      else toast.success(t("whatsapp:numbers.payment.ok"));
      closeDialog();
      await refresh();
    },
    onError: (error) => toastActionError(error, t),
  });
  const disconnect = useMutation({
    mutationFn: (number: WhatsAppNumberResponse) => disconnectNumber(number.id, number.version),
    onSuccess: async (_result, number) => {
      toast.success(t("whatsapp:numbers.disconnect.done", { number: format.formatPhone(number.displayNumber) }));
      await refresh();
    },
    onError: (error) => toastActionError(error, t),
  });

  function closeDialog() {
    setOpen(null);
    if (focusId !== null) setSearchParams((params) => { params.delete(focusKey); return params; }, { replace: true });
  }

  const data = list.data;
  if (!data && list.isError) return <LoadErrorPage screen={t("whatsapp:numbers.title")} onRetry={() => { void list.refetch(); }} />;
  const signup = data?.signup ?? null;
  const total = data?.numbers.totalCount ?? 0;
  const summary = data ? total === 0 ? t("whatsapp:numbers.summary.none") : <>
    {t("whatsapp:numbers.summary.count", { count: total, value: format.formatInteger(total) })}
    {data.paymentMissing > 0 ? <><SublineSeparator />{t("whatsapp:numbers.summary.paymentMissing", { count: data.paymentMissing, value: format.formatInteger(data.paymentMissing) })}</> : null}
  </> : undefined;
  const phoneLabel = (number: WhatsAppNumberResponse) => format.formatPhone(number.displayNumber);
  const showPayment = (number: WhatsAppNumberResponse, trigger?: HTMLElement | null) => setOpen({ kind: "payment", number, trigger });
  // El aviso del número que llegó por «Para resolver», mientras siga sin medio de pago.
  const linked = focused.data?.status === "PaymentMissing" && open === null ? focused.data : null;
  const payment = open?.kind === "payment" ? open.number : linked;

  const rowActions = (number: WhatsAppNumberResponse) => <RowActions label={t("whatsapp:numbers.rowActions", { number: phoneLabel(number) })} title={phoneLabel(number)}
    actions={[
      { label: t("whatsapp:numbers.actions.changeCompany"), accessibleName: t("whatsapp:numbers.actions.changeCompany"), icon: SwapIcon,
        onSelect: (trigger) => setOpen({ kind: "company", number, trigger }), hidden: number.status === "Disconnected" },
      { label: t("whatsapp:numbers.actions.check"), accessibleName: t("whatsapp:numbers.actions.check"), icon: RotateIcon,
        onSelect: () => check.mutate(number), hidden: number.status !== "PaymentMissing" },
      { label: t("whatsapp:numbers.actions.disconnect"), accessibleName: t("whatsapp:numbers.actions.disconnect"), icon: UnlinkIcon, destructive: true,
        onSelect: (trigger) => setOpen({ kind: "disconnect", number, trigger }), hidden: number.status === "Disconnected" },
    ]} />;
  const columns = createNumberColumns(t, (number) => showPayment(number), rowActions);
  const startConnect = () => {
    if (!signup) return;
    connection.prepare(signup);
    setOpen({ kind: "connect" });
  };

  return <>
    <Page icon={WhatsAppIcon} title={t("whatsapp:numbers.title")} summary={summary} phoneBody="flush"
      fab={signup ? { label: t("whatsapp:numbers.actions.connect"), onClick: startConnect } : undefined}
      actions={signup ? <Button type="button" onClick={startConnect} pending={connection.connecting} pendingLabel={t("whatsapp:numbers.actions.connecting")}>
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:numbers.actions.connect")}
      </Button> : undefined}>
      <Surface className="overflow-hidden" phoneFlush>
        <DataTable columns={columns} rows={data?.numbers.items ?? []} rowKey={(number) => number.id}
          mobileRow={(number) => numberPhoneRow(number, t, (item) => showPayment(item), rowActions(number))}
          isLoading={list.isPending} isFetching={list.isFetching} error={list.error ? apiErrorMessage(list.error, t) : undefined}
          onRetry={() => { void list.refetch(); }} emptyTitle={t("whatsapp:numbers.empty")} />
        {data && data.numbers.totalCount > data.numbers.pageSize && data.numbers.totalPages !== undefined && data.numbers.hasPrevious !== undefined && data.numbers.hasNext !== undefined
          ? <Pagination page={data.numbers.page} pageSize={data.numbers.pageSize} totalCount={data.numbers.totalCount} totalPages={data.numbers.totalPages}
            hasPrevious={data.numbers.hasPrevious} hasNext={data.numbers.hasNext} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /> : null}
      </Surface>
    </Page>
    {open?.kind === "connect" && signup ? <ConnectNumberDialog onClose={() => setOpen(null)}
      onContinue={(companyId) => { setOpen(null); connection.begin(signup, companyId); }} /> : null}
    {open?.kind === "company" ? <NumberCompanyDialog number={open.number} returnFocusTo={open.trigger} onClose={() => setOpen(null)}
      title={t("whatsapp:numbers.company.title", { number: phoneLabel(open.number) })} /> : null}
    {payment ? <PaymentMissingDialog title={t("whatsapp:numbers.payment.title", { number: phoneLabel(payment) })}
      detail={t("whatsapp:numbers.payment.detail", { free: format.formatInteger(payment.freeServiceMessages) })}
      checking={check.isPending} onCheck={() => check.mutate(payment)} onClose={closeDialog} returnFocusTo={open?.kind === "payment" ? open.trigger : undefined} /> : null}
    <ConfirmDialog open={open?.kind === "disconnect"} onOpenChange={(value) => { if (!value) setOpen(null); }} destructive
      returnFocusTo={open?.kind === "disconnect" ? open.trigger : undefined}
      title={open?.kind === "disconnect" ? t("whatsapp:numbers.disconnect.title", { number: phoneLabel(open.number) }) : ""}
      description={t("whatsapp:numbers.disconnect.description")} confirmLabel={t("whatsapp:numbers.actions.disconnect")}
      onConfirm={() => { if (open?.kind === "disconnect") disconnect.mutate(open.number); }} />
    {connection.ui}
  </>;
}
