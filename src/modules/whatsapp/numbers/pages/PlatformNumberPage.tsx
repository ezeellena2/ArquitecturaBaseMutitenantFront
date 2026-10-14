import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toastActionError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { PhoneIcon, WhatsAppIcon } from "@/shared/ui/icons";
import { InfoButton } from "@/shared/ui/InfoButton";
import { List, ListItem } from "@/shared/ui/List";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { RowActions } from "@/shared/ui/RowActions";
import { Section } from "@/shared/ui/Section";
import { Surface } from "@/shared/ui/Surface";
import { Switch } from "@/shared/ui/switch";
import type { PlatformWhatsAppNumberResponse, WhatsAppNumberResponse } from "../../api/types";
import { checkPlatformNumber, connectPlatformNumber, fetchPlatformNumber, platformNumberQueryKey, updatePlatformNumber } from "../api/numbers";
import { NumberUsage } from "../components/NumberUsage";
import { PaymentMissingDialog } from "../components/PaymentMissingDialog";
import { useConnectNumber } from "../signup/useConnectNumber";
import { numberStatusTones } from "../status";

/// Plataforma › Administración › WhatsApp › Número (Plat-WA-Numero, Plat-WA-Alta y sus M-*): el único número de la
/// plataforma, qué hace (los códigos y avisos, siempre; las Consultas, con su interruptor) y su alta embebida. Conectar
/// otro lo reemplaza.
export function PlatformNumberPage() {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const queryClient = useQueryClient();
  const [payment, setPayment] = useState<{ trigger?: HTMLElement | null } | null>(null);
  const read = useQuery({ queryKey: platformNumberQueryKey, queryFn: ({ signal }) => fetchPlatformNumber(signal), meta: { silent: true, blocksView: true } });
  const refresh = () => queryClient.invalidateQueries({ queryKey: platformNumberQueryKey });
  const connection = useConnectNumber({ variant: "platform", connect: connectPlatformNumber, onConnected: refresh });
  const written = (result: PlatformWhatsAppNumberResponse) => queryClient.setQueryData(platformNumberQueryKey, result);
  const check = useMutation({
    mutationFn: (number: WhatsAppNumberResponse) => checkPlatformNumber({ version: number.version }),
    onSuccess: (result) => {
      written(result);
      if (result.number?.status === "PaymentMissing") toast.info(t("whatsapp:numbers.payment.stillMissing"));
      else toast.success(t("whatsapp:numbers.payment.ok"));
      setPayment(null);
    },
    onError: (error) => toastActionError(error, t),
  });
  const consultations = useMutation({
    mutationFn: ({ enabled, number }: { enabled: boolean; number: WhatsAppNumberResponse }) => updatePlatformNumber({ consultationsEnabled: enabled, version: number.version }),
    onSuccess: (result) => {
      written(result);
      toast.success(t(result.consultationsEnabled ? "whatsapp:numbers.platform.consultationsOn" : "whatsapp:numbers.platform.consultationsOff"));
    },
    onError: async (error) => {
      toastActionError(error, t);
      await refresh();
    },
  });

  const data = read.data;
  if (!data && read.isError) return <LoadErrorPage screen={t("whatsapp:numbers.platform.title")} onRetry={() => { void read.refetch(); }} />;
  const number = data?.number ?? null;
  const signup = data?.signup ?? null;
  const connect = () => { if (signup) connection.begin(signup); };
  const summary = !data ? undefined : number
    ? <span className={number.status === "PaymentMissing" ? "text-[var(--peligro)]" : undefined}>{format.formatEnum("WhatsAppNumberStatus", number.status)}</span>
    : t("whatsapp:numbers.summary.noNumber");
  const connectButton = signup ? <Button type="button" onClick={connect} pending={connection.connecting} pendingLabel={t("whatsapp:numbers.actions.connecting")}>
    <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("whatsapp:numbers.actions.connect")}
  </Button> : undefined;

  function body(current: WhatsAppNumberResponse, response: PlatformWhatsAppNumberResponse) {
    const label = format.formatPhone(current.displayNumber);
    const since = current.verifiedName ? t("whatsapp:numbers.platform.since", { name: current.verifiedName, date: format.formatDate(current.connectedAtUtc) })
      : t("whatsapp:numbers.platform.sinceNoName", { date: format.formatDate(current.connectedAtUtc) });
    const status = <span className="inline-flex items-center gap-1">
      <StatusBadge tones={numberStatusTones} value={current.status} />
      {current.status === "PaymentMissing" ? <InfoButton label={t("whatsapp:numbers.platform.whyNoMessages")} onClick={() => setPayment({})} /> : null}
    </span>;
    const actions = <RowActions label={t("whatsapp:numbers.rowActions", { number: label })} title={label} actions={[
      { label: t("whatsapp:numbers.actions.check"), accessibleName: t("whatsapp:numbers.actions.check"), icon: RefreshCw,
        onSelect: () => check.mutate(current), hidden: current.status !== "PaymentMissing" },
      { label: t("whatsapp:numbers.platform.connectOther"), accessibleName: t("whatsapp:numbers.platform.connectOther"), icon: Plus,
        onSelect: connect, hidden: !signup },
    ]} />;
    const system = t("whatsapp:numbers.platform.system");
    const systemDetail = t("whatsapp:numbers.platform.systemMessages", { count: response.systemMessagesThisMonth, value: format.formatInteger(response.systemMessagesThisMonth) });
    const consultationSwitch = <Switch aria-label={t("whatsapp:numbers.platform.consultationsSwitch")} checked={response.consultationsEnabled}
      disabled={consultations.isPending} onCheckedChange={(enabled) => consultations.mutate({ enabled, number: current })} />;
    const always = <span className="text-[13px] text-[var(--t3)] max-md:text-[14px]">{t("whatsapp:numbers.platform.always")}</span>;
    const usage = <NumberUsage number={current} month />;
    return <>
      <Section title={t("whatsapp:numbers.platform.number")}>
        {phone ? <ul className="m-0 list-none p-0">
          <SettingsItem title={label} detail={<>{format.formatEnum("WhatsAppNumberStatus", current.status)}{" · "}{t("whatsapp:numbers.platform.sinceDate", { date: format.formatDate(current.connectedAtUtc) })}</>}
            trailing={<span className="flex items-center gap-1">{current.status === "PaymentMissing" ? <InfoButton label={t("whatsapp:numbers.platform.whyNoMessages")} onClick={() => setPayment({})} /> : null}{actions}</span>} />
        </ul> : <List label={t("whatsapp:numbers.platform.number")}>
          <ListItem icon={<PhoneIcon />} title={<span className="text-[15px]">{label}</span>} detail={since}>
            <span className="flex items-center gap-3">{status}{actions}</span>
          </ListItem>
        </List>}
      </Section>
      <Section title={t("whatsapp:numbers.platform.whatItDoes")}>
        {phone ? <ul className="m-0 list-none p-0">
          <SettingsItem title={system} detail={systemDetail} trailing={always} />
          <SettingsItem title={t("whatsapp:numbers.platform.consultations")} detail={usage} trailing={consultationSwitch} />
        </ul> : <List label={t("whatsapp:numbers.platform.whatItDoes")}>
          <ListItem title={system} detail={systemDetail}>{always}</ListItem>
          <ListItem title={t("whatsapp:numbers.platform.consultations")} detail={usage}>{consultationSwitch}</ListItem>
        </List>}
      </Section>
    </>;
  }

  return <>
    <Page icon={WhatsAppIcon} title={t("whatsapp:numbers.platform.title")} summary={summary} phoneBody={number ? "gray" : "padded"}
      fab={!number && signup ? { label: t("whatsapp:numbers.actions.connect"), onClick: connect } : undefined}
      actions={number ? undefined : connectButton}>
      {!data ? <p role="status" className="text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p>
        : number ? body(number, data)
          : <Surface phoneFlush><EmptyState framed={false} title={t("whatsapp:numbers.platform.empty")} /></Surface>}
    </Page>
    {payment && number ? <PaymentMissingDialog title={t("whatsapp:numbers.platform.paymentTitle", { number: format.formatPhone(number.displayNumber) })}
      detail={data?.consultationsEnabled ? t("whatsapp:numbers.platform.paymentDetailConsultations", { free: format.formatInteger(number.freeServiceMessages) })
        : t("whatsapp:numbers.platform.paymentDetail")}
      checking={check.isPending} onCheck={() => check.mutate(number)} onClose={() => setPayment(null)} returnFocusTo={payment.trigger} /> : null}
    {connection.ui}
  </>;
}
