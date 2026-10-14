import { defineStatusTones } from "@/shared/format/statusTones";

/// Qué va a pasar con cada teléfono (WA-Telefonos, `.w-est`): ya es miembro en verde, se invita en petróleo e inválido
/// en rojo.
export const phoneImportOutcomeTones = defineStatusTones("WhatsAppPhoneImportOutcome", { AlreadyMember: "success", Invite: "pending", Invalid: "danger" });
