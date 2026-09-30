import { http, HttpResponse, type RequestHandler } from "msw";
import type { ReferenceData } from "@/shared/referenceData/referenceData";
import type { MeResponse } from "@/shared/api/types";

export function meHandlerFor(user: MeResponse): RequestHandler {
  return http.get("/api/me", () => HttpResponse.json(user));
}

// Fixture solo para tests: los datos del producto llegan de los JSON del backend.
export function referenceDataFixture(culture = "es-AR"): ReferenceData {
  const english = culture === "en-US";
  return {
    culture,
    currencies: [{
      code: "ARS", numericCode: "032", minorUnits: 2, symbol: "$",
      displaySymbol: english ? "ARS" : "$", name: english ? "Argentine Peso" : "Peso argentino",
      namePlural: english ? "Argentine pesos" : "Pesos argentinos", isEnabled: true, sortOrder: 1,
    }],
    countries: [{
      code: "AR", alpha3: "ARG", numericCode: "032", callingCode: "54",
      defaultCurrencyCode: "ARS", defaultTimeZoneId: "America/Argentina/Buenos_Aires",
      name: "Argentina", isEnabled: true, sortOrder: 1,
    }],
    timeZones: [{
      id: "America/Argentina/Buenos_Aires", countryCodes: ["AR"], city: "Buenos Aires",
      isEnabled: true, sortOrder: 1,
    }],
    cultures: [
      {
        code: "es-AR", languageCode: "es", countryCode: "AR", datePattern: "dd/MM/yyyy",
        timePattern: "HH:mm", dateTimePattern: "dd/MM/yyyy HH:mm", longDatePattern: "d 'de' MMMM 'de' yyyy",
        amDesignator: "a. m.", pmDesignator: "p. m.",
        decimalSeparator: ",", groupSeparator: ".", currencyPattern: "{symbol} {number}",
        percentPattern: "{number} %", fallbackCulture: null, isDefault: true,
        name: english ? "Spanish (Argentina)" : "Español (Argentina)", isEnabled: true, sortOrder: 1,
      },
      {
        code: "en-US", languageCode: "en", countryCode: "US", datePattern: "MM/dd/yyyy",
        timePattern: "h:mm tt", dateTimePattern: "MM/dd/yyyy h:mm tt", longDatePattern: "MMMM d, yyyy",
        amDesignator: "AM", pmDesignator: "PM",
        decimalSeparator: ".", groupSeparator: ",", currencyPattern: "{symbol}{number}",
        percentPattern: "{number}%", fallbackCulture: "es-AR", isDefault: false,
        name: english ? "English (United States)" : "Inglés (Estados Unidos)", isEnabled: true, sortOrder: 2,
      },
    ],
    taxIdTypes: [{
      code: "AR-CUIT", countryCode: "AR", label: "CUIT", mask: "99-99999999-9",
      validatorKey: "ar-cuit-mod11", appliesTo: "Both",
      // En este tipo, el nombre traducido coincide en ambas culturas.
      name: "CUIT", isEnabled: true, sortOrder: 1,
    }],
  };
}

export const handlers: RequestHandler[] = [
  http.get("/api/me/login-methods", () => HttpResponse.json({ methods: [
    { id: "email-ana", type: "Email", value: "ana@example.test", isVerified: true, isPrimary: true, canRemove: false, canMakePrimary: false },
  ], canLinkGoogle: false, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30 })),
  http.get("/api/reference-data", ({ request }) => {
    const culture = request.headers.get("accept-language") === "en-US" ? "en-US" : "es-AR";
    const etag = `"fixture-${culture}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new HttpResponse(null, { status: 304, headers: { ETag: etag } });
    }
    return HttpResponse.json(referenceDataFixture(culture), { headers: { ETag: etag } });
  }),
];
