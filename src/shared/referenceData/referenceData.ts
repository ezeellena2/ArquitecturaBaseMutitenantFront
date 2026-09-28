import { z } from "zod";
import { api } from "@/shared/api/httpClient";
import type { components } from "@/shared/api/generated/schema";

const referenceRow = {
  isEnabled: z.boolean(),
  sortOrder: z.number().int().nullable(),
};

const currencySchema = z.object({
  code: z.string().min(1),
  numericCode: z.string().min(1),
  minorUnits: z.number().int().nonnegative().nullable(),
  symbol: z.string(),
  displaySymbol: z.string(),
  name: z.string().min(1),
  namePlural: z.string().min(1),
  ...referenceRow,
});

const countrySchema = z.object({
  code: z.string().min(1),
  alpha3: z.string().min(1),
  numericCode: z.string().min(1),
  callingCode: z.string().nullable(),
  defaultCurrencyCode: z.string().nullable(),
  defaultTimeZoneId: z.string().nullable(),
  name: z.string().min(1),
  ...referenceRow,
});

const timeZoneSchema = z.object({
  id: z.string().min(1),
  countryCodes: z.array(z.string().min(1)),
  city: z.string().min(1),
  ...referenceRow,
});

const cultureSchema = z.object({
  code: z.string().min(1),
  languageCode: z.string().min(1),
  countryCode: z.string().min(1),
  datePattern: z.string().min(1),
  timePattern: z.string().min(1),
  dateTimePattern: z.string().min(1),
  longDatePattern: z.string().min(1),
  decimalSeparator: z.string().min(1),
  groupSeparator: z.string().min(1),
  currencyPattern: z.string().min(1),
  percentPattern: z.string().min(1),
  fallbackCulture: z.string().nullable(),
  isDefault: z.boolean(),
  name: z.string().min(1),
  ...referenceRow,
});

const taxIdTypeSchema = z.object({
  code: z.string().min(1),
  countryCode: z.string().min(1),
  label: z.string().min(1),
  mask: z.string().min(1),
  validatorKey: z.string().min(1),
  appliesTo: z.string().min(1),
  name: z.string().min(1),
  ...referenceRow,
});

const referenceDataSchema = z.object({
  culture: z.string().min(1),
  currencies: z.array(currencySchema),
  countries: z.array(countrySchema),
  timeZones: z.array(timeZoneSchema),
  cultures: z.array(cultureSchema),
  taxIdTypes: z.array(taxIdTypeSchema),
});

export type CurrencyReference = z.infer<typeof currencySchema>;
export type CountryReference = z.infer<typeof countrySchema>;
export type TimeZoneReference = z.infer<typeof timeZoneSchema>;
export type CultureReference = z.infer<typeof cultureSchema>;
export type TaxIdTypeReference = z.infer<typeof taxIdTypeSchema>;
export type ReferenceData = z.infer<typeof referenceDataSchema>;

type RawReferenceData = components["schemas"]["ReferenceDataHttpResponse"];

export function parseReferenceData(raw: unknown): ReferenceData {
  return referenceDataSchema.parse(raw);
}

// El API devuelve todas las filas. Los selectores ofrecen solo las habilitadas;
// los formateadores conservan acceso a las deshabilitadas para valores guardados.
export function enabledOptions<T extends { isEnabled: boolean }>(rows: readonly T[]): T[] {
  return rows.filter((row) => row.isEnabled);
}

export async function fetchReferenceData(
  culture: string | null,
  etag: string | null,
): Promise<{ data?: ReferenceData; etag: string | null; notModified: boolean }> {
  const headers = new Headers();
  // Sin preferencia local, la API resuelve IsDefault del catálogo. El navegador
  // puede enviar su propio Accept-Language, por eso la señal explícita "und".
  headers.set("accept-language", culture ?? "und");
  if (etag) headers.set("if-none-match", etag);

  const response = await api.getWithMetadata<RawReferenceData>("/api/reference-data", { headers });
  return {
    data: response.data === undefined ? undefined : parseReferenceData(response.data),
    etag: response.etag,
    notModified: response.notModified,
  };
}
