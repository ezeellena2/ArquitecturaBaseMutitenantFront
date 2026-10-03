# Empresas de la organización

Las pantallas copian `Empresas`, `M-Empresas`, `Empresa` y `M-Empresa` del lienzo v60 aprobado. Antes de cambiar conducta, mantené los contratos de `shared/api/generated/schema.d.ts` y sus alias en `shared/api/types.ts`.

La lista y la ficha consultan las rutas `/api/companies` y `/api/companies/{companyId}/members`. Las altas usan `Idempotency-Key`; las ediciones, cambios de estado y roles de membresía envían la versión recibida. La API de la empresa permanece dentro de esta feature; no importes APIs internas de Usuarios u otra feature.

El selector de Roles usa el catálogo publicado por el área Roles y solo muestra roles aplicables a esa empresa. Las protecciones del último Administrador y de concurrencia pertenecen al backend; la interfaz presenta sus errores sin sustituirlas.
