import { useDateInTimeZone } from "@/shared/format/useDateInTimeZone";
import { FormatLoading } from "./EmptyValue";

export function DateInTimeZoneText({ value, timeZone, kind = "date" }: { value: string; timeZone: string; kind?: "date" | "time" }) {
  const text = useDateInTimeZone(value, timeZone, kind);
  return text === null ? <FormatLoading /> : <time dateTime={value}>{text}</time>;
}
