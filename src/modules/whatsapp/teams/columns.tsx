import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListCard } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import type { WhatsAppTeamResponse } from "../api/types";
import type { TeamScope } from "./api/teams";

/// Los primeros nombres del equipo (`memberPreview`, hasta 3), como los muestra WA-Equipos arriba de la cantidad.
export function teamPreviewText(team: WhatsAppTeamResponse): string | null {
  return team.memberPreview.length > 0 ? team.memberPreview.join(", ") : null;
}

/// «A los 10 minutos» o, sin aviso, «Sin aviso».
export function teamNoticeText(team: WhatsAppTeamResponse, t: TFunction): string {
  if (team.notifyAfterMinutes == null) return t("whatsapp:teams.notice.off");
  return t("whatsapp:teams.notice.after", { minutes: team.notifyAfterMinutes });
}

/// Tableros WA-Equipos y Plat-WA-Equipos (base de la 12): el equipo, su bandeja (en la organización), quiénes lo forman, la
/// cantidad y el aviso por correo, un dato por celda.
export function createTeamColumns(t: TFunction, scope: TeamScope = "organization"): Column<WhatsAppTeamResponse>[] {
  return [
    { id: "name", header: t("whatsapp:teams.columns.name"), type: "text", mobile: "primary", className: "w-[22%]", value: (team) => team.name },
    ...(scope === "organization" ? [{
      id: "inbox", header: t("whatsapp:teams.columns.inbox"), type: "custom", className: "w-[16%]",
      cell: (team) => team.inbox ? t(`whatsapp:teams.inbox.${team.inbox}`) : <EmptyValue />,
    } satisfies Column<WhatsAppTeamResponse>] : []),
    {
      id: "members", header: t(scope === "organization" ? "whatsapp:teams.columns.members" : "whatsapp:teams.columns.operators"), type: "custom",
      cell: (team) => teamPreviewText(team) ?? <EmptyValue />,
    },
    { id: "memberCount", header: t("whatsapp:teams.columns.count"), type: "integer", className: "w-24", value: (team) => team.memberCount },
    { id: "notice", header: t("whatsapp:teams.columns.notice"), type: "custom", cell: (team) => <span>{teamNoticeText(team, t)}</span> },
  ];
}

/// M-Filas-Base2 (M-WA-Equipos, 263) y M-Plat-WA-Equipos: una tarjeta con la bandeja (en la organización), el aviso por correo y
/// quiénes lo forman, cada dato con su nombre.
export function teamPhoneRow(team: WhatsAppTeamResponse, scope: TeamScope, t: TFunction, trailing: ReactNode): ReactNode {
  return <ListCard key={team.id} title={team.name} fields={[
    ...(scope === "organization" ? [{ label: t("whatsapp:teams.columns.inbox"), value: team.inbox ? t(`whatsapp:teams.inbox.${team.inbox}`) : <EmptyValue /> }] : []),
    { label: t("whatsapp:teams.columns.notice"), value: teamNoticeText(team, t) },
    { label: t(scope === "organization" ? "whatsapp:teams.columns.members" : "whatsapp:teams.columns.operators"), value: teamPreviewText(team) ?? <EmptyValue />, wide: true },
  ]} trailing={trailing} />;
}
