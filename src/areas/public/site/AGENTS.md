Portada y directorio públicos del dominio principal, dentro de la feature `site`.
Leé `docs/rules/pantallas-y-ui.md`, `docs/rules/paginado-y-listados.md` y `docs/architecture/tema.md`.
Copiá Landing, Landing-Movil, Directorio y M-Directorio del lienzo vigente; los textos salen de `src/locales/`.
La portada y `/empresas` comparten `api/directory.ts` y `components/CompanyCard.tsx`; no importan administración Business.
Cada tarjeta navega en la misma pestaña al URL de `tenancy/publicSite`; no se construyen hosts a mano.
