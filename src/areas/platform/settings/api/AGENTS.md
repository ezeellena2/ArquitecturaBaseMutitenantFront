# API de Configuración de Plataforma
Leé datos-y-api y errores; DTO y alias desde shared/api/types, transporte httpClient.
GET /api/platform/settings devuelve cinco campos/version; PUT suma reason y devuelve VersionResponse.
PUT sin Idempotency-Key ni protocolo Request.InProgress; permisos y concurrencia los decide el backend.
Contrato cruzado obligatorio local; sólo CI sin repo BACK omite con aviso, aserciones del contrato real intactas.
