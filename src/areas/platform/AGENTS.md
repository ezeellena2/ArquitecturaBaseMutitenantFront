# Plataforma

Acceso exclusivo de operadores, con permisos individuales `canPlatform` del contrato `/api/me`.
Leé la ficha del backend `docs/features/plataforma.md` y las reglas de accesos, datos/API, errores y pantallas del front.
Las rutas se declaran en `layouts/navigation/platform.ts`; `app/routes.tsx` monta sólo páginas disponibles.
Copiá los patrones de `business/users/` sin importar entre áreas; lo común vive en `shared/`.
