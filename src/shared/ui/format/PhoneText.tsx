import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

export function PhoneText({ value, link, className }: {
  value: string | null | undefined;
  link?: "tel" | "whatsapp";
  className?: string;
}) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  const text = format.formatPhone(value);
  if (link === "tel") return <a href={`tel:${value}`} className={className}>{text}</a>;
  if (link === "whatsapp") {
    return <a href={`https://wa.me/${value.replace(/\D/g, "")}`} className={className}>{text}</a>;
  }
  return <span className={className}>{text}</span>;
}
