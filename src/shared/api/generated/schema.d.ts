export interface paths {
    "/webhooks/whatsapp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Ruta técnica global condicional. hub.mode=subscribe y VerifyToken correcto: challenge text/plain. Sin configuración/disponibilidad o módulo retirado: 404 común. T01 apagado siempre; T02 aporta disponibilidad y T05 verificación, sin sesión. */
        get: {
            parameters: {
                query?: {
                    "hub.mode"?: string;
                    "hub.verify_token"?: string;
                    "hub.challenge"?: string;
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
                        "text/plain": string;
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
                /** @description Unauthorized; WhatsApp.Webhook.InvalidSignature */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Http.NotFound */
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
                /** @description Not Implemented; General.Contract.NotImplemented */
                501: {
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
        /** @description Meta JSON; X-Hub-Signature-256=sha256=<HMAC> sobre bytes originales, antes de confiar en el JSON. Máximo 5242880 bytes, rate limit del webhook. Sin Idempotency-Key: deduplicar IDs Meta por tipo de evento, responder duplicados 200. 200 solo después de persistir lote; worker durable, sin sesión. T01 apagado siempre; stub 501 si se habilita en prueba. */
        post: {
            parameters: {
                query?: never;
                header?: {
                    "X-Hub-Signature-256"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["WhatsAppWebhookHttpRequest"];
                    "text/json": components["schemas"]["WhatsAppWebhookHttpRequest"];
                    "application/*+json": components["schemas"]["WhatsAppWebhookHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request; WhatsApp.Webhook.InvalidPayload */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized; WhatsApp.Webhook.InvalidSignature */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Http.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Payload Too Large; WhatsApp.Webhook.PayloadTooLarge */
                413: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; WhatsApp.Webhook.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
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
                /** @description Not Implemented; General.Contract.NotImplemented */
                501: {
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
    "/api/directory": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
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
                        "text/plain": components["schemas"]["PagedResultOfDirectoryEntryRow"];
                        "application/json": components["schemas"]["PagedResultOfDirectoryEntryRow"];
                        "text/json": components["schemas"]["PagedResultOfDirectoryEntryRow"];
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
    "/api/directory/{slug}/logo": {
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
                path: {
                    slug: string;
                };
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
                        "image/png": string;
                        "image/jpeg": string;
                        "image/webp": string;
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
    "/api/public-site": {
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
                        "text/plain": components["schemas"]["PublicSiteHttpResponse"];
                        "application/json": components["schemas"]["PublicSiteHttpResponse"];
                        "text/json": components["schemas"]["PublicSiteHttpResponse"];
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
    "/api/public-site/logo": {
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
                        "image/png": string;
                        "image/jpeg": string;
                        "image/webp": string;
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
    "/api/platform/accounts/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    State?: components["schemas"]["PlatformAccountState"];
                    Kind?: components["schemas"]["PlatformAccountKind"];
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
                        "text/plain": components["schemas"]["PagedResultOfPlatformAccountResponse"];
                        "application/json": components["schemas"]["PagedResultOfPlatformAccountResponse"];
                        "text/json": components["schemas"]["PagedResultOfPlatformAccountResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/accounts/filter-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    State?: components["schemas"]["PlatformAccountState"];
                    Kind?: components["schemas"]["PlatformAccountKind"];
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
                        "text/plain": components["schemas"]["PlatformAccountFilterCounts"];
                        "application/json": components["schemas"]["PlatformAccountFilterCounts"];
                        "text/json": components["schemas"]["PlatformAccountFilterCounts"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/accounts/{id}": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformAccountDetailResponse"];
                        "application/json": components["schemas"]["PlatformAccountDetailResponse"];
                        "text/json": components["schemas"]["PlatformAccountDetailResponse"];
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
    "/api/platform/accounts/{id}/suspend": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountReasonHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/accounts/{id}/reactivate": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountReasonHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/accounts/{id}/revoke-sessions": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountReasonHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/accounts/{id}/deletion": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountReasonHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountReasonHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    After?: string;
                    Limit?: number;
                    Period?: string;
                    Type?: string;
                    TenantId?: string;
                    AccountId?: string;
                    Search?: string;
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
                        "text/plain": components["schemas"]["CursorResultOfPlatformAuditEventResponse"];
                        "application/json": components["schemas"]["CursorResultOfPlatformAuditEventResponse"];
                        "text/json": components["schemas"]["CursorResultOfPlatformAuditEventResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/audit/organizations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    After?: string;
                    Limit?: number;
                    Period?: string;
                    Type?: string;
                    TenantId?: string;
                    AccountId?: string;
                    Search?: string;
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
                        "text/plain": components["schemas"]["PlatformAuditOrganizationResponse"][];
                        "application/json": components["schemas"]["PlatformAuditOrganizationResponse"][];
                        "text/json": components["schemas"]["PlatformAuditOrganizationResponse"][];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/audit/{id}": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformAuditEventResponse"];
                        "application/json": components["schemas"]["PlatformAuditEventResponse"];
                        "text/json": components["schemas"]["PlatformAuditEventResponse"];
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
    "/api/platform/tenants/{id}/domains": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["OrganizationDomainResponse"][];
                        "application/json": components["schemas"]["OrganizationDomainResponse"][];
                        "text/json": components["schemas"]["OrganizationDomainResponse"][];
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
    "/api/platform/tenants/{id}/domains/{domain}/verify": {
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
                path: {
                    id: string;
                    domain: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
                /** @description Service Unavailable */
                503: {
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
    "/api/platform/tenants/{id}/domains/{domain}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    domain: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/tenants/{id}/features": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformFeatureResponse"][];
                        "application/json": components["schemas"]["PlatformFeatureResponse"][];
                        "text/json": components["schemas"]["PlatformFeatureResponse"][];
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
    "/api/platform/tenants/{id}/features/{featureKey}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    featureKey: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdatePlatformFeatureHttpRequest"];
                    "text/json": components["schemas"]["UpdatePlatformFeatureHttpRequest"];
                    "application/*+json": components["schemas"]["UpdatePlatformFeatureHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/legal-documents": {
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
                        "text/plain": components["schemas"]["PlatformLegalDocumentGroupResponse"][];
                        "application/json": components["schemas"]["PlatformLegalDocumentGroupResponse"][];
                        "text/json": components["schemas"]["PlatformLegalDocumentGroupResponse"][];
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
                    "application/json": components["schemas"]["PublishLegalDocumentHttpRequest"];
                    "text/json": components["schemas"]["PublishLegalDocumentHttpRequest"];
                    "application/*+json": components["schemas"]["PublishLegalDocumentHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PublishedLegalDocumentResponse"];
                        "application/json": components["schemas"]["PublishedLegalDocumentResponse"];
                        "text/json": components["schemas"]["PublishedLegalDocumentResponse"];
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/legal-documents/{id}": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformLegalDocumentResponse"];
                        "application/json": components["schemas"]["PlatformLegalDocumentResponse"];
                        "text/json": components["schemas"]["PlatformLegalDocumentResponse"];
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
    "/api/platform/operators/invitations": {
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
                    "application/json": components["schemas"]["InvitePlatformOperatorHttpRequest"];
                    "text/json": components["schemas"]["InvitePlatformOperatorHttpRequest"];
                    "application/*+json": components["schemas"]["InvitePlatformOperatorHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PlatformOperatorInvitationResponse"];
                        "application/json": components["schemas"]["PlatformOperatorInvitationResponse"];
                        "text/json": components["schemas"]["PlatformOperatorInvitationResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/platform/operators/{id}/invitation/resend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** «Reenviar invitación»: renueva los 7 días de una invitación sin aceptar y manda el correo de nuevo. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformOperatorInvitationResponse"];
                        "application/json": components["schemas"]["PlatformOperatorInvitationResponse"];
                        "text/json": components["schemas"]["PlatformOperatorInvitationResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/operators/{id}/invitation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** «Revocar invitación»: borra una invitación sin aceptar y libera el correo. */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/accounts/{id}/operator": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ChangePlatformOperatorHttpRequest"];
                    "text/json": components["schemas"]["ChangePlatformOperatorHttpRequest"];
                    "application/*+json": components["schemas"]["ChangePlatformOperatorHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountActionHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountActionHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountActionHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/tenants/{id}/public-site": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformPublicSiteResponse"];
                        "application/json": components["schemas"]["PlatformPublicSiteResponse"];
                        "text/json": components["schemas"]["PlatformPublicSiteResponse"];
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
    "/api/platform/tenants/{id}/public-site/unpublish": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/{id}/public-site/allow-publish": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/recoveries/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Status?: components["schemas"]["AccountRecoveryStatus"];
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
                        "text/plain": components["schemas"]["PagedResultOfPlatformRecoveryResponse"];
                        "application/json": components["schemas"]["PagedResultOfPlatformRecoveryResponse"];
                        "text/json": components["schemas"]["PagedResultOfPlatformRecoveryResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/recoveries/filter-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Status?: components["schemas"]["AccountRecoveryStatus"];
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
                        "text/plain": components["schemas"]["PlatformRecoveryFilterCounts"];
                        "application/json": components["schemas"]["PlatformRecoveryFilterCounts"];
                        "text/json": components["schemas"]["PlatformRecoveryFilterCounts"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/recoveries/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Access platform y permiso platform.recoveries.manage vigente. Body reason/version existente, decisión humana con SecurityEvent; conserva VersionResponse y concurrencia. Phone es un tipo de método, nunca se convierte en Email. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountActionHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountActionHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountActionHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
                    };
                };
                /** @description Bad Request; Validation.Failed; Platform.AccountRecovery.PhoneMethodInUse; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized; Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Platform.AccountRecovery.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict; Platform.AccountRecovery.AlreadyResolved; Platform.AccountRecovery.NoAccount; Platform.AccountRecovery.MethodInUse; Platform.AccountRecovery.OperatorAccount; General.ConcurrencyConflict; Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
    "/api/platform/recoveries/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Access platform y permiso platform.recoveries.manage vigente. Body reason/version existente, decisión humana con SecurityEvent; conserva VersionResponse y concurrencia. Phone es un tipo de método, nunca se convierte en Email. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformAccountActionHttpRequest"];
                    "text/json": components["schemas"]["PlatformAccountActionHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformAccountActionHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
                    };
                };
                /** @description Bad Request; Validation.Failed; Platform.AccountRecovery.PhoneMethodInUse; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized; Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Platform.AccountRecovery.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict; Platform.AccountRecovery.AlreadyResolved; Platform.AccountRecovery.NoAccount; Platform.AccountRecovery.MethodInUse; Platform.AccountRecovery.OperatorAccount; General.ConcurrencyConflict; Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
    "/api/platform/settings": {
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
                        "text/plain": components["schemas"]["PlatformSettingsResponse"];
                        "application/json": components["schemas"]["PlatformSettingsResponse"];
                        "text/json": components["schemas"]["PlatformSettingsResponse"];
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdatePlatformSettingsHttpRequest"];
                    "text/json": components["schemas"]["UpdatePlatformSettingsHttpRequest"];
                    "application/*+json": components["schemas"]["UpdatePlatformSettingsHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants": {
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
                    "application/json": components["schemas"]["CreatePlatformTenantHttpRequest"];
                    "text/json": components["schemas"]["CreatePlatformTenantHttpRequest"];
                    "application/*+json": components["schemas"]["CreatePlatformTenantHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["CreatedPlatformTenantResponse"];
                        "application/json": components["schemas"]["CreatedPlatformTenantResponse"];
                        "text/json": components["schemas"]["CreatedPlatformTenantResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/{id}/approve": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/{id}/retry-provisioning": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantRetryHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantRetryHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantRetryHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Status?: components["schemas"]["TenantStatus"];
                    Source?: components["schemas"]["TenantRegistrationSource"];
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
                        "text/plain": components["schemas"]["PagedResultOfPlatformTenantResponse"];
                        "application/json": components["schemas"]["PagedResultOfPlatformTenantResponse"];
                        "text/json": components["schemas"]["PagedResultOfPlatformTenantResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/tenants/filter-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Status?: components["schemas"]["TenantStatus"];
                    Source?: components["schemas"]["TenantRegistrationSource"];
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
                        "text/plain": components["schemas"]["PlatformTenantFilterCounts"];
                        "application/json": components["schemas"]["PlatformTenantFilterCounts"];
                        "text/json": components["schemas"]["PlatformTenantFilterCounts"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/platform/tenants/{id}": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["PlatformTenantDetailResponse"];
                        "application/json": components["schemas"]["PlatformTenantDetailResponse"];
                        "text/json": components["schemas"]["PlatformTenantDetailResponse"];
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
    "/api/platform/tenants/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    After?: string;
                    Limit?: number;
                };
                header?: never;
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["CursorResultOfPlatformTenantHistoryResponse"];
                        "application/json": components["schemas"]["CursorResultOfPlatformTenantHistoryResponse"];
                        "text/json": components["schemas"]["CursorResultOfPlatformTenantHistoryResponse"];
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
    "/api/platform/tenants/{id}/reject": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/{id}/suspend": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/{id}/reactivate": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/platform/tenants/{id}/close": {
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
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "text/json": components["schemas"]["PlatformTenantStateHttpRequest"];
                    "application/*+json": components["schemas"]["PlatformTenantStateHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Status?: components["schemas"]["CompanyStatus"];
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
                        "text/plain": components["schemas"]["PagedResultOfCompanyResponse"];
                        "application/json": components["schemas"]["PagedResultOfCompanyResponse"];
                        "text/json": components["schemas"]["PagedResultOfCompanyResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/companies/filter-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Status?: components["schemas"]["CompanyStatus"];
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
                        "text/plain": components["schemas"]["CompanyFilterCountsResponse"];
                        "application/json": components["schemas"]["CompanyFilterCountsResponse"];
                        "text/json": components["schemas"]["CompanyFilterCountsResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/companies/{companyId}": {
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
                path: {
                    companyId: string;
                };
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
                        "text/plain": components["schemas"]["CompanyResponse"];
                        "application/json": components["schemas"]["CompanyResponse"];
                        "text/json": components["schemas"]["CompanyResponse"];
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    companyId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateCompanyHttpRequest"];
                    "text/json": components["schemas"]["UpdateCompanyHttpRequest"];
                    "application/*+json": components["schemas"]["UpdateCompanyHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies": {
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
                    "application/json": components["schemas"]["CreateCompanyHttpRequest"];
                    "text/json": components["schemas"]["CreateCompanyHttpRequest"];
                    "application/*+json": components["schemas"]["CreateCompanyHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": string;
                        "application/json": string;
                        "text/json": string;
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
                /** @description Conflict */
                409: {
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
    "/api/companies/{companyId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    companyId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ChangeCompanyStatusHttpRequest"];
                    "text/json": components["schemas"]["ChangeCompanyStatusHttpRequest"];
                    "application/*+json": components["schemas"]["ChangeCompanyStatusHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies/{companyId}/candidates/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                };
                header?: never;
                path: {
                    companyId: string;
                };
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
                        "text/plain": components["schemas"]["PagedResultOfCompanyCandidateResponse"];
                        "application/json": components["schemas"]["PagedResultOfCompanyCandidateResponse"];
                        "text/json": components["schemas"]["PagedResultOfCompanyCandidateResponse"];
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
    "/api/companies/{companyId}/invitations/{invitationId}/resend": {
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
                path: {
                    companyId: string;
                    invitationId: string;
                };
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
                        "text/plain": string;
                        "application/json": string;
                        "text/json": string;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies/{companyId}/invitations/{invitationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    companyId: string;
                    invitationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/companies/{companyId}/members/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    State?: components["schemas"]["CompanyMemberState"];
                    RoleId?: string;
                    WithoutRoles?: boolean;
                };
                header?: never;
                path: {
                    companyId: string;
                };
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
                        "text/plain": components["schemas"]["PagedResultOfCompanyMemberHttpResponse"];
                        "application/json": components["schemas"]["PagedResultOfCompanyMemberHttpResponse"];
                        "text/json": components["schemas"]["PagedResultOfCompanyMemberHttpResponse"];
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
    "/api/companies/{companyId}/members/filter-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    State?: components["schemas"]["CompanyMemberState"];
                    RoleId?: string;
                    WithoutRoles?: boolean;
                };
                header?: never;
                path: {
                    companyId: string;
                };
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
                        "text/plain": components["schemas"]["CompanyMemberFilterCountsResponse"];
                        "application/json": components["schemas"]["CompanyMemberFilterCountsResponse"];
                        "text/json": components["schemas"]["CompanyMemberFilterCountsResponse"];
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
    "/api/companies/{companyId}/members": {
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
                path: {
                    companyId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["AddCompanyMemberHttpRequest"];
                    "text/json": components["schemas"]["AddCompanyMemberHttpRequest"];
                    "application/*+json": components["schemas"]["AddCompanyMemberHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies/{companyId}/members/{memberId}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    companyId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateCompanyMemberRolesHttpRequest"];
                    "text/json": components["schemas"]["UpdateCompanyMemberRolesHttpRequest"];
                    "application/*+json": components["schemas"]["UpdateCompanyMemberRolesHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies/{companyId}/members/{memberId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    companyId: string;
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ChangeCompanyMemberStatusHttpRequest"];
                    "text/json": components["schemas"]["ChangeCompanyMemberStatusHttpRequest"];
                    "application/*+json": components["schemas"]["ChangeCompanyMemberStatusHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/companies/{companyId}/roles/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                };
                header?: never;
                path: {
                    companyId: string;
                };
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
                        "text/plain": components["schemas"]["PagedResultOfRoleResponse"];
                        "application/json": components["schemas"]["PagedResultOfRoleResponse"];
                        "text/json": components["schemas"]["PagedResultOfRoleResponse"];
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
    "/api/home": {
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
                        "text/plain": components["schemas"]["HomeResponse"];
                        "application/json": components["schemas"]["HomeResponse"];
                        "text/json": components["schemas"]["HomeResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organization/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    After?: string;
                    Limit?: number;
                    Period?: string;
                    Category?: string;
                    ActorId?: string;
                    ActorKind?: string;
                    Search?: string;
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
                        "text/plain": components["schemas"]["CursorResultOfOrganizationAuditEntryResponse"];
                        "application/json": components["schemas"]["CursorResultOfOrganizationAuditEntryResponse"];
                        "text/json": components["schemas"]["CursorResultOfOrganizationAuditEntryResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organization/audit/actors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    After?: string;
                    Limit?: number;
                    Period?: string;
                    Category?: string;
                    ActorId?: string;
                    ActorKind?: string;
                    Search?: string;
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
                        "text/plain": components["schemas"]["OrganizationAuditActorResponse"][];
                        "application/json": components["schemas"]["OrganizationAuditActorResponse"][];
                        "text/json": components["schemas"]["OrganizationAuditActorResponse"][];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organization/settings/domains": {
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
                        "text/plain": components["schemas"]["OrganizationDomainResponse"][];
                        "application/json": components["schemas"]["OrganizationDomainResponse"][];
                        "text/json": components["schemas"]["OrganizationDomainResponse"][];
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
                    "application/json": components["schemas"]["RegisterOrganizationDomainHttpRequest"];
                    "text/json": components["schemas"]["RegisterOrganizationDomainHttpRequest"];
                    "application/*+json": components["schemas"]["RegisterOrganizationDomainHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["OrganizationDomainResponse"];
                        "application/json": components["schemas"]["OrganizationDomainResponse"];
                        "text/json": components["schemas"]["OrganizationDomainResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/organization/settings/domains/{domainId}/verify": {
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
                path: {
                    domainId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
                /** @description Service Unavailable */
                503: {
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
    "/api/organization/settings/domains/{domainId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    domainId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organization/settings": {
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
                        "text/plain": components["schemas"]["OrganizationSettingsResponse"];
                        "application/json": components["schemas"]["OrganizationSettingsResponse"];
                        "text/json": components["schemas"]["OrganizationSettingsResponse"];
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateOrganizationSettingsHttpRequest"];
                    "text/json": components["schemas"]["UpdateOrganizationSettingsHttpRequest"];
                    "application/*+json": components["schemas"]["UpdateOrganizationSettingsHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/users/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    State?: components["schemas"]["OrganizationUserState"];
                    CompanyId?: string;
                    WithoutCompany?: boolean;
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
                        "text/plain": components["schemas"]["PagedResultOfOrganizationUserHttpResponse"];
                        "application/json": components["schemas"]["PagedResultOfOrganizationUserHttpResponse"];
                        "text/json": components["schemas"]["PagedResultOfOrganizationUserHttpResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/filter-counts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    State?: components["schemas"]["OrganizationUserState"];
                    CompanyId?: string;
                    WithoutCompany?: boolean;
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
                        "text/plain": components["schemas"]["OrganizationUserFilterCountsResponse"];
                        "application/json": components["schemas"]["OrganizationUserFilterCountsResponse"];
                        "text/json": components["schemas"]["OrganizationUserFilterCountsResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/{memberId}": {
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
                path: {
                    memberId: string;
                };
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
                        "text/plain": components["schemas"]["OrganizationUserHttpResponse"];
                        "application/json": components["schemas"]["OrganizationUserHttpResponse"];
                        "text/json": components["schemas"]["OrganizationUserHttpResponse"];
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateOrganizationUserHttpRequest"];
                    "text/json": components["schemas"]["UpdateOrganizationUserHttpRequest"];
                    "application/*+json": components["schemas"]["UpdateOrganizationUserHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete: {
            parameters: {
                query?: {
                    version?: number;
                };
                header?: never;
                path: {
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/invitations": {
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
                    "application/json": components["schemas"]["InviteOrganizationUserHttpRequest"];
                    "text/json": components["schemas"]["InviteOrganizationUserHttpRequest"];
                    "application/*+json": components["schemas"]["InviteOrganizationUserHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["OrganizationInvitationIssuedResponse"];
                        "application/json": components["schemas"]["OrganizationInvitationIssuedResponse"];
                        "text/json": components["schemas"]["OrganizationInvitationIssuedResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/users/invitations/{invitationId}/resend": {
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
                path: {
                    invitationId: string;
                };
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
                        "text/plain": string;
                        "application/json": string;
                        "text/json": string;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/users/invitations/{invitationId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    invitationId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/{memberId}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    memberId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["ChangeOrganizationUserStatusHttpRequest"];
                    "text/json": components["schemas"]["ChangeOrganizationUserStatusHttpRequest"];
                    "application/*+json": components["schemas"]["ChangeOrganizationUserStatusHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/permissions": {
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
                        "text/plain": components["schemas"]["PermissionGroupResponse"][];
                        "application/json": components["schemas"]["PermissionGroupResponse"][];
                        "text/json": components["schemas"]["PermissionGroupResponse"][];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organization/public-page": {
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
                        "text/plain": components["schemas"]["PublicPageHttpResponse"];
                        "application/json": components["schemas"]["PublicPageHttpResponse"];
                        "text/json": components["schemas"]["PublicPageHttpResponse"];
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdatePublicPageHttpRequest"];
                    "text/json": components["schemas"]["UpdatePublicPageHttpRequest"];
                    "application/*+json": components["schemas"]["UpdatePublicPageHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/organization/public-page/publish": {
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
                    "application/json": components["schemas"]["SetPublicPagePublicationHttpRequest"];
                    "text/json": components["schemas"]["SetPublicPagePublicationHttpRequest"];
                    "application/*+json": components["schemas"]["SetPublicPagePublicationHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/organization/public-page/unpublish": {
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
                    "application/json": components["schemas"]["SetPublicPagePublicationHttpRequest"];
                    "text/json": components["schemas"]["SetPublicPagePublicationHttpRequest"];
                    "application/*+json": components["schemas"]["SetPublicPagePublicationHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
    "/api/roles/paged": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    Page?: number;
                    PageSize?: 10 | 20 | 50 | 100;
                    Sort?: string;
                    Search?: string;
                    Scope?: components["schemas"]["RoleScopeFilter"];
                    CompanyId?: string;
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
                        "text/plain": components["schemas"]["PagedResultOfRoleResponse"];
                        "application/json": components["schemas"]["PagedResultOfRoleResponse"];
                        "text/json": components["schemas"]["PagedResultOfRoleResponse"];
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
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/roles/{id}": {
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
                path: {
                    id: string;
                };
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
                        "text/plain": components["schemas"]["RoleResponse"];
                        "application/json": components["schemas"]["RoleResponse"];
                        "text/json": components["schemas"]["RoleResponse"];
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateRoleHttpRequest"];
                    "text/json": components["schemas"]["UpdateRoleHttpRequest"];
                    "application/*+json": components["schemas"]["UpdateRoleHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["DeleteRoleHttpRequest"];
                    "text/json": components["schemas"]["DeleteRoleHttpRequest"];
                    "application/*+json": components["schemas"]["DeleteRoleHttpRequest"];
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/roles": {
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
                    "application/json": components["schemas"]["CreateRoleHttpRequest"];
                    "text/json": components["schemas"]["CreateRoleHttpRequest"];
                    "application/*+json": components["schemas"]["CreateRoleHttpRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": string;
                        "application/json": string;
                        "text/json": string;
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
                /** @description Conflict */
                409: {
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
    "/api/auth/deletion/cancel": {
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
                    "application/json": components["schemas"]["CancelAccountDeletionHttpRequest"];
                    "text/json": components["schemas"]["CancelAccountDeletionHttpRequest"];
                    "application/*+json": components["schemas"]["CancelAccountDeletionHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["CancelAccountDeletionHttpResponse"];
                        "application/json": components["schemas"]["CancelAccountDeletionHttpResponse"];
                        "text/json": components["schemas"]["CancelAccountDeletionHttpResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/auth/deletion/pending": {
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
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["PendingDeletionState"];
                        "application/json": components["schemas"]["PendingDeletionState"];
                        "text/json": components["schemas"]["PendingDeletionState"];
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/account-recovery/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente previousEmail o previousPhone; método perdido no exige posesión. 204 cuando existe cuenta recuperable; sin datos de cuenta ni sesión. T01: previousPhone devuelve 501 temporal. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PreviewAccountRecoveryHttpRequest"];
                    "text/json": components["schemas"]["PreviewAccountRecoveryHttpRequest"];
                    "application/*+json": components["schemas"]["PreviewAccountRecoveryHttpRequest"];
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
                /** @description Bad Request; Validation.Failed; Platform.AccountRecovery.AccountNotFound; Platform.AccountRecovery.PhoneAccountNotFound */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/account-recovery/code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs. Nonce opaco base64url de 43 caracteres, ligado a este pedido. Sin sesión. Nuevo destino no se agrega a la cuenta. Submit: 202 sin body, prueba previa vigente y previousEmail o previousPhone; resolución asistida de Plataforma conserva reason/version/permiso/SecurityEvent. WhatsApp: cuota diaria persistente de códigos por UTC, una reserva por operación; replay no vuelve a gastar cuota. Error de entrega posterior a 202 se maneja en outbox. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["RequestRecoveryCodeHttpRequest"];
                    "text/json": components["schemas"]["RequestRecoveryCodeHttpRequest"];
                    "application/*+json": components["schemas"]["RequestRecoveryCodeHttpRequest"];
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
                /** @description Bad Request; Platform.AccountRecovery.PhoneMethodInUse; Platform.AccountRecovery.MethodInUse; Platform.AccountRecovery.VerificationRequired; Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests; WhatsApp.LoginCode.DailyLimit */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/account-recovery/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs. Nonce opaco base64url de 43 caracteres, ligado a este pedido. Sin sesión. Nuevo destino no se agrega a la cuenta. Submit: 202 sin body, prueba previa vigente y previousEmail o previousPhone; resolución asistida de Plataforma conserva reason/version/permiso/SecurityEvent. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["VerifyRecoveryCodeHttpRequest"];
                    "text/json": components["schemas"]["VerifyRecoveryCodeHttpRequest"];
                    "application/*+json": components["schemas"]["VerifyRecoveryCodeHttpRequest"];
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
                /** @description Bad Request; Platform.AccountRecovery.PhoneMethodInUse; Platform.AccountRecovery.MethodInUse; Platform.AccountRecovery.VerificationRequired; Validation.Failed; Auth.LoginCode.Invalid; Auth.LoginCode.Expired; Auth.LoginCode.AlreadyUsed; Auth.LoginCode.TooManyAttempts; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Auth.Account.Disabled; Auth.Account.LockedOut; Tenancy.Access.PlatformOnly */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/account-recovery": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs. Nonce opaco base64url de 43 caracteres, ligado a este pedido. Sin sesión. Nuevo destino no se agrega a la cuenta. Submit: 202 sin body, prueba previa vigente y previousEmail o previousPhone; resolución asistida de Plataforma conserva reason/version/permiso/SecurityEvent. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["SubmitAccountRecoveryHttpRequest"];
                    "text/json": components["schemas"]["SubmitAccountRecoveryHttpRequest"];
                    "application/*+json": components["schemas"]["SubmitAccountRecoveryHttpRequest"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request; Platform.AccountRecovery.PhoneMethodInUse; Platform.AccountRecovery.MethodInUse; Platform.AccountRecovery.VerificationRequired; Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/auth/business-signup/code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.BusinessSignup abierto, independiente de ConsumerSignup; identidad nueva o existente. No crea organización ni PhoneTaken personal. WhatsApp: cuota diaria persistente de códigos por UTC, una reserva por operación; replay no vuelve a gastar cuota. Error de entrega posterior a 202 se maneja en outbox. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
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
                /** @description Bad Request; Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Auth.BusinessSignup.Closed */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests; WhatsApp.LoginCode.DailyLimit */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/auth/business-signup/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs.BusinessSignup abierto, independiente de ConsumerSignup; identidad nueva o existente. No crea organización ni PhoneTaken personal. Cuenta, método, Personal cuando corresponde y legales explícitos atómicos. Operador probado: PlatformOnly y sin cookie pública. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
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
                        /** @description Cookie HttpOnly tras prueba válida; nunca se emite desde webhook ni desde preview. Stubs T01 no la emiten. */
                        "Set-Cookie"?: string;
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Bad Request; Validation.Failed; Auth.LoginCode.Invalid; Auth.LoginCode.Expired; Auth.LoginCode.AlreadyUsed; Auth.LoginCode.TooManyAttempts; Auth.LoginMethod.ChannelUnavailable; Users.Phone.Invalid; Users.Phone.NotMobile; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Auth.Account.Disabled; Auth.Account.LockedOut; Tenancy.Access.PlatformOnly; Auth.BusinessSignup.Closed */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/auth/business-signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Contrato vigente de Tu organización. Requiere cookie pública probada y antiforgery; no recibe phone ni selecciona consumer. Valida BusinessSignup y límite/estado de organización; 200 BusinessSignupResponse existente. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["BusinessSignupHttpRequest"];
                    "application/*+json": components["schemas"]["BusinessSignupHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BusinessSignupResponse"];
                        "application/json": components["schemas"]["BusinessSignupResponse"];
                        "text/json": components["schemas"]["BusinessSignupResponse"];
                    };
                };
                /** @description Bad Request; Validation.Failed; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized; Auth.BusinessSignup.IdentityRequired */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Auth.BusinessSignup.Closed; Tenancy.Access.PlatformOnly */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict; Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unprocessable Entity */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
    "/api/contact": {
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
                        "text/plain": components["schemas"]["PlatformContactResponse"];
                        "application/json": components["schemas"]["PlatformContactResponse"];
                        "text/json": components["schemas"]["PlatformContactResponse"];
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
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/x-www-form-urlencoded": {
                        ReturnUrl?: string;
                        Access?: string;
                        Signup?: boolean;
                        AcceptedTerms?: boolean;
                        ReturnTo?: string;
                        Culture?: string;
                        TimeZoneId?: string;
                    };
                };
            };
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/external/google/antiforgery": {
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
                        "text/plain": components["schemas"]["GoogleSignupAntiforgeryHttpResponse"];
                        "application/json": components["schemas"]["GoogleSignupAntiforgeryHttpResponse"];
                        "text/json": components["schemas"]["GoogleSignupAntiforgeryHttpResponse"];
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
    "/api/invitations/preview": {
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
                    "application/json": components["schemas"]["PreviewInvitationHttpRequest"];
                    "application/*+json": components["schemas"]["PreviewInvitationHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["InvitationPreviewResponse"];
                        "application/json": components["schemas"]["InvitationPreviewResponse"];
                        "text/json": components["schemas"]["InvitationPreviewResponse"];
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
    "/api/invitations/accept": {
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
                    "application/json": components["schemas"]["AcceptInvitationHttpRequest"];
                    "application/*+json": components["schemas"]["AcceptInvitationHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["AcceptInvitationResponse"];
                        "application/json": components["schemas"]["AcceptInvitationResponse"];
                        "text/json": components["schemas"]["AcceptInvitationResponse"];
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
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unprocessable Entity */
                422: {
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
    "/api/auth/login-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. Solo método verificado utilizable; conserva invitación por correo de ADR0047. WhatsApp: cuota diaria persistente de códigos por UTC, una reserva por operación; replay no vuelve a gastar cuota. Error de entrega posterior a 202 se maneja en outbox. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
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
                /** @description Bad Request; Auth.LoginCode.AccountNotFound; Auth.LoginCode.PhoneAccountNotFound; Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests; WhatsApp.LoginCode.DailyLimit */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs. returnUrl local/OIDC validado conserva access, PKCE y callback. Respuesta returnUrl, sin tokens OIDC en body. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
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
                        /** @description Cookie HttpOnly tras prueba válida; nunca se emite desde webhook ni desde preview. Stubs T01 no la emiten. */
                        "Set-Cookie"?: string;
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VerifyLoginCodeResponse"];
                        "application/json": components["schemas"]["VerifyLoginCodeResponse"];
                        "text/json": components["schemas"]["VerifyLoginCodeResponse"];
                    };
                };
                /** @description Bad Request; Validation.Failed; Auth.LoginCode.Invalid; Auth.LoginCode.Expired; Auth.LoginCode.AlreadyUsed; Auth.LoginCode.TooManyAttempts; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Auth.Account.Disabled; Auth.Account.LockedOut; Tenancy.Access.PlatformOnly */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/auth/login-link/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Enlace opaco 256 bits (43 base64url), hash, 10 minutos, un uso y ligado a MethodId Phone verificado. Uno nuevo invalida los previos de ese método. Revalidar dueño, método, canal, estado y operador bajo lock; operador actual devuelve Invalid incluso en replay, sin cookie, datos o motivo revelador. Token via /login/enlace#t=… y solo memoria; jamás query/storage/log. Preview no consume ni crea cookie. displayName y maskedPhone nullable. T01 devuelve 501. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["PreviewLoginLinkHttpRequest"];
                    "text/json": components["schemas"]["PreviewLoginLinkHttpRequest"];
                    "application/*+json": components["schemas"]["PreviewLoginLinkHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["LoginLinkPreviewResponse"];
                        "application/json": components["schemas"]["LoginLinkPreviewResponse"];
                        "text/json": components["schemas"]["LoginLinkPreviewResponse"];
                    };
                };
                /** @description Bad Request; Validation.Failed; Auth.LoginLink.Invalid; Auth.LoginLink.Expired; Auth.LoginLink.AlreadyUsed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginLink.TooManyRequests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Implemented; General.Contract.NotImplemented */
                501: {
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
    "/api/auth/login-link/redeem": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Enlace opaco 256 bits (43 base64url), hash, 10 minutos, un uso y ligado a MethodId Phone verificado. Uno nuevo invalida los previos de ese método. Revalidar dueño, método, canal, estado y operador bajo lock; operador actual devuelve Invalid incluso en replay, sin cookie, datos o motivo revelador. Token via /login/enlace#t=… y solo memoria; jamás query/storage/log. Solo access=consumer. 200 {access:consumer} y cookie pública, sin tokens OIDC. Replay misma key no crea otra sesión; otra key ya usado. Front ejecuta después signinRedirect con su state y PKCE. T01 devuelve 501, sin cookie. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["RedeemLoginLinkHttpRequest"];
                    "text/json": components["schemas"]["RedeemLoginLinkHttpRequest"];
                    "application/*+json": components["schemas"]["RedeemLoginLinkHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        /** @description Cookie HttpOnly tras prueba válida; nunca se emite desde webhook ni desde preview. Stubs T01 no la emiten. */
                        "Set-Cookie"?: string;
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["LoginLinkRedeemResponse"];
                        "application/json": components["schemas"]["LoginLinkRedeemResponse"];
                        "text/json": components["schemas"]["LoginLinkRedeemResponse"];
                    };
                };
                /** @description Bad Request; Validation.Failed; Auth.LoginLink.Invalid; Auth.LoginLink.Expired; Auth.LoginLink.AlreadyUsed; Request.IdempotencyKeyRequired */
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
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginLink.TooManyRequests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Implemented; General.Contract.NotImplemented */
                501: {
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
        /** @description Canales registrados disponibles, capacidades globales independientes de features por organización. ContactPhone opcional es número público E.164, nunca ID técnico. */
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
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.ConsumerSignup abierto; acepta términos explícitos. Crea Persona, nunca empresa. WhatsApp: cuota diaria persistente de códigos por UTC, una reserva por operación; replay no vuelve a gastar cuota. Error de entrega posterior a 202 se maneja en outbox. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
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
                /** @description Bad Request; Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Auth.Signup.EmailTaken; Auth.Signup.PhoneTaken; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Auth.Signup.Closed */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests; WhatsApp.LoginCode.DailyLimit */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04.Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs.ConsumerSignup abierto; acepta términos explícitos. Crea Persona, nunca empresa. Cuenta, método, Personal cuando corresponde y legales explícitos atómicos. Operador probado: PlatformOnly y sin cookie pública. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
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
                /** @description Bad Request; Validation.Failed; Auth.LoginCode.Invalid; Auth.LoginCode.Expired; Auth.LoginCode.AlreadyUsed; Auth.LoginCode.TooManyAttempts; Auth.LoginMethod.ChannelUnavailable; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.Signup.EmailTaken; Auth.Signup.PhoneTaken; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Auth.Account.Disabled; Auth.Account.LockedOut; Tenancy.Access.PlatformOnly; Auth.Signup.Closed */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Too Many Requests; Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/public-site/slug-availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    slug?: string;
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
                        "text/plain": components["schemas"]["TenantSlugAvailabilityResponse"];
                        "application/json": components["schemas"]["TenantSlugAvailabilityResponse"];
                        "text/json": components["schemas"]["TenantSlugAvailabilityResponse"];
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
    "/api/me/deletion": {
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
                    "application/json": components["schemas"]["RequestAccountDeletionHttpRequest"];
                    "text/json": components["schemas"]["RequestAccountDeletionHttpRequest"];
                    "application/*+json": components["schemas"]["RequestAccountDeletionHttpRequest"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["AccountDeletionResponse"];
                        "application/json": components["schemas"]["AccountDeletionResponse"];
                        "text/json": components["schemas"]["AccountDeletionResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/me/external/google": {
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
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["GoogleChallengeResponse"];
                        "application/json": components["schemas"]["GoogleChallengeResponse"];
                        "text/json": components["schemas"]["GoogleChallengeResponse"];
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/login-methods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Identidad propia consumer/business/platform. DTO vigente, Phone solo utilizable con canal disponible. Sin permiso de organización, sin ReauthTicket. */
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
                        "text/plain": components["schemas"]["AccountLoginMethodsResponse"];
                        "application/json": components["schemas"]["AccountLoginMethodsResponse"];
                        "text/json": components["schemas"]["AccountLoginMethodsResponse"];
                    };
                };
                /** @description Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. Pendiente propio y OTP al destino nuevo; otro dueño falla antes de pendiente, aviso o OTP. WhatsApp: cuota diaria persistente de códigos por UTC, una reserva por operación; replay no vuelve a gastar cuota. Error de entrega posterior a 202 se maneja en outbox. País habilitado se valida solo para destino nuevo; cambiar AllowedCountries no invalida un Phone ya verificado. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["AddLoginMethodHttpRequest"];
                    "text/json": components["schemas"]["AddLoginMethodHttpRequest"];
                    "application/*+json": components["schemas"]["AddLoginMethodHttpRequest"];
                };
            };
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["LoginMethodCodeResponse"];
                        "application/json": components["schemas"]["LoginMethodCodeResponse"];
                        "text/json": components["schemas"]["LoginMethodCodeResponse"];
                    };
                };
                /** @description Bad Request; Identity.LoginMethod.AlreadyUsed; Identity.LoginMethod.PhoneAlreadyUsed; Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired; WhatsApp.Phone.CountryNotAllowed */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests; WhatsApp.LoginCode.DailyLimit */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/me/login-methods/{methodId}/code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Reenvío para pendiente propio; recarga propiedad y disponibilidad, sin body. No prueba posesión del método principal. WhatsApp: cuota diaria persistente de códigos por UTC, una reserva por operación; replay no vuelve a gastar cuota. Error de entrega posterior a 202 se maneja en outbox. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path: {
                    methodId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["LoginMethodCodeResponse"];
                        "application/json": components["schemas"]["LoginMethodCodeResponse"];
                        "text/json": components["schemas"]["LoginMethodCodeResponse"];
                    };
                };
                /** @description Validation.Failed; Users.Phone.Invalid; Users.Phone.NotMobile; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Identity.LoginMethod.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Identity.LoginMethod.AlreadyVerified; Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Auth.LoginCode.ResendTooSoon; Auth.LoginCode.TooManyRequests; Http.TooManyRequests; WhatsApp.LoginCode.DailyLimit */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/me/login-methods/{methodId}/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Código como string de dígitos ASCII, longitud Authentication:LoginCode (6 por defecto). Intentos y topes actuales; retryAfter son segundos y coincide con Retry-After. No guardar códigos ni enlaces en logs. Solo OTP del pendiente propio; vínculo, principal si corresponde y avisos en una UoW. */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description UUID por operación. Reusar la misma key y cuerpo para reintentar; otra key representa otra operación. */
                    "Idempotency-Key": string;
                };
                path: {
                    methodId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["VerifyLoginMethodHttpRequest"];
                    "text/json": components["schemas"]["VerifyLoginMethodHttpRequest"];
                    "application/*+json": components["schemas"]["VerifyLoginMethodHttpRequest"];
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
                /** @description Bad Request; Identity.LoginMethod.PhoneAlreadyUsed; Validation.Failed; Auth.LoginCode.Invalid; Auth.LoginCode.Expired; Auth.LoginCode.AlreadyUsed; Auth.LoginCode.TooManyAttempts; Auth.LoginMethod.ChannelUnavailable; Request.IdempotencyKeyRequired */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Auth.Account.Disabled; Auth.Account.LockedOut; Tenancy.Access.PlatformOnly; Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Identity.LoginMethod.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Request.IdempotencyKeyReused; Request.InProgress */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description General.Contract.NotImplemented */
                501: {
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
    "/api/me/login-methods/{methodId}/primary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** @description Sin body ni código de confirmación (ADR0045). Relee propiedad y métodos utilizables bajo lock, conserva principal/personal y avisos. No usa version de Tus datos. */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    methodId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Identity.LoginMethod.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict; Identity.LoginMethod.LastMethod; Identity.LoginMethod.LastPersonalMethod; Auth.LoginMethod.NotVerified; General.ConcurrencyConflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
    "/api/me/login-methods/{methodId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Sin body ni código de confirmación (ADR0045). Relee propiedad y métodos utilizables bajo lock, conserva principal/personal y avisos. No usa version de Tus datos. */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    methodId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description No Content */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Http.Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Forbidden; Http.Forbidden */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found; Identity.LoginMethod.NotFound */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict; Identity.LoginMethod.LastMethod; Identity.LoginMethod.LastPersonalMethod; Auth.LoginMethod.NotVerified; General.ConcurrencyConflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Http.TooManyRequests */
                429: {
                    headers: {
                        /** @description Segundos iguales a retryAfter. */
                        "Retry-After"?: number;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/problem+json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Internal Server Error; General.Unexpected */
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
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/legal/accept": {
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
                    "application/json": components["schemas"]["AcceptLegalHttpRequest"];
                    "text/json": components["schemas"]["AcceptLegalHttpRequest"];
                    "application/*+json": components["schemas"]["AcceptLegalHttpRequest"];
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
                /** @description Conflict */
                409: {
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
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["VersionResponse"];
                        "application/json": components["schemas"]["VersionResponse"];
                        "text/json": components["schemas"]["VersionResponse"];
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
                /** @description Conflict */
                409: {
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
        /** @description Acepta desde el cuerpo el token opaco y la aceptación legal requerida para una identidad nueva. */
        AcceptInvitationHttpRequest: {
            token?: null | string;
            acceptedTerms: boolean;
        };
        AcceptInvitationResponse: {
            /** Format: uuid */
            organizationId: string;
            createdAccount: boolean;
            needsPersonalLoginMethod: boolean;
        };
        /**
         * @description Recibe por HTTP la lista de documentos y versiones que la persona acepta. El controller la transforma en
         *     la solicitud del servicio de aceptación legal.
         */
        AcceptLegalHttpRequest: {
            documents?: null | components["schemas"]["LegalAcceptanceItem"][];
        };
        /**
         * @description Identifica con qué acceso opera la sesión: como persona, como empresa o como operador de plataforma. Las
         *     rutas y las reglas lo usan para separar las operaciones permitidas.
         * @enum {string}
         */
        Access: "consumer" | "business" | "platform";
        AccountDeletionResponse: {
            /** Format: date-time */
            scheduledForUtc: string;
        };
        /** @description Describe disponibilidad y acciones de un método sin incluir su contacto completo en la representación de diagnóstico. */
        AccountLoginMethodResponse: {
            /** Format: uuid */
            id: string;
            type: components["schemas"]["LoginMethodType"];
            value?: null | string;
            isPrimary: boolean;
            isVerified: boolean;
            /** Format: uuid */
            managedByTenantId?: null | string;
            managedByOrganizationName?: null | string;
            canRemove: boolean;
            canMakePrimary: boolean;
            backupDestination?: null | string;
        };
        /** @description Entrega métodos de ingreso y capacidades de gestión de la cuenta sin exponer los objetos de persistencia. */
        AccountLoginMethodsResponse: {
            methods: components["schemas"]["AccountLoginMethodResponse"][];
            canLinkGoogle: boolean;
            needsPersonalLoginMethod: boolean;
            /** Format: int32 */
            accountDeletionGraceDays: number;
            soleOwnerOrganizations: string[];
        };
        /**
         * @description Estado de un pedido de «Recuperar mi cuenta»: lo resuelve un operador de la plataforma.
         * @enum {string}
         */
        AccountRecoveryStatus: "Pending" | "Approved" | "Rejected";
        AddCompanyMemberHttpRequest: {
            /** Format: uuid */
            memberId?: null | string;
            roleIds?: null | string[];
        };
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        AddLoginMethodHttpRequest: {
            email?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Recibe los datos de la primera organización y empresa sin imprimir datos fiscales en logs. */
        BusinessSignupHttpRequest: {
            organizationName?: null | string;
            slug?: null | string;
            firstCompanyName?: null | string;
            taxId?: null | components["schemas"]["BusinessSignupTaxIdHttpRequest"];
            acceptedTerms: boolean;
        };
        /**
         * @description Indica si el registro de empresas está abierto, requiere aprobación o está cerrado. Permite aplicar la
         *     política global del alta de organizaciones.
         * @enum {string}
         */
        BusinessSignupMode: "Open" | "RequiresApproval" | "Closed";
        /** @description Confirma el alta, su estado y el correo principal de la cuenta, al que se avisa la aprobación. */
        BusinessSignupResponse: {
            /** Format: uuid */
            tenantId: string;
            organizationName: string;
            slug: string;
            requiresApproval: boolean;
            /** Format: uuid */
            firstCompanyId: string;
            status: components["schemas"]["TenantStatus"];
            notificationEmail?: null | components["schemas"]["Email"];
        };
        BusinessSignupTaxIdHttpRequest: {
            type?: null | string;
            number?: null | string;
        };
        /**
         * @description Recibe la prueba que permite cancelar una baja pendiente y devuelve el retorno del ingreso. El ticket se
         *     conserva sin normalizar y se oculta en ToString.
         */
        CancelAccountDeletionHttpRequest: {
            cancelTicket?: null | string;
        };
        /** @description Indica al navegador dónde continuar después de cancelar la baja y completar el ingreso. */
        CancelAccountDeletionHttpResponse: {
            returnUrl: string;
        };
        ChangeCompanyMemberStatusHttpRequest: {
            status?: null | components["schemas"]["CompanyMembershipStatus"];
            /** Format: uint32 */
            version?: null | number;
        };
        ChangeCompanyStatusHttpRequest: {
            status?: null | components["schemas"]["CompanyStatus"];
            /** Format: uint32 */
            version?: null | number;
        };
        ChangeOrganizationUserStatusHttpRequest: {
            isActive?: null | boolean;
            /** Format: uint32 */
            version?: null | number;
        };
        ChangePlatformOperatorHttpRequest: {
            /** Format: uint32 */
            version?: null | number;
            reason?: null | string;
            permissions?: null | string[];
        };
        /**
         * @description Lo que ve quien suma a alguien a su empresa: el nombre y el correo tapado (`PersonalDataMask`), nunca el
         *     completo ni la cuenta. Sin nombre, el nombre es el correo tapado.
         */
        CompanyCandidateResponse: {
            /** Format: uuid */
            memberId: string;
            displayName: string;
            maskedEmailAddress?: null | string;
        };
        CompanyFilterCountsResponse: {
            /** Format: int32 */
            all: number;
            /** Format: int32 */
            active: number;
            /** Format: int32 */
            inactive: number;
        };
        CompanyMemberFilterCountsResponse: {
            /** Format: int32 */
            all: number;
            /** Format: int32 */
            active: number;
            /** Format: int32 */
            pendingDeletion: number;
            /** Format: int32 */
            inactive: number;
            /** Format: int32 */
            invited: number;
        };
        /**
         * @description Un miembro de la empresa. `InvitationId` y `InvitationExpiresAtUtc` son de la invitación pendiente que
         *     incluye a esta empresa, la que se reenvía o revoca desde la ficha; si no hay, van en null.
         */
        CompanyMemberHttpResponse: {
            /** Format: uuid */
            memberId: string;
            /** Format: uuid */
            userId?: null | string;
            displayName: string;
            email?: null | string;
            state: components["schemas"]["CompanyMemberState"];
            membershipStatus: components["schemas"]["CompanyMembershipStatus"];
            roles: components["schemas"]["CompanyMemberRoleResponse"][];
            /** Format: uint32 */
            version: number;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: uuid */
            invitationId?: null | string;
            /** Format: date-time */
            invitationExpiresAtUtc?: null | string;
        };
        CompanyMemberRoleResponse: {
            /** Format: uuid */
            id: string;
            name: string;
            isSystemRole: boolean;
            scope: components["schemas"]["RoleScope"];
            /** Format: uuid */
            companyId?: null | string;
        };
        /** @enum {string} */
        CompanyMembershipStatus: "Active" | "Inactive";
        /** @enum {string} */
        CompanyMemberState: "Active" | "PendingDeletion" | "Inactive" | "Invited";
        CompanyResponse: {
            /** Format: uuid */
            id: string;
            name: string;
            taxId?: null | components["schemas"]["CompanyTaxIdResponse"];
            timeZoneId: string;
            status: components["schemas"]["CompanyStatus"];
            /** Format: int32 */
            memberCount: number;
            /** Format: uint32 */
            version: number;
            /** Format: date-time */
            createdAtUtc: string;
        };
        /** @enum {string} */
        CompanyStatus: "Active" | "Inactive";
        CompanyTaxIdResponse: {
            country: string;
            type: string;
            number: string;
        };
        /**
         * @description Indica si la plataforma admite nuevas cuentas personales. La regla de registro consulta este valor antes
         *     de crear una cuenta.
         * @enum {string}
         */
        ConsumerSignupMode: "Open" | "Closed";
        /** @description Expone un país con sus códigos y referencias predeterminadas para los selectores. */
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
        /** @description Solo el número de identificación fiscal: el tipo sale del país de la organización. */
        CreateCompanyHttpRequest: {
            name?: null | string;
            taxIdNumber?: null | string;
            timeZoneId?: null | string;
        };
        CreatedPlatformTenantResponse: {
            /** Format: uuid */
            id: string;
            name: string;
            slug: string;
            /** Format: uuid */
            firstCompanyId: string;
            /** Format: uuid */
            invitationId: string;
        };
        CreatePlatformTenantHttpRequest: {
            name?: null | string;
            firstCompanyName?: null | string;
            ownerEmail?: null | string;
            culture?: null | string;
            timeZoneId?: null | string;
        };
        CreateRoleHttpRequest: {
            name?: null | string;
            description?: null | string;
            scope?: null | components["schemas"]["RoleScope"];
            /** Format: uuid */
            companyId?: null | string;
            permissions?: null | string[];
        };
        /** @description Expone los patrones y separadores de una cultura para formatear fechas y números en el cliente. */
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
        /** @description Expone una moneda con su precisión, símbolos y nombre traducido para mostrar importes. */
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
        /** @description Resultado por cursor, sin conteo total sobre tablas que solo crecen. */
        CursorResultOfOrganizationAuditEntryResponse: {
            items: components["schemas"]["OrganizationAuditEntryResponse"][];
            nextCursor?: null | string;
            hasMore: boolean;
        };
        /** @description Resultado por cursor, sin conteo total sobre tablas que solo crecen. */
        CursorResultOfPlatformAuditEventResponse: {
            items: components["schemas"]["PlatformAuditEventResponse"][];
            nextCursor?: null | string;
            hasMore: boolean;
        };
        /** @description Resultado por cursor, sin conteo total sobre tablas que solo crecen. */
        CursorResultOfPlatformTenantHistoryResponse: {
            items: components["schemas"]["PlatformTenantHistoryResponse"][];
            nextCursor?: null | string;
            hasMore: boolean;
        };
        DeleteRoleHttpRequest: {
            /** Format: uint32 */
            version?: null | number;
        };
        /** @description Tarjeta del directorio; contiene únicamente los cuatro datos públicos del listado. */
        DirectoryEntryRow: {
            slug: string;
            name: string;
            description?: null | string;
            logoUrl?: null | string;
        };
        /** @description Permisos efectivos del acceso activo, separados entre organización, empresas y Plataforma. */
        EffectivePermissions: {
            organization: string[];
            companies: {
                [key: string]: string[];
            };
            platform: string[];
        };
        /** @description Correo normalizado para comparar y enviar; el dominio IDN se guarda en ASCII. */
        Email: null | string;
        /** @description Entrega la URL del desafío Google al controller sin exponerla en la representación textual del objeto. */
        GoogleChallengeResponse: {
            redirectUrl: string;
        };
        /** @description Token de formulario de un solo origen para iniciar Registro con Google. */
        GoogleSignupAntiforgeryHttpResponse: {
            requestToken: string;
        };
        /** @description El último cambio de la auditoría; `null` si todavía no hay. */
        HomeAudit: {
            /** Format: date-time */
            lastChangeAtUtc?: null | string;
        };
        /** @description «Tus empresas»: una empresa donde la persona tiene roles; los miembros, solo si puede verlos. */
        HomeCompanyCard: {
            /** Format: uuid */
            companyId: string;
            name: string;
            roles: string[];
            /** Format: int32 */
            memberCount?: null | number;
        };
        HomeCount: {
            /** Format: int32 */
            total: number;
        };
        /** @description Una tarjeta por área, con su dato real; `null` si quien mira no tiene el permiso del área. */
        HomeOrganizationSummary: {
            users?: null | components["schemas"]["HomeCount"];
            roles?: null | components["schemas"]["HomeCount"];
            companies?: null | components["schemas"]["HomeCount"];
            publicPage?: null | components["schemas"]["HomePublicPage"];
            settings?: null | components["schemas"]["HomeSettings"];
            audit?: null | components["schemas"]["HomeAudit"];
        };
        HomePublicPage: {
            state: components["schemas"]["HomePublicPageState"];
        };
        /** @enum {string} */
        HomePublicPageState: "Published" | "Draft" | "Blocked";
        /**
         * @description Inicio de la organización (ADR 0040). Quien tiene permisos de la organización ve las tarjetas de sus áreas; quien
         *     solo tiene roles en empresas ve «Tus empresas». Debajo, «Para resolver».
         */
        HomeResponse: {
            organization?: null | components["schemas"]["HomeOrganizationSummary"];
            companies: components["schemas"]["HomeCompanyCard"][];
            pending: components["schemas"]["PendingItem"][];
        };
        /** @description El dominio de correo de la organización; `null` si no tiene. */
        HomeSettings: {
            domain?: null | string;
        };
        /** @description Solo datos presentables de la invitación autorizada; jamás hashes ni secretos. */
        InvitationPreviewResponse: {
            state: components["schemas"]["InvitationPreviewState"];
            /** Format: uuid */
            organizationId?: null | string;
            organizationName?: null | string;
            /** @description Correo normalizado para comparar y enviar; el dominio IDN se guarda en ASCII. */
            email?: null | string;
            inviterName?: null | string;
            /** Format: date-time */
            issuedAtUtc?: null | string;
            /** Format: date-time */
            expiresAtUtc?: null | string;
            /** @description Correo normalizado para comparar y enviar; el dominio IDN se guarda en ASCII. */
            currentAccountEmail?: null | string;
            /** @default false */
            canUseEmailCode: boolean;
            /** @default false */
            canUseGoogle: boolean;
            /** @default false */
            needsPersonalLoginMethod: boolean;
            inviterRoles?: null | string[];
            companies?: null | string[];
            roles?: null | string[];
            currentAccountName?: null | string;
        };
        /** @enum {string} */
        InvitationPreviewState: "NoAccount" | "SignInRequired" | "Ready" | "WrongSession" | "Expired" | "Invalid" | "OrganizationSuspended" | "Accepted";
        InviteCompanyRolesHttpRequest: {
            /** Format: uuid */
            companyId: string;
            roleIds?: null | string[];
        };
        InviteOrganizationUserHttpRequest: {
            email?: null | string;
            roleIds?: null | string[];
            companies?: null | components["schemas"]["InviteCompanyRolesHttpRequest"][];
        };
        InvitePlatformOperatorHttpRequest: {
            email?: null | string;
            permissions?: null | string[];
        };
        /**
         * @description Identifica el documento y la versión exacta que una persona acepta. El servicio los compara con la versión
         *     vigente antes de guardar la prueba de aceptación.
         */
        LegalAcceptanceItem: {
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            version: number;
        };
        LegalDocumentContentHttpRequest: {
            culture?: null | string;
            text?: null | string;
        };
        /**
         * @description Distingue términos y condiciones de política de privacidad. Cada documento conserva sus propias
         *     versiones, textos y aceptaciones.
         * @enum {string}
         */
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
        /** @enum {null|string} */
        LoginAuditMethod: "Code" | "Google" | "WhatsAppCode" | "WhatsAppLink" | null;
        LoginChannelAvailability: {
            key: string;
            countries: string[];
            /** @description Número público E.164 aportado por el canal. Opcional; no es identificador del proveedor. */
            contactPhone?: null | string;
        };
        LoginLinkPreviewResponse: {
            displayName?: null | string;
            maskedPhone?: null | string;
        };
        LoginLinkRedeemResponse: {
            /** @enum {string} */
            access: "consumer";
        };
        /**
         * @description Devuelve el método al que se envió un código y cuánto hay que esperar para reenviarlo. Permite
         *     identificar el destino y controlar el botón de reenvío.
         */
        LoginMethodCodeResponse: {
            /** Format: uuid */
            methodId: string;
            /** Format: int32 */
            resendAfterSeconds: number;
        };
        /** @description Canales activos aportados por el núcleo y los módulos registrados. */
        LoginMethodsResponse: {
            channels: components["schemas"]["LoginChannelAvailability"][];
        };
        /**
         * @description Identifica si un método de ingreso usa correo, teléfono o Google. El tipo determina cómo se interpreta
         *     su valor y qué canal puede verificarlo.
         * @enum {string}
         */
        LoginMethodType: "Email" | "Phone" | "Google";
        /**
         * @description Indica si una membresía está invitada, activa, inactiva o retirada. Las reglas lo usan para decidir si
         *     la persona puede operar en ese espacio.
         * @enum {string}
         */
        MemberStatus: "Invited" | "Active" | "Inactive" | "Removed";
        /**
         * @description Cuenta, accesos y preferencias efectivas de la sesión actual. El correo es el del perfil activo: en una
         *     organización, el verificado que ella administra y, si no hay, el principal; en los demás perfiles, el principal.
         */
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
            firstName?: null | string;
            lastName?: null | string;
            /** @description País de la organización empresarial activa, desde su cultura del catálogo; no es la región personal. */
            organizationCountryCode?: null | string;
            /** Format: uint32 */
            version?: number;
            needsPersonalLoginMethod?: boolean;
            pendingLegalDocuments?: components["schemas"]["PendingLegalDocumentResponse"][];
            permissions?: null | string[];
        };
        OrganizationAuditActorResponse: {
            /** Format: uuid */
            actorId?: null | string;
            actorKind: string;
            actorText: string;
            displayName?: null | string;
        };
        OrganizationAuditChangeResponse: {
            field: string;
            oldValue?: null | string;
            newValue?: null | string;
        };
        OrganizationAuditEntryResponse: {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            occurredAtUtc: string;
            action: string;
            actionText: string;
            entityType: string;
            entityText: string;
            affectedDisplayName?: null | string;
            whereText: string;
            actorKind: string;
            actorText: string;
            /** Format: uuid */
            actorId?: null | string;
            actorDisplayName?: null | string;
            changes: components["schemas"]["OrganizationAuditChangeResponse"][];
            actorEmail?: null | components["schemas"]["Email"];
        };
        /** @description Un dominio de correo de la organización; ManagedEmailCount cuenta los correos verificados de ese dominio que administra. */
        OrganizationDomainResponse: {
            /** Format: uuid */
            id: string;
            domain: string;
            status: components["schemas"]["TenantDomainStatus"];
            txtRecordName?: null | string;
            txtRecordValue?: null | string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: date-time */
            verifiedAtUtc?: null | string;
            /** Format: uint32 */
            version: number;
            /** Format: int32 */
            managedEmailCount: number;
        };
        /** @description La invitación emitida y cuándo vence, para el aviso «Invitamos a … La invitación vence el …». */
        OrganizationInvitationIssuedResponse: {
            /** Format: uuid */
            invitationId: string;
            /** Format: date-time */
            expiresAtUtc: string;
        };
        OrganizationSettingsResponse: {
            name: string;
            defaultCulture: string;
            defaultTimeZoneId: string;
            defaultCurrency: string;
            /** Format: uint32 */
            version: number;
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
        OrganizationUserCompanyRow: {
            /** Format: uuid */
            companyId: string;
            companyName: string;
            status: components["schemas"]["CompanyMembershipStatus"];
            roles: components["schemas"]["OrganizationUserRoleRow"][];
        };
        OrganizationUserFilterCountsResponse: {
            /** Format: int32 */
            all: number;
            /** Format: int32 */
            active: number;
            /** Format: int32 */
            pendingDeletion: number;
            /** Format: int32 */
            invited: number;
            /** Format: int32 */
            expired: number;
            /** Format: int32 */
            inactive: number;
        };
        OrganizationUserHttpResponse: {
            /** Format: uuid */
            memberId: string;
            /** Format: uuid */
            userId?: null | string;
            displayName: string;
            email?: null | string;
            state: components["schemas"]["OrganizationUserState"];
            hasManagedEmail: boolean;
            roles: components["schemas"]["OrganizationUserRoleRow"][];
            companies: components["schemas"]["OrganizationUserCompanyRow"][];
            /** Format: uuid */
            invitationId?: null | string;
            /** Format: date-time */
            invitationIssuedAtUtc?: null | string;
            /** Format: date-time */
            invitationExpiresAtUtc?: null | string;
            /** Format: uint32 */
            version: number;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: date-time */
            deletionScheduledForUtc?: null | string;
        };
        OrganizationUserRoleRow: {
            /** Format: uuid */
            id: string;
            name: string;
            isSystemRole: boolean;
            scope: components["schemas"]["RoleScope"];
            /** Format: uuid */
            companyId?: null | string;
        };
        /** @enum {string} */
        OrganizationUserState: "Active" | "PendingDeletion" | "Invited" | "Expired" | "Inactive";
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
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfCompanyCandidateResponse: {
            items: components["schemas"]["CompanyCandidateResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfCompanyMemberHttpResponse: {
            items: components["schemas"]["CompanyMemberHttpResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfCompanyResponse: {
            items: components["schemas"]["CompanyResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfDirectoryEntryRow: {
            items: components["schemas"]["DirectoryEntryRow"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfOrganizationUserHttpResponse: {
            items: components["schemas"]["OrganizationUserHttpResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfPlatformAccountResponse: {
            items: components["schemas"]["PlatformAccountResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfPlatformRecoveryResponse: {
            items: components["schemas"]["PlatformRecoveryResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfPlatformTenantResponse: {
            items: components["schemas"]["PlatformTenantResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Representa una página y el total de resultados para que el consumidor pueda mostrar navegación anterior y siguiente. */
        PagedResultOfRoleResponse: {
            items: components["schemas"]["RoleResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            pageSize: number;
            /** Format: int32 */
            totalCount: number;
            /** Format: int32 */
            totalPages?: number;
            hasPrevious?: boolean;
            hasNext?: boolean;
        };
        /** @description Expone la fecha programada y el comprobante temporal para cancelar una baja sin iniciar sesión. */
        PendingDeletionState: {
            /** Format: date-time */
            scheduledForUtc: string;
            cancelTicket: string;
            timeZoneId: string;
            returnUrl: string;
            /** Format: date-time */
            expiresAtUtc: string;
        };
        /**
         * @description Una fila de «Para resolver». `Area` y `Kind` son claves estables: el front arma el texto, el estado y la
         *     acción. `SinceUtc` ordena; `DueAtUtc` es la fecha del detalle (por ejemplo, cuándo se elimina).
         *     `CompanyId` y `CompanyName` vienen cuando el pendiente es de una empresa (Inicio-Miembro).
         */
        PendingItem: {
            area: string;
            kind: string;
            subject?: null | string;
            urgent: boolean;
            /** Format: date-time */
            sinceUtc?: null | string;
            /** Format: date-time */
            dueAtUtc?: null | string;
            /** Format: uuid */
            targetId?: null | string;
            /** Format: uuid */
            companyId?: null | string;
            companyName?: null | string;
        };
        /**
         * @description Identifica un documento legal y su versión pendiente de aceptación. Permite que el front solicite la
         *     aceptación de la versión exacta.
         */
        PendingLegalDocumentResponse: {
            /** Format: uuid */
            id: string;
            kind: components["schemas"]["LegalDocumentKind"];
            /** Format: int32 */
            version: number;
        };
        PermissionGroupResponse: {
            area: string;
            name: string;
            permissions: components["schemas"]["PermissionItem"][];
        };
        PermissionItem: {
            code: string;
            name: string;
            description: string;
        };
        /** @description País elegido y número escrito; el parser del servicio produce E.164. */
        PhoneInputHttpRequest: {
            country?: null | string;
            number?: null | string;
        };
        /** @description Decidir un pedido de recuperación o quitar a un operador: la versión vista de esa fila y el motivo. */
        PlatformAccountActionHttpRequest: {
            /** Format: uint32 */
            version?: null | number;
            reason?: null | string;
        };
        PlatformAccountDeletionResponse: {
            /** Format: date-time */
            requestedAtUtc: string;
            /** Format: date-time */
            scheduledForUtc: string;
            requestedByPlatform: boolean;
        };
        /** @description Ficha: correo principal, métodos enmascarados, membresías globales y permisos si es operador. */
        PlatformAccountDetailResponse: {
            /** Format: uuid */
            id: string;
            displayName?: null | string;
            primaryEmail?: null | components["schemas"]["Email"];
            kind: components["schemas"]["PlatformAccountKind"];
            state: components["schemas"]["PlatformAccountState"];
            /** Format: date-time */
            createdAtUtc?: null | string;
            /** Format: date-time */
            deletedAtUtc?: null | string;
            /** Format: date-time */
            lastSignInAtUtc?: null | string;
            lastSignInMethod?: null | components["schemas"]["LoginAuditMethod"];
            /** Format: date-time */
            invitationExpiresAtUtc?: null | string;
            hasPersonalSpace: boolean;
            deletion?: null | components["schemas"]["PlatformAccountDeletionResponse"];
            loginMethods: components["schemas"]["PlatformAccountLoginMethodResponse"][];
            organizations: components["schemas"]["PlatformAccountMembershipResponse"][];
            soleOwnerOrganizations: string[];
            operatorPermissions?: null | string[];
            /** Format: uint32 */
            operatorVersion?: null | number;
            lastStateChange?: null | components["schemas"]["PlatformAccountStateChangeResponse"];
        };
        PlatformAccountFilterCounts: {
            /** Format: int32 */
            total: number;
            states: components["schemas"]["PlatformAccountStateCount"][];
            kinds: components["schemas"]["PlatformAccountKindCount"][];
        };
        /** @enum {string} */
        PlatformAccountKind: "Person" | "Operator";
        PlatformAccountKindCount: {
            kind: components["schemas"]["PlatformAccountKind"];
            /** Format: int32 */
            count: number;
        };
        PlatformAccountLoginMethodResponse: {
            /** Format: uuid */
            id: string;
            type: components["schemas"]["LoginMethodType"];
            maskedValue: string;
            isPrimary: boolean;
            /** Format: date-time */
            verifiedAtUtc?: null | string;
            managedByOrganizationName?: null | string;
            canSignIn: boolean;
        };
        /** @description EndedAtUtc sale del último SecurityEvent de fin de membresía de esa cuenta; sin evidencia queda null. */
        PlatformAccountMembershipResponse: {
            /** Format: uuid */
            tenantId: string;
            name: string;
            roleName?: null | string;
            /** Format: date-time */
            joinedAtUtc?: null | string;
            status: components["schemas"]["MemberStatus"];
            tenantStatus: components["schemas"]["TenantStatus"];
            /** Format: date-time */
            endedAtUtc?: null | string;
        };
        /** @description Suspender, reactivar, cerrar sesiones y dar de baja una cuenta: solo el motivo, sin versión. */
        PlatformAccountReasonHttpRequest: {
            reason?: null | string;
        };
        /**
         * @description Fila del listado: el correo principal completo identifica la cuenta, como en el tablero Cuentas. Una invitación de
         *     operador sin aceptar lleva su vencimiento (ADR 0042).
         */
        PlatformAccountResponse: {
            /** Format: uuid */
            id: string;
            displayName?: null | string;
            primaryEmail?: null | components["schemas"]["Email"];
            kind: components["schemas"]["PlatformAccountKind"];
            state: components["schemas"]["PlatformAccountState"];
            hasPersonalSpace: boolean;
            /** Format: int32 */
            organizationCount: number;
            /** Format: date-time */
            lastSignInAtUtc?: null | string;
            lastSignInMethod?: null | components["schemas"]["LoginAuditMethod"];
            /** Format: date-time */
            invitationExpiresAtUtc?: null | string;
        };
        /**
         * @description Estado que ve Plataforma. NeedsRecovery se deriva: cuenta Active sin ningún método que sirva para ingresar;
         *     los demás estados de la cuenta tienen prioridad. Invited e InvitationExpired son la invitación de un operador
         *     sin aceptar, vigente o vencida (ADR 0042).
         * @enum {string}
         */
        PlatformAccountState: "Active" | "Suspended" | "NeedsRecovery" | "PendingDeletion" | "Deleted" | "Invited" | "InvitationExpired";
        /** @description Última transición efectiva registrada en SecurityEvents; el motivo desconocido queda null. */
        PlatformAccountStateChangeResponse: {
            /** Format: date-time */
            atUtc: string;
            action: string;
            reason?: null | string;
        };
        PlatformAccountStateCount: {
            state: components["schemas"]["PlatformAccountState"];
            /** Format: int32 */
            count: number;
        };
        /** @description Una fila de la auditoría ya traducida: qué pasó, sobre qué, quién y con qué motivo. */
        PlatformAuditEventResponse: {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            occurredAtUtc: string;
            type: string;
            action: string;
            summary: string;
            target: string;
            /** Format: uuid */
            targetTenantId?: null | string;
            /** Format: uuid */
            targetAccountId?: null | string;
            actor: string;
            actorRole: string;
            reason?: null | string;
            ipAddress?: null | string;
        };
        /** @description Una organización presente en los eventos filtrados, con su nombre global actual. */
        PlatformAuditOrganizationResponse: {
            /** Format: uuid */
            id: string;
            name: string;
        };
        /** @description Los correos de contacto que muestran Ingreso y Registro, sin sesión; null mientras no se cargaron. */
        PlatformContactResponse: {
            salesEmail?: null | components["schemas"]["Email"];
            supportEmail?: null | components["schemas"]["Email"];
        };
        /** @description Habilitación administrable; cero identifica la configuración inicial sin fila persistida. */
        PlatformFeatureResponse: {
            key: string;
            enabled: boolean;
            source: components["schemas"]["TenantFeatureSource"];
            /** Format: date */
            expiresOn?: null | string;
            /** Format: uint32 */
            version: number;
        };
        PlatformLegalContentResponse: {
            culture: string;
            text: string;
        };
        /** @description Un tipo de documento con su versión vigente y todas sus versiones, de la más nueva a la más vieja. */
        PlatformLegalDocumentGroupResponse: {
            kind: components["schemas"]["LegalDocumentKind"];
            /** Format: int32 */
            currentVersion?: null | number;
            /** Format: date-time */
            currentEffectiveAtUtc?: null | string;
            versions: components["schemas"]["PlatformLegalVersionResponse"][];
        };
        /** @description Una versión para leer, con el texto de cada cultura. No se edita: para cambiarla se publica otra. */
        PlatformLegalDocumentResponse: {
            /** Format: uuid */
            id: string;
            kind: components["schemas"]["LegalDocumentKind"];
            /** Format: int32 */
            version: number;
            /** Format: date-time */
            effectiveAtUtc: string;
            isCurrent: boolean;
            contents: components["schemas"]["PlatformLegalContentResponse"][];
        };
        PlatformLegalVersionResponse: {
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            version: number;
            /** Format: date-time */
            effectiveAtUtc: string;
            isCurrent: boolean;
        };
        /**
         * @description La cuenta del operador invitado, que figura en Cuentas como «Invitación pendiente», y el vencimiento de la
         *     invitación (ADR 0042).
         */
        PlatformOperatorInvitationResponse: {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            expiresAtUtc: string;
        };
        /** @description Solo metadatos de publicación; no incluye contenido, logo ni contacto de la página. */
        PlatformPublicSiteResponse: {
            slug?: null | string;
            name: string;
            isPublished: boolean;
            /** Format: date-time */
            publishBlockedAtUtc?: null | string;
            publishBlockedReason?: null | string;
            /** Format: uint32 */
            version: number;
            /** Format: date-time */
            publishedAtUtc?: null | string;
        };
        PlatformRecoveryFilterCounts: {
            /** Format: int32 */
            total: number;
            statuses: components["schemas"]["PlatformRecoveryStatusCount"][];
        };
        /** @description Fila de la bandeja: los métodos van enmascarados, como en el tablero; el motivo es interno. */
        PlatformRecoveryResponse: {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            createdAtUtc: string;
            /** Format: uuid */
            accountId?: null | string;
            accountName?: null | string;
            previousMethodType: components["schemas"]["LoginMethodType"];
            previousMethod: string;
            newMethodType: components["schemas"]["LoginMethodType"];
            newMethod: string;
            status: components["schemas"]["AccountRecoveryStatus"];
            /** Format: date-time */
            decidedAtUtc?: null | string;
            decidedBy?: null | string;
            reason?: null | string;
            /** Format: uint32 */
            version: number;
        };
        PlatformRecoveryStatusCount: {
            status: components["schemas"]["AccountRecoveryStatus"];
            /** Format: int32 */
            count: number;
        };
        PlatformSettingsResponse: {
            consumerSignup: components["schemas"]["ConsumerSignupMode"];
            businessSignup: components["schemas"]["BusinessSignupMode"];
            /** Format: int32 */
            maxOwnedOrganizations: number;
            salesEmail?: null | components["schemas"]["Email"];
            supportEmail?: null | components["schemas"]["Email"];
            /** Format: uint32 */
            version: number;
        };
        /** @description Ficha global; su versión pertenece únicamente a Tenants. */
        PlatformTenantDetailResponse: {
            /** Format: uuid */
            id: string;
            name: string;
            slug?: null | string;
            status: components["schemas"]["TenantStatus"];
            source: components["schemas"]["TenantRegistrationSource"];
            /** Format: date-time */
            createdAtUtc?: null | string;
            /** Format: int32 */
            companyCount: number;
            /** Format: int32 */
            memberCount: number;
            /** Format: uint32 */
            version: number;
            ownerName?: null | string;
            ownerEmail?: null | components["schemas"]["Email"];
            owners: components["schemas"]["PlatformTenantOwnerResponse"][];
            lastStateChange?: null | components["schemas"]["PlatformTenantStateChangeResponse"];
        };
        PlatformTenantFilterCounts: {
            /** Format: int32 */
            total: number;
            statuses: components["schemas"]["PlatformTenantStatusCount"][];
            sources: components["schemas"]["PlatformTenantSourceCount"][];
        };
        PlatformTenantHistoryResponse: {
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            occurredAtUtc: string;
            action: string;
            actor: string;
            actorRole: string;
            reason?: null | string;
            summary: string;
        };
        PlatformTenantOwnerResponse: {
            /** Format: uuid */
            id: string;
            displayName?: null | string;
            email?: null | components["schemas"]["Email"];
            identityStatus: components["schemas"]["UserStatus"];
            membershipStatus: components["schemas"]["MemberStatus"];
            /** Format: date-time */
            lastSignInAtUtc?: null | string;
            lastSignInMethod?: null | components["schemas"]["LoginAuditMethod"];
        };
        PlatformTenantResponse: {
            /** Format: uuid */
            id: string;
            name: string;
            slug?: null | string;
            status: components["schemas"]["TenantStatus"];
            source: components["schemas"]["TenantRegistrationSource"];
            /** Format: date-time */
            createdAtUtc?: null | string;
            /** Format: int32 */
            companyCount: number;
            /** Format: int32 */
            memberCount: number;
            /** Format: uint32 */
            version: number;
            ownerName?: null | string;
            /** @description Correo normalizado para comparar y enviar; el dominio IDN se guarda en ASCII. */
            ownerEmail?: null | string;
        };
        PlatformTenantRetryHttpRequest: {
            /** Format: uint32 */
            version?: null | number;
        };
        PlatformTenantSourceCount: {
            source: components["schemas"]["TenantRegistrationSource"];
            /** Format: int32 */
            count: number;
        };
        PlatformTenantStateChangeResponse: {
            /** Format: date-time */
            atUtc: string;
            action: string;
            reason?: null | string;
        };
        PlatformTenantStateHttpRequest: {
            /** Format: uint32 */
            version?: null | number;
            reason?: null | string;
        };
        PlatformTenantStatusCount: {
            status: components["schemas"]["TenantStatus"];
            /** Format: int32 */
            count: number;
        };
        /** @description Correo con el que se entraba, enviado sólo en el cuerpo. */
        PreviewAccountRecoveryHttpRequest: {
            previousEmail?: null | string;
            previousPhone?: null | components["schemas"]["PhoneInputHttpRequest"];
        } & ({
            previousEmail: string;
        } | {
            previousPhone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Token opaco recibido en el cuerpo; nunca se expone en la ruta, la query ni el diagnóstico. */
        PreviewInvitationHttpRequest: {
            token?: null | string;
        };
        PreviewLoginLinkHttpRequest: {
            /** @description Secreto de 32 bytes, base64url sin padding. Solo cuerpo/memoria; sin logs. */
            token?: null | string;
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
            /** Format: int32 */
            attemptsLeft?: null | number;
        };
        PublicPageHttpResponse: {
            slug?: null | string;
            name: string;
            description?: null | string;
            logoDataUri?: null | string;
            contactEmail?: null | string;
            contactPhone?: null | string;
            address?: null | string;
            website?: null | string;
            isPublished: boolean;
            /** Format: date-time */
            publishBlockedAtUtc?: null | string;
            publishBlockedReason?: null | string;
            /** Format: uint32 */
            version: number;
        };
        /** @description Solo los datos que la organización publicó para quienes visitan su subdominio. */
        PublicSiteHttpResponse: {
            slug: string;
            name: string;
            description?: null | string;
            logoUrl?: null | string;
            address?: null | string;
            phone?: null | string;
            email?: null | string;
            website?: null | string;
        };
        PublishedLegalDocumentResponse: {
            /** Format: uuid */
            id: string;
            /** Format: int32 */
            version: number;
        };
        /** @description Una versión nueva: tipo, fecha civil de vigencia (aaaa-mm-dd) y el texto en cada cultura habilitada. */
        PublishLegalDocumentHttpRequest: {
            kind?: null | components["schemas"]["LegalDocumentKind"];
            /** Format: date */
            effectiveOn?: null | string;
            contents?: null | components["schemas"]["LegalDocumentContentHttpRequest"][];
        };
        RedeemLoginLinkHttpRequest: {
            /** @description Secreto de 32 bytes, base64url sin padding. Solo cuerpo/memoria; sin logs. */
            token?: null | string;
            /** @enum {null|string} */
            access?: "consumer" | null;
        };
        /**
         * @description Adapta los cinco catálogos de referencia al contrato JSON de la API. Cada FromModel copia explícitamente
         *     los datos de Application para mantener separados los modelos internos y HTTP.
         */
        ReferenceDataHttpResponse: {
            culture: string;
            currencies: components["schemas"]["CurrencyReferenceHttpResponse"][];
            countries: components["schemas"]["CountryReferenceHttpResponse"][];
            timeZones: components["schemas"]["TimeZoneReferenceHttpResponse"][];
            cultures: components["schemas"]["CultureReferenceHttpResponse"][];
            taxIdTypes: components["schemas"]["TaxIdTypeReferenceHttpResponse"][];
        };
        RegisterOrganizationDomainHttpRequest: {
            domain?: null | string;
        };
        /** @description Recibe el motivo de baja desde una sesión iniciada. ToString oculta el texto para evitar que se registre en logs. */
        RequestAccountDeletionHttpRequest: {
            reason?: null | string;
        };
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        RequestLoginCodeHttpRequest: {
            email?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description La espera de un pedido de código aceptado, compartida por ingreso y registro. */
        RequestLoginCodeResponse: {
            /** Format: int32 */
            resendAfterSeconds: number;
        };
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        RequestRecoveryCodeHttpRequest: {
            email?: null | string;
            /** @description Secreto de 32 bytes, base64url sin padding. Solo cuerpo/memoria; sin logs. */
            nonce?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Representación HTTP-independent de un rol; version conserva el xmin de PostgreSQL. */
        RoleResponse: {
            /** Format: uuid */
            id: string;
            name: string;
            description?: null | string;
            scope: components["schemas"]["RoleScope"];
            /** Format: uuid */
            companyId?: null | string;
            isSystemRole: boolean;
            /** Format: int32 */
            userCount: number;
            permissions: string[];
            /** Format: uint32 */
            version: number;
            /** Format: date-time */
            createdAtUtc: string;
        };
        /**
         * @description Ámbito de un rol de organización.
         * @enum {string}
         */
        RoleScope: "Organization" | "AnyCompany" | "SpecificCompany";
        /** @enum {null|string} */
        RoleScopeFilter: "Organization" | "Company" | null;
        SetPublicPagePublicationHttpRequest: {
            /** Format: uint32 */
            version?: null | number;
        };
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        SignupHttpRequest: {
            email?: null | string;
            acceptedTerms: boolean;
            culture?: null | string;
            timeZoneId?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        SubmitAccountRecoveryHttpRequest: ({
            email?: null | string;
            /** @description Secreto de 32 bytes, base64url sin padding. Solo cuerpo/memoria; sin logs. */
            nonce?: null | string;
            previousEmail?: null | string;
            previousPhone?: null | components["schemas"]["PhoneInputHttpRequest"];
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            previousEmail: string;
        } | {
            previousPhone: components["schemas"]["PhoneInputHttpRequest"];
        })) & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Expone un tipo de identificación fiscal con país, máscara y criterio de validación. */
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
        TenantDomainStatus: "Pending" | "Verified" | "Removed";
        /**
         * @description Origen de la habilitación de un módulo por Plataforma.
         * @enum {string}
         */
        TenantFeatureSource: "Plan" | "Manual" | "Trial";
        /**
         * @description Origen del alta global, independiente de quién usa la organización.
         * @enum {string}
         */
        TenantRegistrationSource: "SelfService" | "Platform";
        /** @enum {string} */
        TenantSlugAvailability: "Available" | "Reserved" | "Taken";
        TenantSlugAvailabilityResponse: {
            slug: string;
            availability: components["schemas"]["TenantSlugAvailability"];
        };
        /**
         * @description Describe el ciclo de vida de un espacio personal u organización, desde su preparación hasta el cierre.
         *     Las reglas de acceso consultan este estado antes de permitir operaciones.
         * @enum {string}
         */
        TenantStatus: "PendingApproval" | "Provisioning" | "Active" | "Suspended" | "Closed";
        /** @description Expone una zona IANA y sus países para elegir y presentar la zona horaria. */
        TimeZoneReferenceHttpResponse: {
            id: string;
            countryCodes: string[];
            city: string;
            isEnabled: boolean;
            /** Format: int32 */
            sortOrder?: null | number;
        };
        /** @description Solo el número de identificación fiscal: el tipo sale del país de la organización. */
        UpdateCompanyHttpRequest: {
            name?: null | string;
            taxIdNumber?: null | string;
            timeZoneId?: null | string;
            /** Format: uint32 */
            version?: null | number;
        };
        UpdateCompanyMemberRolesHttpRequest: {
            roleIds?: null | string[];
            /** Format: uint32 */
            version?: null | number;
        };
        /** @description Preferencias de la cuenta autenticada, nunca de un id recibido del cliente. */
        UpdateMeHttpRequest: {
            firstName?: null | string;
            lastName?: null | string;
            culture?: null | string;
            timeZoneId?: null | string;
            /** Format: uint32 */
            version?: null | number;
        };
        UpdateOrganizationSettingsHttpRequest: {
            name?: null | string;
            defaultCulture?: null | string;
            defaultTimeZoneId?: null | string;
            defaultCurrency?: null | string;
            /** Format: uint32 */
            version?: null | number;
        };
        UpdateOrganizationUserHttpRequest: {
            roleIds?: null | string[];
            companies?: null | components["schemas"]["InviteCompanyRolesHttpRequest"][];
            /** Format: uint32 */
            version?: null | number;
            isActive?: null | boolean;
        };
        UpdatePlatformFeatureHttpRequest: {
            enabled?: null | boolean;
            source?: null | components["schemas"]["TenantFeatureSource"];
            /** Format: date */
            expiresOn?: null | string;
            /** Format: uint32 */
            version?: null | number;
            reason?: null | string;
        };
        UpdatePlatformSettingsHttpRequest: {
            consumerSignup?: null | components["schemas"]["ConsumerSignupMode"];
            businessSignup?: null | components["schemas"]["BusinessSignupMode"];
            /** Format: int32 */
            maxOwnedOrganizations?: null | number;
            salesEmail?: null | string;
            supportEmail?: null | string;
            /** Format: uint32 */
            version?: null | number;
            reason?: null | string;
        };
        UpdatePublicPageHttpRequest: {
            slug?: null | string;
            name?: null | string;
            description?: null | string;
            contactEmail?: null | string;
            contactPhone?: null | components["schemas"]["PhoneInputHttpRequest"];
            address?: null | string;
            website?: null | string;
            logoBase64?: null | string;
            logoContentType?: null | string;
            removeLogo: boolean;
            /** Format: uint32 */
            version?: null | number;
        };
        UpdateRoleHttpRequest: {
            name?: null | string;
            description?: null | string;
            scope?: null | components["schemas"]["RoleScope"];
            /** Format: uuid */
            companyId?: null | string;
            permissions?: null | string[];
            /** Format: uint32 */
            version?: null | number;
        };
        /**
         * @description Describe el ciclo de vida de una cuenta: activa, suspendida, con baja pendiente o eliminada. Permite
         *     decidir si puede ingresar y qué acciones siguen disponibles.
         * @enum {string}
         */
        UserStatus: "Active" | "Suspended" | "PendingDeletion" | "Deleted";
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        VerifyLoginCodeHttpRequest: {
            email?: null | string;
            /** @description Dígitos ASCII; longitud configurada en Authentication:LoginCode (6 por defecto). No normalizar ni registrar. */
            code?: null | string;
            returnUrl?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Authorize original que el SPA vuelve a abrir después de crear la sesión. */
        VerifyLoginCodeResponse: {
            returnUrl: string;
        };
        /**
         * @description Recibe el código usado para verificar un método de ingreso pendiente. Conserva el texto original para
         *     validarlo y oculta su valor en ToString.
         */
        VerifyLoginMethodHttpRequest: {
            /** @description Dígitos ASCII; longitud configurada en Authentication:LoginCode (6 por defecto). No normalizar ni registrar. */
            code?: null | string;
        };
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        VerifyRecoveryCodeHttpRequest: {
            email?: null | string;
            /** @description Secreto de 32 bytes, base64url sin padding. Solo cuerpo/memoria; sin logs. */
            nonce?: null | string;
            /** @description Dígitos ASCII; longitud configurada en Authentication:LoginCode (6 por defecto). No normalizar ni registrar. */
            code?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /** @description Exactamente uno de email/phone. Sin channel se conserva correo; email exige channel=email o ausente. Phone exige canal registrado de tipo Phone. País ISO desde referencias; número se interpreta como celular y se normaliza a E.164. T01: teléfono devuelve 501 temporal, sin envío ni escritura; completar en T04. */
        VerifySignupHttpRequest: {
            email?: null | string;
            /** @description Dígitos ASCII; longitud configurada en Authentication:LoginCode (6 por defecto). No normalizar ni registrar. */
            code?: null | string;
            acceptedTerms: boolean;
            culture?: null | string;
            timeZoneId?: null | string;
            phone?: null | components["schemas"]["PhoneInputHttpRequest"];
            channel?: null | string;
        } & ({
            email: string;
        } | {
            phone: components["schemas"]["PhoneInputHttpRequest"];
        });
        /**
         * @description La versión que quedó después de un guardado: el xmin que EF trae del mismo UPDATE (o INSERT) que escribió la fila o,
         *     en «Tus datos», la versión propia del perfil. El front la toma como base del próximo guardado, nunca la de una
         *     relectura (docs/rules/concurrencia.md).
         */
        VersionResponse: {
            /** Format: uint32 */
            version: number;
        };
        /** @description Envelope Meta. Entry conserva su estructura externa; T05 procesa firma sobre los bytes originales. */
        WhatsAppWebhookHttpRequest: {
            object?: null | string;
            entry?: null | unknown[];
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
