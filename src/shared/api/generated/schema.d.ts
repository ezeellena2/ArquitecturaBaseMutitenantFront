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
    "/api/auth/external/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    ReturnUrl?: string;
                    Access?: string;
                    Signup?: boolean;
                    AcceptedTerms?: boolean;
                    ReturnTo?: string;
                    Culture?: string;
                    TimeZoneId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Found */
                302: {
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
                /** @description Not Found */
                404: {
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
    "/api/auth/external/callback": {
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
                /** @description Found */
                302: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
    "/api/auth/login-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["RequestLoginCodeHttpRequest"];
                    "text/json": components["schemas"]["RequestLoginCodeHttpRequest"];
                    "application/*+json": components["schemas"]["RequestLoginCodeHttpRequest"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["RequestLoginCodeResponse"];
                        "application/json": components["schemas"]["RequestLoginCodeResponse"];
                        "text/json": components["schemas"]["RequestLoginCodeResponse"];
                    };
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
                /** @description Too Many Requests */
                429: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/login-code/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["VerifyLoginCodeHttpRequest"];
                    "text/json": components["schemas"]["VerifyLoginCodeHttpRequest"];
                    "application/*+json": components["schemas"]["VerifyLoginCodeHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VerifyLoginCodeResponse"];
                        "application/json": components["schemas"]["VerifyLoginCodeResponse"];
                        "text/json": components["schemas"]["VerifyLoginCodeResponse"];
                    };
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
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/methods": {
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
                        "text/plain": components["schemas"]["LoginMethodsResponse"];
                        "application/json": components["schemas"]["LoginMethodsResponse"];
                        "text/json": components["schemas"]["LoginMethodsResponse"];
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
    "/api/auth/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["SignupHttpRequest"];
                    "text/json": components["schemas"]["SignupHttpRequest"];
                    "application/*+json": components["schemas"]["SignupHttpRequest"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["RequestLoginCodeResponse"];
                        "application/json": components["schemas"]["RequestLoginCodeResponse"];
                        "text/json": components["schemas"]["RequestLoginCodeResponse"];
                    };
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
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/signup/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["VerifySignupHttpRequest"];
                    "text/json": components["schemas"]["VerifySignupHttpRequest"];
                    "application/*+json": components["schemas"]["VerifySignupHttpRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
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
                /** @description Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests */
                429: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/legal/terms": {
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
                        "text/plain": components["schemas"]["LegalDocumentRow"];
                        "application/json": components["schemas"]["LegalDocumentRow"];
                        "text/json": components["schemas"]["LegalDocumentRow"];
                    };
                };
                /** @description Not Found */
                404: {
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
    "/api/legal/privacy": {
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
                        "text/plain": components["schemas"]["LegalDocumentRow"];
                        "application/json": components["schemas"]["LegalDocumentRow"];
                        "text/json": components["schemas"]["LegalDocumentRow"];
                    };
                };
                /** @description Not Found */
                404: {
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
    "/api/me": {
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
                        "text/plain": components["schemas"]["MeResponse"];
                        "application/json": components["schemas"]["MeResponse"];
                        "text/json": components["schemas"]["MeResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateMeHttpRequest"];
                    "text/json": components["schemas"]["UpdateMeHttpRequest"];
                    "application/*+json": components["schemas"]["UpdateMeHttpRequest"];
                };
            };
            responses: {
                /** @description No Content */
                204: {
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden */
                403: {
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
        /** @enum {string} */
        Access: "consumer" | "business" | "platform";
        CountryReferenceHttpResponse: {
            code: string;
            alpha3: string;
            numericCode: string;
            callingCode?: null | string;
            defaultCurrencyCode?: null | string;
            defaultTimeZoneId?: null | string;
            name: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder?: null | number;
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
            fallbackCulture?: null | string;
            isDefault: boolean;
            name: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder?: null | number;
        };
        CurrencyReferenceHttpResponse: {
            code: string;
            numericCode: string;
            /** Format: int32 */
            minorUnits?: null | number;
            symbol: string;
            displaySymbol: string;
            name: string;
            namePlural: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder?: null | number;
        };
        /** @description Permisos efectivos del acceso activo; los permisos por empresa llegan en E4–E6. */
        EffectivePermissions: {
            organization: string[];
            companies: {
                [key: string]: string[];
            };
        };
        /** @description Correo normalizado para comparar y enviar; el dominio IDN se guarda en ASCII. */
        Email: null | string;
        /** @enum {string} */
        LegalDocumentKind: "Terms" | "Privacy";
        /** @description Versión y texto vigente de un documento legal en una cultura. */
        LegalDocumentRow: {
            /** Format: uuid */
            id: string;
            kind: components["schemas"]["LegalDocumentKind"];
            /** Format: int32 */
            version: number;
            /** Format: date-time */
            effectiveAtUtc: string;
            culture: string;
            text: string;
        };
        LoginChannelAvailability: {
            key: string;
            countries: string[];
        };
        /** @description Canales activos aportados por el núcleo y los módulos registrados. */
        LoginMethodsResponse: {
            channels: components["schemas"]["LoginChannelAvailability"][];
        };
        /** @enum {string} */
        MemberStatus: "Invited" | "Active" | "Inactive" | "Removed";
        /** @description Cuenta, accesos y preferencias efectivas de la sesión actual. */
        MeResponse: {
            /** Format: uuid */
            id: string;
            displayName?: null | string;
            email?: null | components["schemas"]["Email"];
            access: components["schemas"]["Access"];
            /** Format: uuid */
            activeTenantId?: null | string;
            hasPersonalSpace: boolean;
            organizations: components["schemas"]["OrganizationSummary"][];
            effectivePermissions: components["schemas"]["EffectivePermissions"];
            culture: string;
            timeZoneId: string;
            currencyCode?: null | string;
            features: string[];
            permissions?: null | string[];
        };
        /** @description Organización de la cuenta para el selector de perfiles. */
        OrganizationSummary: {
            /** Format: uuid */
            id: string;
            name: string;
            slug?: null | string;
            status: components["schemas"]["TenantStatus"];
            roleName?: null | string;
            memberStatus: components["schemas"]["MemberStatus"];
            isSelectable?: boolean;
        };
        PagedRequest: {
            /** Format: int32 */
            page?: number;
            /**
             * Format: int32
             * @enum {integer}
             */
            pageSize?: 10 | 20 | 50 | 100;
            sort?: null | string;
            search?: null | string;
        };
        ProblemDetails: {
            type?: null | string;
            title?: null | string;
            /** Format: int32 */
            status?: null | number;
            detail?: null | string;
            instance?: null | string;
            code: string;
            traceId: string;
            errors?: {
                [key: string]: string[];
            };
            /** Format: int32 */
            retryAfter?: null | number;
        };
        ReferenceDataHttpResponse: {
            culture: string;
            currencies: components["schemas"]["CurrencyReferenceHttpResponse"][];
            countries: components["schemas"]["CountryReferenceHttpResponse"][];
            timeZones: components["schemas"]["TimeZoneReferenceHttpResponse"][];
            cultures: components["schemas"]["CultureReferenceHttpResponse"][];
            taxIdTypes: components["schemas"]["TaxIdTypeReferenceHttpResponse"][];
        };
        /** @description Correo al que se solicita un código para una identidad existente. */
        RequestLoginCodeHttpRequest: {
            email?: null | string;
        };
        /** @description La misma forma exista o no la cuenta: no revela si el correo está registrado. */
        RequestLoginCodeResponse: {
            /** Format: int32 */
            resendAfterSeconds: number;
        };
        /** @description Solicitud de alta; cultura y zona proceden del navegador, sin campos visibles nuevos. */
        SignupHttpRequest: {
            email?: null | string;
            acceptedTerms: boolean;
            culture?: null | string;
            timeZoneId?: null | string;
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
            sortOrder?: null | number;
        };
        /** @enum {string} */
        TenantStatus: "PendingApproval" | "Provisioning" | "Active" | "Suspended" | "Closed";
        TimeZoneReferenceHttpResponse: {
            id: string;
            countryCodes: string[];
            city: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder?: null | number;
        };
        /** @description Preferencias de la cuenta autenticada, nunca de un id recibido del cliente. */
        UpdateMeHttpRequest: {
            displayName?: null | string;
            culture?: null | string;
            timeZoneId?: null | string;
        };
        /** @description Verifica el código y vuelve a la autorización local. */
        VerifyLoginCodeHttpRequest: {
            email?: null | string;
            code?: null | string;
            returnUrl?: null | string;
        };
        /** @description Authorize original que el SPA vuelve a abrir después de crear la sesión. */
        VerifyLoginCodeResponse: {
            returnUrl: string;
        };
        /** @description Verifica el código y registra la aceptación vigente en la misma transacción. */
        VerifySignupHttpRequest: {
            email?: null | string;
            code?: null | string;
            acceptedTerms: boolean;
            culture?: null | string;
            timeZoneId?: null | string;
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
