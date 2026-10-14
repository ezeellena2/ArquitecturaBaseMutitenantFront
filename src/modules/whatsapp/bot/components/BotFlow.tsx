import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Section } from "@/shared/ui/Section";
import type { WhatsAppBotMenuOption, WhatsAppTeamResponse } from "../../api/types";
import { teamName, type BotData } from "../lib/botModel";

interface Branch { key: string; mark: string; title: string; detail: string; team: boolean }

/// «Recorrido» del bot (WA-Bot-Recorrido, Plat-WA-Bot-Recorrido y sus M-*): qué pasa cuando llega un mensaje, con lo que
/// está configurado. En la organización, primero se pregunta si es un empleado (va directo a su equipo, sin menú); el
/// resto recibe la bienvenida o «Fuera de horario» y el menú, con una rama por opción.
export function BotFlow({ bot, variant, teams }: { bot: BotData; variant: "organization" | "platform"; teams: readonly WhatsAppTeamResponse[] }) {
  const { t } = useTranslation("whatsapp");
  const { phone } = useAppChrome();
  const branch = (option: WhatsAppBotMenuOption, index: number): Branch => {
    const key = option.id ?? `option-${index}`;
    const mark = String(index + 1);
    if (option.isSystem) return { key, mark, title: t("bot.flow.systemTitle"), detail: t("bot.flow.systemDetail"), team: false };
    if (option.action === "Team") return { key, mark, title: teamName(teams, option.teamId) ?? t("bot.flow.team"), detail: t("bot.flow.team"), team: true };
    return phone ? { key, mark, title: option.label, detail: t("bot.flow.reply"), team: false } : { key, mark, title: t("bot.flow.reply"), detail: option.label, team: false };
  };
  const branches = bot.menu.map(branch);
  const employees = variant === "organization";
  const employeesTeam = teamName(teams, bot.employeesTeamId);
  const options = t("bot.flow.options", { count: bot.menu.length });

  if (phone) return <Section title={t("bot.flow.title")} phone="untitled">
    {/* M-WA-Bot-Recorrido (.ap-rec): los pasos numerados unidos por una línea, con las ramas adentro de su paso. */}
    <ol className="m-0 flex list-none flex-col px-4 pt-2 pb-4">
      <PhoneStep mark="1" title={t("bot.flow.arrives")} />
      {employees ? <PhoneStep mark="?" question title={t("bot.flow.employee")} detail={t("bot.flow.employeeDetail")}
        branches={[{ key: "yes", mark: t("bot.flow.yes"), title: employeesTeam ?? t("bot.flow.internal"), detail: t("bot.flow.internal"), team: true }]} /> : null}
      <PhoneStep mark="2" title={t("bot.flow.welcome")} detail={t("bot.flow.welcomeDetail")} />
      <PhoneStep mark="3" title={t("bot.flow.menu")} detail={options} branches={branches} />
    </ol>
  </Section>;

  const menu = <>
    <Node title={t("bot.flow.welcome")} detail={t("bot.flow.welcomeDetail")} />
    <Line />
    <Node title={t("bot.flow.menu")} detail={options} selected />
    {branches.length > 0 ? <div className="relative flex max-w-[720px] flex-wrap items-start justify-center gap-3.5 pt-[22px] before:absolute before:top-0 before:right-20 before:left-20 before:h-0.5 before:bg-[var(--borde2)]">
      {branches.map((item) => <div key={item.key} className="relative flex flex-col items-center before:absolute before:-top-[22px] before:left-1/2 before:h-[22px] before:w-0.5 before:bg-[var(--borde2)]">
        <Mark>{item.mark}</Mark>
        <Node title={item.title} detail={item.detail} team={item.team} narrow />
      </div>)}
    </div> : null}
  </>;
  return <Section title={t("bot.flow.title")}>
    {/* WA-Bot-Recorrido (.o-flujo): los nodos centrados y unidos por líneas; la pregunta, con borde punteado. */}
    <div className="flex flex-col items-center p-6">
      <Node title={t("bot.flow.arrives")} start />
      <Line />
      {employees ? <>
        <Node title={t("bot.flow.employee")} detail={t("bot.flow.employeeDetail")} question />
        <Line />
        <div className="flex items-start gap-10">
          <div className="flex flex-col items-center">
            <Mark>{t("bot.flow.yes")}</Mark>
            <Node title={employeesTeam ?? t("bot.flow.internal")} detail={t("bot.flow.internalTeam")} team />
          </div>
          <div className="flex flex-col items-center">
            <Mark>{t("bot.flow.no")}</Mark>
            {menu}
          </div>
        </div>
      </> : menu}
    </div>
  </Section>;
}

function Line() {
  return <span aria-hidden="true" className="block h-[22px] w-0.5 bg-[var(--borde2)]" />;
}

function Mark({ children }: { children: ReactNode }) {
  return <span className="my-1 text-[12px] text-[var(--t3)]">{children}</span>;
}

/// Un paso del recorrido (.o-nodo): el inicio en gris, la pregunta punteada, un equipo en petróleo claro y el menú marcado.
function Node({ title, detail, start, question, team, selected, narrow }: {
  title: string; detail?: string; start?: boolean; question?: boolean; team?: boolean; selected?: boolean; narrow?: boolean;
}) {
  return <div className={cn("flex flex-col gap-0.5 rounded-[10px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3.5 py-2.5 text-center text-[13px]",
    narrow ? "w-40" : question ? "w-[300px]" : "w-[200px]",
    start && "border-[var(--borde)] bg-[var(--s3)]", question && "border-dashed", team && "border-[var(--marca)] bg-[var(--marca-t)]",
    selected && "border-[var(--marca)] shadow-[0_0_0_3px_var(--marca-t)]")}>
    <b className="font-semibold text-[var(--t1)]">{title}</b>
    {detail ? <span className="text-[12px] text-[var(--t3)]">{detail}</span> : null}
  </div>;
}

/// Un paso del teléfono (.ap-n): el número en su círculo (el «?» de la pregunta, en ámbar), la caja y sus ramas.
function PhoneStep({ mark, title, detail, question, branches }: { mark: string; title: string; detail?: string; question?: boolean; branches?: readonly Branch[] }) {
  return <li className="relative flex gap-3 pb-3.5 before:absolute before:top-6 before:bottom-0 before:left-[11px] before:w-0.5 before:bg-[var(--borde2)] last:before:hidden">
    <span aria-hidden="true" className={cn("relative z-[1] mt-2.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-[var(--lado-activo)]",
      question ? "bg-[var(--alerta)]" : "bg-[var(--marca)]")}>{mark}</span>
    <div className="min-w-0 flex-1 rounded-[12px] border border-[var(--borde)] bg-[var(--lado-activo)] px-3.5 py-2.5">
      <b className="block text-[15px] font-semibold text-[var(--t1)]">{title}</b>
      {detail ? <span className="text-[13px] text-[var(--t3)]">{detail}</span> : null}
      {branches && branches.length > 0 ? <ul className="m-0 mt-2.5 flex list-none flex-col gap-1.5 p-0">
        {branches.map((item) => <li key={item.key} className="flex items-center gap-2.5 rounded-[10px] border border-[var(--borde)] bg-[var(--s2)] px-3 py-[9px] text-[14.5px] text-[var(--t1)]">
          <span className="rounded-[6px] bg-[var(--marca-t)] px-[7px] py-0.5 text-[12px] font-bold text-[var(--marca-tx)]">{item.mark}</span>
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          <span className="ml-auto shrink-0 text-[12.5px] text-[var(--t3)]">{item.detail}</span>
        </li>)}
      </ul> : null}
    </div>
  </li>;
}
