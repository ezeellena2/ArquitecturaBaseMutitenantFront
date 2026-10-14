import { useFormat } from "@/shared/format/useFormat";
import { Avatar } from "@/shared/ui/Avatar";
import { DateText } from "@/shared/ui/format/DateText";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { PhoneIcon } from "@/shared/ui/icons";
import { StatusDetail } from "@/shared/ui/StatusDot";
import type { WhatsAppContactResponse } from "../../api/types";

/** «ML» por Martina López: las dos primeras iniciales del nombre. */
function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

/// M-WA-Contactos (.w-conv .w-av): el círculo con las iniciales; sin nombre, el teléfono en gris (.w-av.g).
export function ContactAvatar({ name }: { name: string | null | undefined }) {
  if (name) return <Avatar size="row" initials={initials(name)} />;
  return <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[var(--t2)]">
    <PhoneIcon className="size-5" />
  </span>;
}

/** El nombre del contacto o, sin nombre, su número. */
export function ContactTitle({ contact }: { contact: Pick<WhatsAppContactResponse, "name" | "displayNumber"> }) {
  return contact.name ? <>{contact.name}</> : <PhoneText value={contact.displayNumber} />;
}

/// Lo que aclara el consentimiento, en su segunda línea: de dónde salió y cuándo cambió («Bot · 12/09/2026»).
export function ConsentOrigin({ contact }: { contact: WhatsAppContactResponse }) {
  const format = useFormat();
  if (!contact.consentSource || !contact.consentChangedAtUtc || format.isLoading) return null;
  return <StatusDetail>{format.formatEnum("WhatsAppConsentSource", contact.consentSource)}{" · "}<DateText value={contact.consentChangedAtUtc} /></StatusDetail>;
}
