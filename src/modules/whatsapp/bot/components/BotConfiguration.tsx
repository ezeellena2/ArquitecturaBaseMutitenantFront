import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { toastActionError } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { SettingsItem } from "@/shared/ui/app/SettingsGroup";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { List, ListItem } from "@/shared/ui/List";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { Section } from "@/shared/ui/Section";
import { Switch } from "@/shared/ui/switch";
import type { WhatsAppTeamResponse } from "../../api/types";
import { botQueryRoot } from "../api/bot";
import { maxMenuOptions, optionDetail, scheduleSummary, teamName, type BotData, type BotPatch } from "../lib/botModel";
import { EmployeesTeamDialog } from "./EmployeesTeamDialog";
import { OptionDialog } from "./OptionDialog";
import { OutOfHoursDialog } from "./OutOfHoursDialog";
import { WelcomeDialog } from "./WelcomeDialog";

type Open =
  | { kind: "cap" }
  | { kind: "option"; index: number | null; trigger?: HTMLElement | null }
  | { kind: "welcome" | "outOfHours" | "employees"; trigger?: HTMLElement | null };

/// El número de la opción (WA-Respuestas, .w-it .num, y M-WA-Respuestas, .ap-it .num): gris en la compu y petróleo en el
/// teléfono.
function OptionNumber({ value }: { value: number }) {
  return <span aria-hidden="true" className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[12.5px] font-semibold text-[var(--t2)] tabular-nums max-md:bg-[var(--marca-t)] max-md:text-[13px] max-md:font-bold max-md:text-[var(--marca-tx)]">{value}</span>;
}

/// «Configuración» del bot (WA-Respuestas, Plat-WA-Bot y sus M-*): las respuestas automáticas, el menú de hasta 10
/// opciones y, en la organización, «Además». Cada cambio se guarda al momento con todo el bot y su versión: los textos y
/// las opciones desde su diálogo; los interruptores, al tocarlos.
export function BotConfiguration({ bot, variant, teams, onSave }: {
  bot: BotData;
  variant: "organization" | "platform";
  teams: readonly WhatsAppTeamResponse[];
  onSave: (patch: BotPatch) => Promise<unknown>;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<Open | null>(null);
  // Los interruptores y «Quitar» se aplican al momento; si algo cambió mientras tanto (409), se relee el bot.
  const direct = useMutation({
    mutationFn: ({ patch }: { patch: BotPatch; done: string }) => onSave(patch),
    onSuccess: (_result, { done }) => { toast.success(done); },
    onError: async (error) => {
      toastActionError(error, t);
      await queryClient.invalidateQueries({ queryKey: botQueryRoot });
    },
  });
  const close = () => setOpen(null);
  const full = bot.menu.length >= maxMenuOptions;
  const addOption = () => setOpen(full ? { kind: "cap" } : { kind: "option", index: null });
  // En la organización, el menú pasa a los equipos de Clientes y los empleados, a los de Internos.
  const menuTeams = variant === "organization" ? teams.filter((team) => team.inbox === "Customers") : teams;
  const internalTeams = teams.filter((team) => team.inbox === "Internal");
  const employeesTeam = teamName(teams, bot.employeesTeamId);
  const welcomeDetail = t("whatsapp:bot.welcome.detail");
  const outOfHoursDetail = format.isLoading ? "" : scheduleSummary(bot.schedule, t, format);

  const edit = (onSelect: (trigger: HTMLButtonElement | null) => void): RowAction =>
    ({ label: t("whatsapp:bot.edit"), accessibleName: t("whatsapp:bot.edit"), icon: Pencil, onSelect });
  const rowActions = (name: string, actions: readonly RowAction[]) => <RowActions label={t("whatsapp:bot.rowActions", { name })} title={name} actions={actions} />;
  const optionActions = (index: number, label: string) => rowActions(label, [
    edit((trigger) => setOpen({ kind: "option", index, trigger })),
    { label: t("whatsapp:bot.option.remove"), accessibleName: t("whatsapp:bot.option.remove"), icon: Trash2, destructive: true,
      onSelect: () => direct.mutate({ patch: { menu: bot.menu.filter((_option, position) => position !== index) }, done: t("whatsapp:bot.option.removed", { name: label }) }) },
  ]);
  const toggle = (name: string, key: "askPromotions" | "offerAccountLink", checked: boolean | undefined) => <Switch aria-label={name} checked={checked ?? false}
    disabled={direct.isPending} onCheckedChange={(value) => direct.mutate({ patch: { [key]: value }, done: t("whatsapp:bot.saved") })} />;

  // En la compu, filas de lista con su ⋮; en el teléfono (M-WA-Respuestas), filas que se tocan con su ›.
  const row = ({ key, title, detail, leading, onOpen, actions, trailing }: {
    key: string; title: string; detail: ReactNode; leading?: ReactNode; onOpen?: () => void; actions?: ReactNode; trailing?: ReactNode;
  }) => phone
    ? <SettingsItem key={key} title={title} detail={detail} leading={leading} onClick={trailing ? undefined : onOpen} trailing={trailing} />
    : <ListItem key={key} icon={leading} title={title} detail={detail}>{trailing ?? actions}</ListItem>;
  const group = (label: string, rows: ReactNode) => phone ? <ul aria-label={label} className="m-0 list-none p-0">{rows}</ul> : <List label={label}>{rows}</List>;

  const autoTitle = t("whatsapp:bot.automatic");
  const menuTitle = t("whatsapp:bot.menu");
  const extraTitle = t("whatsapp:bot.extra");
  const welcomeTitle = t("whatsapp:bot.welcome.title");
  const outOfHoursTitle = t("whatsapp:bot.outOfHours.title");
  const system = <span className="text-[13px] text-[var(--t3)] max-md:text-[14px]">{t("whatsapp:bot.option.systemTag")}</span>;

  return <>
    <Section title={autoTitle}>
      {group(autoTitle, <>
        {row({ key: "welcome", title: welcomeTitle, detail: welcomeDetail, onOpen: () => setOpen({ kind: "welcome" }),
          actions: rowActions(welcomeTitle, [edit((trigger) => setOpen({ kind: "welcome", trigger }))]) })}
        {row({ key: "outOfHours", title: outOfHoursTitle, detail: outOfHoursDetail, onOpen: () => setOpen({ kind: "outOfHours" }),
          actions: rowActions(outOfHoursTitle, [edit((trigger) => setOpen({ kind: "outOfHours", trigger }))]) })}
      </>)}
    </Section>
    <Section title={menuTitle} action={{ label: t("whatsapp:bot.option.add"), onClick: addOption }}>
      {bot.menu.length === 0 ? <p className="p-4 text-[13px] text-[var(--t2)] md:px-5">{t("whatsapp:bot.option.empty")}</p>
        : group(menuTitle, bot.menu.map((option, index) => row({
          key: option.id ?? `option-${index}`, title: option.label, detail: optionDetail(option, teams, t), leading: <OptionNumber value={index + 1} />,
          onOpen: option.isSystem ? undefined : () => setOpen({ kind: "option", index }),
          actions: option.isSystem ? system : optionActions(index, option.label), trailing: option.isSystem && phone ? system : undefined,
        })))}
    </Section>
    {variant === "organization" ? <Section title={extraTitle}>
      {group(extraTitle, <>
        {row({ key: "promotions", title: t("whatsapp:bot.promotions.title"), detail: t("whatsapp:bot.promotions.detail"),
          trailing: toggle(t("whatsapp:bot.promotions.title"), "askPromotions", bot.askPromotions) })}
        {row({ key: "link", title: t("whatsapp:bot.accountLink.title"), detail: t("whatsapp:bot.accountLink.detail"),
          trailing: toggle(t("whatsapp:bot.accountLink.title"), "offerAccountLink", bot.offerAccountLink) })}
        {row({ key: "employees", title: t("whatsapp:bot.employees.title"),
          detail: employeesTeam ? t("whatsapp:bot.employees.detail", { team: employeesTeam }) : t("whatsapp:bot.employees.detailInbox"),
          onOpen: () => setOpen({ kind: "employees" }),
          actions: rowActions(t("whatsapp:bot.employees.title"), [edit((trigger) => setOpen({ kind: "employees", trigger }))]) })}
      </>)}
    </Section> : null}

    {open?.kind === "welcome" ? <WelcomeDialog welcome={bot.welcome} onSave={onSave} onClose={close} returnFocusTo={open.trigger} /> : null}
    {open?.kind === "outOfHours" ? <OutOfHoursDialog outOfHours={bot.outOfHours} schedule={bot.schedule} onSave={onSave} onClose={close} returnFocusTo={open.trigger} /> : null}
    {open?.kind === "option" ? <OptionDialog menu={bot.menu} index={open.index} teams={menuTeams} onSave={onSave} onClose={close} returnFocusTo={open.trigger} /> : null}
    {open?.kind === "employees" ? <EmployeesTeamDialog teamId={bot.employeesTeamId ?? null} teams={internalTeams} onSave={onSave} onClose={close} returnFocusTo={open.trigger} /> : null}
    {open?.kind === "cap" ? <ImportantNotice open onOpenChange={(value) => { if (!value) close(); }} title={t("whatsapp:bot.cap.title", { count: maxMenuOptions })}
      reason={t("whatsapp:bot.cap.reason", { count: maxMenuOptions })} detail={t("whatsapp:bot.cap.detail")}
      steps={[t("whatsapp:bot.cap.remove"), t("whatsapp:bot.cap.merge")]} /> : null}
  </>;
}
