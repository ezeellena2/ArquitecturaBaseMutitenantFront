export interface paths {
    "/api/reference-data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ReferenceDataHttpResponse"];
                        "application/json": components["schemas"]["ReferenceDataHttpResponse"];
                        "text/json": components["schemas"]["ReferenceDataHttpResponse"];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Internal Server Error */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reference-data/currencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    search?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["CurrencyReferenceHttpResponse"][];
                        "application/json": components["schemas"]["CurrencyReferenceHttpResponse"][];
                        "text/json": components["schemas"]["CurrencyReferenceHttpResponse"][];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reference-data/countries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    search?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["CountryReferenceHttpResponse"][];
                        "application/json": components["schemas"]["CountryReferenceHttpResponse"][];
                        "text/json": components["schemas"]["CountryReferenceHttpResponse"][];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reference-data/time-zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    search?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["TimeZoneReferenceHttpResponse"][];
                        "application/json": components["schemas"]["TimeZoneReferenceHttpResponse"][];
                        "text/json": components["schemas"]["TimeZoneReferenceHttpResponse"][];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reference-data/cultures": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    search?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["CultureReferenceHttpResponse"][];
                        "application/json": components["schemas"]["CultureReferenceHttpResponse"][];
                        "text/json": components["schemas"]["CultureReferenceHttpResponse"][];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reference-data/tax-id-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    search?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["TaxIdTypeReferenceHttpResponse"][];
                        "application/json": components["schemas"]["TaxIdTypeReferenceHttpResponse"][];
                        "text/json": components["schemas"]["TaxIdTypeReferenceHttpResponse"][];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        CountryReferenceHttpResponse: {
            code: string;
            alpha3: string;
            numericCode: string;
            callingCode: string;
            defaultCurrencyCode: string;
            defaultTimeZoneId: string;
            name: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder: null | number | string;
        };
        CultureReferenceHttpResponse: {
            code: string;
            languageCode: string;
            countryCode: string;
            datePattern: string;
            timePattern: string;
            dateTimePattern: string;
            longDatePattern: string;
            amDesignator: string;
            pmDesignator: string;
            decimalSeparator: string;
            groupSeparator: string;
            currencyPattern: string;
            percentPattern: string;
            fallbackCulture: string;
            isDefault: boolean;
            name: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder: null | number | string;
        };
        CurrencyReferenceHttpResponse: {
            code: string;
            numericCode: string;
            /** Format: int32 */
            minorUnits: null | number | string;
            symbol: string;
            displaySymbol: string;
            name: string;
            namePlural: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder: null | number | string;
        };
        ProblemDetails: {
            type?: string;
            title?: string;
            /** Format: int32 */
            status?: null | number | string;
            detail?: string;
            instance?: string;
        };
        ReferenceDataHttpResponse: {
            culture: string;
            currencies: components["schemas"]["CurrencyReferenceHttpResponse"][];
            countries: components["schemas"]["CountryReferenceHttpResponse"][];
            timeZones: components["schemas"]["TimeZoneReferenceHttpResponse"][];
            cultures: components["schemas"]["CultureReferenceHttpResponse"][];
            taxIdTypes: components["schemas"]["TaxIdTypeReferenceHttpResponse"][];
        };
        TaxIdTypeReferenceHttpResponse: {
            code: string;
            countryCode: string;
            label: string;
            mask: string;
            validatorKey: string;
            appliesTo: string;
            name: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder: null | number | string;
        };
        TimeZoneReferenceHttpResponse: {
            id: string;
            countryCodes: unknown[];
            city: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder: null | number | string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
