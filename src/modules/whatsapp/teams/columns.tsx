import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import type { WhatsAppTeamResponse } from "../api/types";
import type { TeamScope } from "./api/teams";

/// Cuántos hay en el equipo: personas en la organización, operadores en Plataforma.
export function teamMembersText(team: WhatsAppTeamResponse, scope: TeamScope, t: TFunction): string {
  return t(scope === "organization" ? "whatsapp:teams.members" : "whatsapp:teams.operators", { count: team.memberCount });
}

/// Los primeros nombres del equipo (`memberPreview`, hasta 3), como los muestra WA-Equipos arriba de la cantidad.
export function teamPreviewText(team: WhatsAppTeamResponse): string | null {
  return team.memberPreview.length > 0 ? team.memberPreview.join(", ") : null;
}

/// «A los 10 minutos» o, sin aviso, «Sin aviso».
export function teamNoticeText(team: WhatsAppTeamResponse, t: TFunction, short = false): string {
  if (team.notifyAfterMinutes == null) return t("whatsapp:teams.notice.off");
  return t(short ? "whatsapp:teams.notice.short" : "whatsapp:teams.notice.after", { minutes: team.notifyAfterMinutes });
}

/// Tableros WA-Equipos y Plat-WA-Equipos: el equipo (con su bandeja debajo, en la organización), quiénes lo forman con
/// la cantidad debajo, y el aviso por correo.
export function createTeamColumns(t: TFunction, scope: TeamScope = "organization"): Column<WhatsAppTeamResponse>[] {
  return [
    {
      id: "name", header: t("whatsapp:teams.columns.name"), type: "text", mobile: "primary", className: "w-[34%]",
      value: (team) => team.name,
      detail: (team) => scope === "organization" && team.inbox ? t(`whatsapp:teams.inbox.${team.inbox}`) : null,
    },
    {
      id: "members", header: t(scope === "organization" ? "whatsapp:teams.columns.members" : "whatsapp:teams.columns.operators"), type: "custom",
      cell: (team) => <span className="block truncate">{teamPreviewText(team) ?? teamMembersText(team, scope, t)}</span>,
      detail: (team) => teamPreviewText(team) ? teamMembersText(team, scope, t) : null,
    },
    { id: "notice", header: t("whatsapp:teams.columns.notice"), type: "custom", cell: (team) => <span>{teamNoticeText(team, t)}</span> },
  ];
}

/// M-WA-Equipos y M-Plat-WA-Equipos: el nombre con el aviso a la derecha y, debajo, quiénes son y la bandeja con cuántos.
export function teamPhoneRow(team: WhatsAppTeamResponse, scope: TeamScope, t: TFunction, trailing: ReactNode): ReactNode {
  const members = teamMembersText(team, scope, t);
  const detail = scope === "organization" && team.inbox ? `${t(`whatsapp:teams.inbox.${team.inbox}`)} · ${members}` : members;
  const preview = teamPreviewText(team);
  return <ListRow key={team.id} title={team.name} meta={teamNoticeText(team, t, true)} lines={preview ? [preview, detail] : [detail]} trailing={trailing} />;
}
