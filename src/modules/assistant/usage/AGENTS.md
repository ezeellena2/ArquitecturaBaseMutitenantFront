# Uso agregado del asistente
Copiá Asistente-Uso-Org, Plat-Asistente-Uso y sus M-*; reglas de formatos, datos-y-api, paginado-y-listados y tests.
Sólo tipos generados, mes/página/agrupación por API y permisos configure/read, independientes de chat.
No calcules Money, porcentajes, cuotas ni financiación desde configuración actual; preservá filas históricas por clave.
Excepción humana aprobada el 11/10/2026: el resumen Business omite «Con la clave de la plataforma», su tooltip y «50 consultas por persona por día». Conserva costo/consultas/personas y presupuesto/progreso publicados cuando aplican; cuota personal sólo donde DailyUsage/DailyLimit la respalden. No pide State ni amplía el contrato. Plataforma conserva las dos filas por financiación.
Un 501 es error de lectura, nunca uso vacío ni evidencia de implementación Back. Tests con MSW; puerta real aparte.
