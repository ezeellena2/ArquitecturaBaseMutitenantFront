import { createContext, createElement, Fragment, useContext, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cultureStorageKey } from "@/shared/i18n";
import { safeStorageGet } from "@/shared/hooks/safeStorage";
import type { ReferenceData } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { useCurrentUser } from "@/auth/useCurrentUser";
import type { MeResponse } from "@/shared/api/types";
import { getDefaultCultureProfile } from "./cultureProfiles";
import { createFormatters } from "./formatters";
import { parseDate, parseDateTime, parseDecimal, parseMoney, parsePercent, parseTime } from "./parsers";
import type { MoneyValue } from "./formatters";

export type { DateRangeValue, MoneyValue } from "./formatters";

type Formatters = ReturnType<typeof createFormatters>;
type BoundParsers = {
  parseDecimal: (input: string) => number | null;
  parseMoney: (input: string, currency?: string) => MoneyValue | null;
  parsePercent: (input: string) => number | null;
  parseDate: (input: string) => string | null;
  parseDateTime: (input: string) => string | null;
  parseTime: (input: string) => string | null;
};

export type FormatState = Formatters & BoundParsers & (
  | { isLoading: true; culture: null; timeZone: null; currency: null; referenceData: null }
  | { isLoading: false; culture: string; timeZone: string; currency: string; referenceData: ReferenceData }
);

const emptyText = (): string => "";
const unavailableFormatters: Formatters = {
  formatDate: emptyText,
  formatDateTime: emptyText,
  formatTime: emptyText,
  formatDateLong: emptyText,
  formatRelative: emptyText,
  formatDateRange: emptyText,
  formatInteger: emptyText,
  formatDecimal: emptyText,
  formatQuantity: emptyText,
  formatPercent: emptyText,
  formatMoney: emptyText,
  formatCompact: emptyText,
  formatFileSize: emptyText,
  formatDuration: emptyText,
  formatPhone: emptyText,
  formatTimeZone: emptyText,
  formatCulture: emptyText,
  formatTaxId: emptyText,
  formatEmail: emptyText,
  formatEnum: emptyText,
  formatBoolean: emptyText,
  formatEmpty: emptyText,
  formatText: emptyText,
};

const loadingState: FormatState = {
  isLoading: true,
  culture: null,
  timeZone: null,
  currency: null,
  referenceData: null,
  ...unavailableFormatters,
  parseDecimal: () => null,
  parseMoney: () => null,
  parsePercent: () => null,
  parseDate: () => null,
  parseDateTime: () => null,
  parseTime: () => null,
};

const FormatContext = createContext<FormatState | undefined>(undefined);

function effectivePreferences(data: ReferenceData, user: MeResponse | undefined) {
  const defaultCulture = getDefaultCultureProfile(data);
  const stored = safeStorageGet(cultureStorageKey);
  const culture = data.cultures.find((item) => item.isEnabled && item.code === user?.culture)?.code
    ?? data.cultures.find((item) => item.isEnabled && item.code === stored)?.code
    ?? defaultCulture.code;

  // Sin sesión rigen el catálogo y la cultura local; /api/me devuelve las preferencias efectivas.
  const country = data.countries.find(
    (item) => item.code === defaultCulture.countryCode && item.isEnabled,
  );
  const timeZone = user?.timeZoneId ?? country?.defaultTimeZoneId;
  const currency = user?.currencyCode ?? country?.defaultCurrencyCode;
  if (!timeZone || !currency
    || !data.timeZones.some((item) => item.id === timeZone && (user || item.isEnabled))
    || !data.currencies.some((item) => item.code === currency && (user || item.isEnabled))) {
    throw new Error("El catálogo no tiene zona y moneda habilitadas para la cultura predeterminada.");
  }
  return { culture, timeZone, currency };
}

/**
 * Las preferencias efectivas de /api/me ganan sobre la cultura local.
 */
export function FormatProvider({ children }: { children: ReactNode }) {
  const { data } = useReferenceData();
  const { data: user } = useCurrentUser();
  const preferences = useMemo(() => data ? effectivePreferences(data, user) : null, [data, user]);
  const { t, ready } = useTranslation(["common", "format", "enums"], {
    lng: preferences?.culture,
    useSuspense: false,
  });

  const value = useMemo<FormatState>(() => {
    if (!data || !preferences || !ready) return loadingState;
    const { culture, timeZone, currency } = preferences;
    const profile = data.cultures.find((item) => item.code === culture);
    if (!profile) throw new Error("Falta la cultura efectiva en el catálogo.");
    return {
      isLoading: false,
      culture,
      timeZone,
      currency,
      referenceData: data,
      ...createFormatters({
        referenceData: data,
        culture,
        timeZone,
        translate: (key, options) => t(key, options),
      }),
      parseDecimal: (input) => parseDecimal(input, profile),
      parseMoney: (input, selectedCurrency = currency) => parseMoney(input, selectedCurrency, profile, data),
      parsePercent: (input) => parsePercent(input, profile),
      parseDate: (input) => parseDate(input, profile),
      parseDateTime: (input) => parseDateTime(input, profile, timeZone),
      parseTime: (input) => parseTime(input, profile),
    };
  }, [data, preferences, ready, t]);

  const loading = value.isLoading
    ? createElement("div", {
      role: "status",
      "aria-busy": true,
      "aria-label": ready ? t("states.loading") : undefined,
      "data-format-loading": true,
    })
    : null;
  return createElement(
    Fragment,
    null,
    loading,
    createElement(FormatContext.Provider, { value }, children),
  );
}

export function useFormat(): FormatState {
  const context = useContext(FormatContext);
  if (!context) throw new Error("useFormat requiere FormatProvider.");
  return context;
}

/** Minutos al Este de UTC; solo sirve para ordenar zonas, no se almacena. */
export function timeZoneOffsetMinutes(id: string, now: Date = new Date()): number {
  const offset = new Intl.DateTimeFormat("en", {
    timeZone: id,
    timeZoneName: "longOffset",
    hour: "2-digit",
  }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value;
  if (offset === "GMT") return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset ?? "");
  if (!match) throw new Error(`No se pudo calcular el desfase de ${id}.`);
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}
