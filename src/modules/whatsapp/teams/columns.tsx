import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import type { WhatsAppTeamResponse } from "../api/types";
import type { TeamScope } from "./api/teams";

/// Cuántos hay en el equipo: personas en la organización, operadores en Plataforma. El contrato trae la cantidad y no
/// los nombres de la fila (WA-Equipos los muestra arriba de la cantidad).
export function teamMembersText(team: WhatsAppTeamResponse, scope: TeamScope, t: TFunction): string {
  return t(scope === "organization" ? "whatsapp:teams.members" : "whatsapp:teams.operators", { count: team.memberCount });
}

/// «A los 10 minutos» o, sin aviso, «Sin aviso».
export function teamNoticeText(team: WhatsAppTeamResponse, t: TFunction, short = false): string {
  if (team.notifyAfterMinutes == null) return t("whatsapp:teams.notice.off");
  return t(short ? "whatsapp:teams.notice.short" : "whatsapp:teams.notice.after", { minutes: team.notifyAfterMinutes });
}

/// Tableros WA-Equipos y Plat-WA-Equipos: el equipo (con su bandeja debajo, en la organización), cuántos lo forman y
/// el aviso por correo.
export function createTeamColumns(t: TFunction, scope: TeamScope = "organization"): Column<WhatsAppTeamResponse>[] {
  return [
    {
      id: "name", header: t("whatsapp:teams.columns.name"), type: "text", mobile: "primary", className: "w-[34%]",
      value: (team) => team.name,
      detail: (team) => scope === "organization" && team.inbox ? t(`whatsapp:teams.inbox.${team.inbox}`) : null,
    },
    {
      id: "members", header: t(scope === "organization" ? "whatsapp:teams.columns.members" : "whatsapp:teams.columns.operators"), type: "custom",
      cell: (team) => <span>{teamMembersText(team, scope, t)}</span>,
    },
    { id: "notice", header: t("whatsapp:teams.columns.notice"), type: "custom", cell: (team) => <span>{teamNoticeText(team, t)}</span> },
  ];
}

/// M-WA-Equipos y M-Plat-WA-Equipos: el nombre con el aviso a la derecha y, debajo, la bandeja y cuántos son.
export function teamPhoneRow(team: WhatsAppTeamResponse, scope: TeamScope, t: TFunction, trailing: ReactNode): ReactNode {
  const members = teamMembersText(team, scope, t);
  const detail = scope === "organization" && team.inbox ? `${t(`whatsapp:teams.inbox.${team.inbox}`)} · ${members}` : members;
  return <ListRow key={team.id} title={team.name} meta={teamNoticeText(team, t, true)} lines={[detail]} trailing={trailing} />;
}
