import { useDateInTimeZone } from "@/shared/format/useDateInTimeZone";
import { FormatLoading } from "./EmptyValue";

export function DateInTimeZoneText({ value, timeZone }: { value: string; timeZone: string }) {
  const text = useDateInTimeZone(value, timeZone);
  return text === null ? <FormatLoading /> : <time dateTime={value}>{text}</time>;
}
