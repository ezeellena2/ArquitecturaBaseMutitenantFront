# Empresas de la organización

Las pantallas copian `Empresas`, `M-Empresas`, `Empresa` y `M-Empresa` del lienzo vigente. Antes de cambiar conducta, mantené los contratos de `shared/api/generated/schema.d.ts` y sus alias en `shared/api/types.ts`.

La lista y la ficha consultan `/api/companies`, `/api/companies/{companyId}/members` y `/api/companies/{companyId}/roles` (los roles asignables de la empresa, B4). Las altas usan `Idempotency-Key`; las ediciones, cambios de estado y roles de membresía envían la versión recibida. La API de la empresa permanece dentro de esta feature; no importes APIs internas de Usuarios u otra feature.

La ficha se abre con `companies.read` o con `company.members.read` en esa empresa (B4): un Administrador de empresa ve la suya. Las protecciones del último Administrador y de concurrencia pertenecen al backend; la interfaz presenta sus errores sin sustituirlas.
