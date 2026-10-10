import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "cn";
import { Popover } from "radix-ui";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "../button";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { Input } from "../input";

interface MonthFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onValidityChange?: (isValid: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
}

/** Selector de un período civil YYYY-MM. No define historia disponible ni período de cuotas. */
export function MonthField({ value, onChange, onValidityChange, id, disabled, className,
  "aria-label": label, "aria-invalid": externalInvalid, "aria-describedby": externalDescription,
  "aria-required": required }: MonthFieldProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const messageId = useId();
  const [openedFor, setOpenedFor] = useState<{ value: string | null } | null>(null);
  if (openedFor && (openedFor.value !== value || format.isLoading || disabled)) setOpenedFor(null);
  let parsed: string | null = null;
  let invalid = false;
  try { parsed = format.parseMonth(value ?? ""); } catch { invalid = true; }
  useEffect(() => { onValidityChange?.(!invalid); }, [invalid, onValidityChange]);

  const open = openedFor !== null && openedFor.value === value && !format.isLoading && !disabled;
  const showMessage = invalid && !(externalInvalid && externalDescription);
  const description = [externalDescription, showMessage ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  const displayed = format.isLoading ? t("states.loading")
    : parsed === null ? t("fields.chooseMonth") : format.formatMonth(parsed);

  return <>
    <Popover.Root open={open} onOpenChange={(next) => setOpenedFor(next ? { value } : null)}>
      <Popover.Trigger asChild>
        {/* v115 Uso: botón secundario con mes y chevron. El popup incluye año editable: semántica dialog. */}
        <Button id={id} type="button" role="combobox" variant="outline" disabled={disabled || format.isLoading}
          className={cn("max-w-full gap-2 max-md:h-12 max-md:rounded-[12px] max-md:text-[16px]", className)}
          aria-label={label} aria-busy={format.isLoading} aria-invalid={externalInvalid || invalid}
          aria-describedby={description} aria-required={required}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpenedFor({ value });
            }
          }}>
          <span className="truncate">{displayed}</span><ChevronDownIcon className="size-3.5 text-[var(--t3)]" />
        </Button>
      </Popover.Trigger>
      {open ? <Popover.Portal>
        <MonthPicker key={value} value={parsed ?? format.getCurrentMonth()} selectedValue={parsed}
          onSelect={(next) => { onChange(next); setOpenedFor(null); }} />
      </Popover.Portal> : null}
    </Popover.Root>
    {showMessage ? <p id={messageId} role="alert" className="text-[13px] text-[var(--peligro)]">{t("fields.invalidMonth")}</p> : null}
  </>;
}

function MonthPicker({ value, selectedValue, onSelect }: {
  value: string;
  selectedValue: string | null;
  onSelect: (value: string) => void;
}) {
  const format = useFormat();
  const { t } = useTranslation();
  const yearId = useId();
  const [year, setYear] = useState(value.slice(0, 4));
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(() => format.getMonthOptions(value).findIndex((option) => option.value === value));
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  let anchor: string | null = null;
  try { anchor = format.parseMonth(`${year}-01`); } catch { /* El año a medio escribir no es un período. */ }
  const options = anchor ? format.getMonthOptions(anchor) : [];
  const invalid = anchor === null;
  const previous = anchor ? format.getAdjacentMonthYear(anchor, -1) : null;
  const next = anchor ? format.getAdjacentMonthYear(anchor, 1) : null;

  function moveYear(period: string) {
    setYear(period.slice(0, 4));
    setTouched(false);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowDown" || event.key === "ArrowRight" ? (index + 1) % options.length
      : event.key === "ArrowUp" || event.key === "ArrowLeft" ? (index + options.length - 1) % options.length
        : event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : null;
    if (next !== null) {
      event.preventDefault();
      setActive(next);
      optionRefs.current[next]?.focus();
    }
  }

  return <Popover.Content role="dialog" aria-label={t("fields.chooseMonth")} sideOffset={4} align="start"
    className="z-50 w-[min(18rem,calc(100vw-2rem))] max-h-(--radix-popover-content-available-height) overflow-y-auto rounded-[10px] border border-[var(--borde)] bg-[var(--lado-activo)] p-2 text-[var(--t1)] shadow-[var(--sombra-menu)]"
    onOpenAutoFocus={(event) => { event.preventDefault(); optionRefs.current[active]?.focus(); }}>
    <div className="mb-2 flex items-center gap-2">
      <Button type="button" variant="icon" size="icon" aria-label={t("fields.previousYear")}
        disabled={previous === null} onClick={() => { if (previous) moveYear(previous); }} className="max-md:size-12">
        <ChevronLeftIcon />
      </Button>
      <div className="min-w-0 flex-1">
        <label htmlFor={yearId} className="sr-only">{t("fields.year")}</label>
        <Input id={yearId} type="text" inputMode="numeric" value={year}
          onChange={(event) => setYear(event.target.value)} onBlur={() => setTouched(true)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (!invalid) optionRefs.current[active]?.focus(); else setTouched(true); } }}
          aria-invalid={invalid && touched} aria-describedby={invalid && touched ? `${yearId}-error` : undefined} />
      </div>
      <Button type="button" variant="icon" size="icon" aria-label={t("fields.nextYear")}
        disabled={next === null} onClick={() => { if (next) moveYear(next); }} className="max-md:size-12">
        <ChevronRightIcon />
      </Button>
    </div>
    {invalid && touched ? <p id={`${yearId}-error`} role="alert" className="text-[13px] text-[var(--peligro)]">{t("fields.invalidYear")}</p> : null}
    <div role="listbox" aria-label={t("fields.month")} className="max-h-72 overflow-y-auto">
      {options.map((option, index) => <Button key={option.value} ref={(node) => { optionRefs.current[index] = node; }}
        type="button" role="option" variant="icon" aria-selected={option.value === selectedValue} tabIndex={active === index ? 0 : -1}
        className="h-9 w-full justify-start px-2 text-[13px] aria-selected:bg-[var(--s2)] max-md:h-12 max-md:text-[16px]"
        onFocus={() => setActive(index)} onKeyDown={(event) => navigate(event, index)} onClick={() => onSelect(option.value)}>
        {option.label}
      </Button>)}
    </div>
  </Popover.Content>;
}
