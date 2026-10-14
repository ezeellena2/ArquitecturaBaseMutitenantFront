import type { TFunction } from "i18next";
import type { FormatState } from "@/shared/format/useFormat";
import { validationConstraints } from "@/shared/api/generated/validation";
import type {
  PlatformWhatsAppBotResponse,
  UpdatePlatformWhatsAppBotRequest,
  UpdateWhatsAppBotRequest,
  WhatsAppBotMenuOption,
  WhatsAppBotMenuOptionInput,
  WhatsAppBotResponse,
  WhatsAppBotSchedule,
  WhatsAppBotScheduleDay,
  WhatsAppBotScheduleInput,
  WhatsAppTeamResponse,
} from "../../api/types";

export type WeekDay = WhatsAppBotScheduleDay["day"];

/** Los días en el orden del tablero (WA-Respuestas, «Fuera de horario»): de lunes a domingo. */
export const weekDays: readonly WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** El tope del menú: lo que entra en una lista de WhatsApp (400 `WhatsApp.Bot.TooManyOptions`). */
export const maxMenuOptions = validationConstraints.UpdateWhatsAppBotHttpRequest.menu.maxItems;

/** Lo que tienen en común el bot de un número y el de Plataforma; «Además» es solo de la organización. */
export interface BotData {
  welcome: string;
  outOfHours: string;
  schedule: WhatsAppBotSchedule;
  menu: readonly WhatsAppBotMenuOption[];
  version: number;
  askPromotions?: boolean;
  offerAccountLink?: boolean;
  employeesTeamId?: string | null;
}

export type BotPatch = Partial<Pick<BotData, "welcome" | "outOfHours" | "schedule" | "menu" | "askPromotions" | "offerAccountLink" | "employeesTeamId">>;

/** Una hora del contrato (`TimeOnly`, «09:00:00») tal como llega, o nada si no es texto. */
export const timeOf = (value: unknown): string | null => typeof value === "string" ? value : null;

function scheduleInput(schedule: WhatsAppBotSchedule): WhatsAppBotScheduleInput {
  return { timeZoneId: schedule.timeZoneId, days: schedule.days.map((day) => ({ day: day.day, from: day.from, to: day.to })) };
}

/// El menú que se guarda: cada opción con su id, y el equipo o el texto según lo que hace. La opción del sistema de
/// Plataforma («Entrar a mi cuenta») no se edita: la conserva el back y no viaja.
function menuInput(menu: readonly WhatsAppBotMenuOption[]): WhatsAppBotMenuOptionInput[] {
  return menu.filter((option) => !option.isSystem).map((option) => ({
    id: option.id ?? null, label: option.label, action: option.action,
    teamId: option.action === "Team" ? option.teamId ?? null : null,
    reply: option.action === "Reply" ? option.reply ?? null : null,
  }));
}

/** El PUT del bot de un número: todo lo guardado con el cambio encima, y la versión que se leyó. */
export function numberBotRequest(bot: WhatsAppBotResponse, patch: BotPatch): UpdateWhatsAppBotRequest {
  const next = { ...bot, ...patch };
  return { welcome: next.welcome, outOfHours: next.outOfHours, schedule: scheduleInput(next.schedule), menu: menuInput(next.menu),
    askPromotions: next.askPromotions, offerAccountLink: next.offerAccountLink, employeesTeamId: next.employeesTeamId ?? null, version: bot.version };
}

/** El PUT del bot de Plataforma, sin «Además». */
export function platformBotRequest(bot: PlatformWhatsAppBotResponse, patch: BotPatch): UpdatePlatformWhatsAppBotRequest {
  const next = { ...bot, ...patch };
  return { welcome: next.welcome, outOfHours: next.outOfHours, schedule: scheduleInput(next.schedule), menu: menuInput(next.menu), version: bot.version };
}

/** El equipo de una opción, por su id; si ya no está, el nombre genérico de la acción. */
export function teamName(teams: readonly WhatsAppTeamResponse[], teamId: string | null | undefined): string | null {
  return teams.find((team) => team.id === teamId)?.name ?? null;
}

/// Lo que hace una opción, en la segunda línea (WA-Respuestas): «Pasa a Ventas», «Contesta: «…»» o, la del sistema de
/// Plataforma, que manda el enlace para entrar.
export function optionDetail(option: WhatsAppBotMenuOption, teams: readonly WhatsAppTeamResponse[], t: TFunction): string {
  if (option.isSystem) return t("whatsapp:bot.option.system");
  if (option.action === "Reply") return t("whatsapp:bot.option.replies", { reply: option.reply ?? "" });
  const name = teamName(teams, option.teamId);
  return name ? t("whatsapp:bot.option.toTeam", { team: name }) : t("enums:WhatsAppBotAction.Team");
}

/// «Lunes a viernes, de 09:00 a 18:00» (WA-Respuestas, «Fuera de horario»): los días seguidos con el mismo horario van
/// juntos; cada tramo con su horario. Las horas salen de `shared/format`.
export function scheduleSummary(schedule: WhatsAppBotSchedule, t: TFunction, format: FormatState): string {
  const days = weekDays.flatMap((day) => {
    const found = schedule.days.find((item) => item.day === day);
    const from = timeOf(found?.from);
    const to = timeOf(found?.to);
    return found && from && to ? [{ day, index: weekDays.indexOf(day), from, to }] : [];
  });
  if (days.length === 0) return t("whatsapp:bot.schedule.alwaysClosed");
  const groups: (typeof days)[] = [];
  for (const day of days) {
    const last = groups.at(-1);
    const previous = last?.at(-1);
    if (last && previous && previous.index === day.index - 1 && previous.from === day.from && previous.to === day.to) last.push(day);
    else groups.push([day]);
  }
  return groups.map((group, position) => {
    const name = (day: WeekDay, first: boolean) => first ? format.formatEnum("DayOfWeek", day) : t(`whatsapp:bot.schedule.dayInText.${day}`);
    const hours = { from: format.formatTime(group[0].from), to: format.formatTime(group[0].to) };
    const first = name(group[0].day, position === 0);
    if (group.length === 1) return t("whatsapp:bot.schedule.day", { day: first, ...hours });
    const last = name(group[group.length - 1].day, false);
    return t(group.length === 2 ? "whatsapp:bot.schedule.pair" : "whatsapp:bot.schedule.range", { first, last, ...hours });
  }).join("; ");
}
