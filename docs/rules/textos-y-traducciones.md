# Textos y traducciones

**Regla:** todo texto de la interfaz sale de `src/locales/<idioma>/<namespace>.json`, con las mismas claves en todos los idiomas habilitados. Los nombres de monedas, países, zonas y tipos fiscales son datos traducidos de `GET /api/reference-data`. Español rioplatense con voseo. "Tenant" nunca aparece.

## Cómo se hace
- Un namespace por módulo (`useTranslation("roles")`). Lo compartido va en `common:` y los enums en `enums:<Enum>.<Valor>`.
- Plurales con `_one` / `_other`; interpolación con `{{count}}`.
- Vocabulario: "Organización" (nunca tenant), "Dueño" (TenantAdmin; nunca "Administrador general"), "Administrador" (CompanyAdmin), "Personal" (el lado B2C, su espacio personal), "lado" (persona o empresa), "Empresa" (Company), "Usuario" (en Gestión de usuarios de la organización), "Miembro" (de una empresa), "Ingresá" (`/login`, la puerta de persona), "Ingresá como empresa" (`/login/empresa`, la puerta B2B), "Registrá tu empresa" (el alta B2B).
- Acciones sobre usuarios: "Deshabilitar" / "Habilitar" (nunca "Activar"), "Revocar invitación". El estado de quien pidió la baja de su cuenta es "Baja pedida".
- La lista de culturas habilitadas, su `LanguageCode`, su cultura de respaldo y la marcada por defecto salen de `Cultures`, no de una lista en el front. El catálogo inicial habilita `es-AR` y `en-US`; cada idioma habilitado tiene su carpeta de textos.
- Los archivos de idioma empaquetados inicializan i18n antes de pedir `GET /api/reference-data`, para que los errores de arranque y sus acciones siempre tengan texto. Al recibir `Cultures`, su selección habilitada y `FallbackCulture` gobiernan el idioma efectivo.
- La cultura efectiva sale de `resolveCulture`: la de la cuenta (`/api/me`); si no, la elegida en este navegador (`arquitecturabasemt.culture`); si no, la predeterminada del catálogo. La aplica i18n y la leen con `useEffectiveCulture` los formatos, el catálogo y el `Accept-Language` de `httpClient`. Para un texto que falta, la caída es cultura pedida → `FallbackCulture` → cultura por defecto.
- Los errores del backend llegan traducidos; en el front solo se traducen los `code` que llevan un texto propio.

## Prohibido
- Literales en JSX (`<Button>Guardar</Button>`).
- Claves en un solo idioma.
- Nombres de monedas, países, zonas o tipos fiscales en archivos de i18n o arrays de código: pertenecen a los datos de referencia.
- Textos que nadie pidió: ayudas bajo cada campo, bajadas de diálogo, notas al pie.
- Concatenar traducciones para armar frases.
- Decir "Activar" o "Administrador general" en lugar de los términos del vocabulario.

## Copiá de
- `src/locales/es/roles.json` (E4)

## Lo verifica
- `parity.test.ts` (E1): mismas claves en todos los idiomas habilitados del catálogo (es y en al inicio).
- `keys.test.ts` (E5): cada clave escrita en el código existe en los textos; una clave inexistente se vería cruda en pantalla.
- `referenceData.test.ts` (E1): nombres traducidos provenientes del catálogo.
- `i18n.test.tsx` (E7): la precedencia de la cultura efectiva (`resolveCulture`); `useFormat.account.test.tsx` (E7): con la cultura de la cuenta distinta de la de este navegador, la usan los textos, los formatos, el catálogo y `Accept-Language`.
- `oxlint` con la regla de literales en JSX (E0, `react/jsx-no-literals`).

## Detalle
[frontend.md §4, "Idioma y cultura"](../architecture/frontend.md#idioma-y-cultura) · [datos de referencia del back](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md#5-traducciones-de-la-interfaz-no-son-datos-de-referencia)
