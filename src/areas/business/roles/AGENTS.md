Roles y permisos del acceso B2B: la feature de referencia que copian las demás (`api/`, `columns.tsx`, `errors.ts`, `lib/`, `components/` y `pages/`).
Leé `../../../../../ArquitecturaBaseMutitenant/docs/features/roles.md` y `../../../../docs/rules/estructura-y-features.md`.
Las pantallas copian Roles, Rol, M-Roles y M-Rol del lienzo vigente; cada consulta y acción exige roles.read o roles.manage.
Los roles de empresa usan el catálogo de Empresas y muestran el nombre de la empresa en «Vale en».
