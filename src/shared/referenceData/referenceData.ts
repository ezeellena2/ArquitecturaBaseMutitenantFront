// zod/mini valida igual con menos peso: el catálogo se lee al abrir cualquier pantalla, también la portada.
import { z } from "zod/mini";
import { api } from "@/shared/api/httpClient";
import type { components } from "@/shared/api/generated/schema";

const referenceRow = {
  isEnabled: z.boolean(),
  sortOrder: z.nullable(z.int()),
};

const currencySchema = z.object({
  code: z.string().check(z.minLength(1)),
  numericCode: z.string().check(z.minLength(1)),
  minorUnits: z.nullable(z.int().check(z.nonnegative())),
  symbol: z.string(),
  displaySymbol: z.string(),
  name: z.string().check(z.minLength(1)),
  namePlural: z.string().check(z.minLength(1)),
  ...referenceRow,
});

const countrySchema = z.object({
  code: z.string().check(z.minLength(1)),
  alpha3: z.string().check(z.minLength(1)),
  numericCode: z.string().check(z.minLength(1)),
  callingCode: z.nullable(z.string()),
  defaultCurrencyCode: z.nullable(z.string()),
  defaultTimeZoneId: z.nullable(z.string()),
  name: z.string().check(z.minLength(1)),
  ...referenceRow,
});

const timeZoneSchema = z.object({
  id: z.string().check(z.minLength(1)),
  countryCodes: z.array(z.string().check(z.minLength(1))),
  city: z.string().check(z.minLength(1)),
  ...referenceRow,
});

const cultureSchema = z.object({
  code: z.string().check(z.minLength(1)),
  languageCode: z.string().check(z.minLength(1)),
  countryCode: z.string().check(z.minLength(1)),
  datePattern: z.string().check(z.minLength(1)),
  timePattern: z.string().check(z.minLength(1)),
  dateTimePattern: z.string().check(z.minLength(1)),
  longDatePattern: z.string().check(z.minLength(1)),
  amDesignator: z.string().check(z.minLength(1)),
  pmDesignator: z.string().check(z.minLength(1)),
  decimalSeparator: z.string().check(z.minLength(1)),
  groupSeparator: z.string().check(z.minLength(1)),
  currencyPattern: z.string().check(z.minLength(1)),
  percentPattern: z.string().check(z.minLength(1)),
  fallbackCulture: z.nullable(z.string()),
  isDefault: z.boolean(),
  name: z.string().check(z.minLength(1)),
  ...referenceRow,
});

const taxIdTypeSchema = z.object({
  code: z.string().check(z.minLength(1)),
  countryCode: z.string().check(z.minLength(1)),
  label: z.string().check(z.minLength(1)),
  mask: z.string().check(z.minLength(1)),
  validatorKey: z.string().check(z.minLength(1)),
  appliesTo: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  ...referenceRow,
});

const referenceDataSchema = z.object({
  culture: z.string().check(z.minLength(1)),
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

/** Tablero Configuración: la moneda con su código, «Peso argentino (ARS)», en el desplegable y como texto. */
export function currencyLabel(currency: Pick<CurrencyReference, "name" | "code">): string {
  return `${currency.name} (${currency.code})`;
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
