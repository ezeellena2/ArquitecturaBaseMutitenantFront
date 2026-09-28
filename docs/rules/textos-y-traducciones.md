# Textos y traducciones

**Regla:** todo texto sale de `src/locales/{es,en}/<namespace>.json`, con las mismas claves en los dos idiomas. Español rioplatense con voseo. "Tenant" nunca aparece.

## Cómo se hace
- Un namespace por módulo (`useTranslation("roles")`). Lo compartido va en `common:` y los enums en `enums:<Enum>.<Valor>`.
- Plurales con `_one` / `_other`; interpolación con `{{count}}`.
- Vocabulario: "Organización" (nunca tenant), "Dueño" (TenantAdmin; nunca "Administrador general"), "Administrador" (CompanyAdmin), "Personal" (el lado B2C, su espacio personal), "lado" (persona o empresa), "Empresa" (Company), "Usuario" (en Gestión de usuarios de la organización), "Miembro" (de una empresa), "Ingresá" (`/login`, la puerta de persona), "Ingresá como empresa" (`/login/empresa`, la puerta B2B), "Registrá tu empresa" (el alta B2B).
- Acciones sobre usuarios: "Deshabilitar" / "Habilitar" (nunca "Activar"), "Revocar invitación". El estado de quien pidió la baja de su cuenta es "Baja pedida".
- El idioma y el formato salen de la cultura de la cuenta (`es-AR` / `en-US`). El `Accept-Language` lo pone `httpClient`.
- Los errores del backend llegan traducidos; en el front solo se traducen los `code` que llevan un texto propio.

## Prohibido
- Literales en JSX (`<Button>Guardar</Button>`).
- Claves en un solo idioma.
- Textos que nadie pidió: ayudas bajo cada campo, bajadas de diálogo, notas al pie.
- Concatenar traducciones para armar frases.
- Decir "Activar" o "Administrador general" en lugar de los términos del vocabulario.

## Copiá de
- `src/locales/es/roles.json` (E4)

## Lo verifica
- `parity.test.ts`: mismas claves en es y en.
- `oxlint` con la regla de literales en JSX (Pendiente: E0, configurar `react/jsx-no-literals`).

## Detalle
[frontend.md §4, "Idioma y cultura"](../architecture/frontend.md#idioma-y-cultura)
