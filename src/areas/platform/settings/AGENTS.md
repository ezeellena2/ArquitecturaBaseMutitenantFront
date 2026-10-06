# Configuración de Plataforma
Leé backend docs/features/plataforma.md y plan Etapa 5 T23d/decisiones 12, 13 y 50.
Copias: SettingsPage con useEditForm/useEditPage; Config-Plat y M-Config-Plat v111 aprobados.
Cinco campos con versión y motivo; PUT nativo sin clave, polling ni gracia.
FormField, Select con description, NumberField, EmailField y ReasonDialog comunes sin medidas propias.
VersionResponse pasa a base antes de invalidar; descarte usa propia sólo si lectura sigue igual a snapshot previo (token opaco).
Vida/borrador/confirmación/motivo/permisos y blocker vivo guardan HTTP, respuestas y callbacks de Retry.
Tests focales API, página, rutas y vidas; root conserva capturas, árbol, documentación y commits.
