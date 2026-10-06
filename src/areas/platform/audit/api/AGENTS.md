# API de Auditoría de Plataforma
Leé datos-y-api y errores; DTO/alias de shared/api/types y httpClient.
GET /api/platform/audit: cursor opaco, límite 25 y filtros cruzados en la clave de Query.
GET /api/platform/audit/organizations: period/type/search/accountId, sin tenantId/after/limit.
No consultar tenants: las opciones de auditoría requieren sólo audit.read.
