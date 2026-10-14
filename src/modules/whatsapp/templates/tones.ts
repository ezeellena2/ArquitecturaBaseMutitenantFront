import { defineStatusTones } from "@/shared/format/statusTones";

/// El estado en Meta (WA-Plantillas, `.w-est`): aprobada en verde, en revisión en ámbar, rechazada en rojo y pausada en
/// gris (el lienzo no dibuja la pausada).
export const templateStatusTones = defineStatusTones("WhatsAppTemplateStatus", { Approved: "success", Pending: "warning", Rejected: "danger", Paused: "neutral" });
