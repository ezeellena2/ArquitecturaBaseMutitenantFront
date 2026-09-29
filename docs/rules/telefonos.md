# Teléfonos

**Regla:** un teléfono se **carga** siempre con `PhoneField` (país con bandera + número) y se **muestra** siempre con `PhoneText`. El dato que llega de la API está en E.164 (`+5491123456789`). **Quien decide si es válido es el backend.**

## Cómo se hace

### `PhoneField` (en `shared/ui/fields`)
```
┌──────────────────────┐ ┌──────────────────────────────┐
│ [🇦🇷 SVG] AR +54   ▾ │ │ 11 2345-6789                 │
└──────────────────────┘ └──────────────────────────────┘
```
- **Selector de país:** `CountrySelect` vive en `shared/ui/fields` y es un combobox con buscador (por nombre, código ISO o prefijo: "arg", "AR" o "+54"). Cada fila lleva bandera SVG, nombre traducido y prefijo.
  - Las opciones habilitadas vienen de `shared/referenceData` (`GET /api/reference-data`), con `Name`, `CallingCode` y `SortOrder` del catálogo `Countries`. Las destacadas se ordenan por `SortOrder` y las demás por nombre traducido; no existe `priorityCountries.ts` ni una lista de códigos en el front.
- `libphonenumber-js` valida y formatea números y prefijos; **no** define la lista de países ni sus nombres de pantalla. Mientras llega el catálogo, el selector muestra estado de carga.
- **Banderas:** `country-flag-icons` (SVG 3:2), cargadas solo cuando se abre el selector. Si falla la importación, se muestra el código del país con `role="img"` y el nombre traducido como etiqueta accesible, sin derribar el formulario. **Nunca emojis:** Windows no los dibuja.
- **País por defecto:** el del número si ya hay uno; si no, el `CountryCode` de la cultura efectiva (hoy `es-AR` → AR); si no, el de la organización. Todas esas relaciones vienen del catálogo.
- **Mientras escribe:** `AsYouType(país)` formatea en vivo (`11 2345-6789`). Si pega un número con `+` (`+54 9 11 …`), el país se detecta y el selector cambia solo.
- **Uso:**
  - `usage="whatsapp"` muestra solo los países del canal `whatsapp` que devuelve `GET /api/auth/methods` en `channels` (`[{ key: "whatsapp", countries: [...] }]`; los aporta el módulo de WhatsApp);
  - `usage="mobile"` y `usage="any"` muestran todos.
- **Validación en vivo** (solo guía): `isValidPhoneNumber`. El error definitivo lo manda el backend (`Users.Phone.*`, o el del módulo de WhatsApp sobre el campo `phone` si el país no está habilitado) y lo ubica `applyApiErrorToForm`.
- **Qué emite:** `{ country: "AR", number: "11 2345-6789" }`, que es lo que espera el contrato.
- **Accesibilidad:** el selector se anuncia como "País: Argentina, +54", no "AR +54".

### `PhoneText` (en `shared/ui/format`)
- Si el número es **del `CountryCode` de la cultura**, formato **nacional** (`011 15-2345-6789`); si es de otro país, **internacional** (`+598 94 123 456`). El texto exacto se fija en `format-cases.json` y coincide con el back.
- Opcional: `link="tel"` o `link="whatsapp"` (`https://wa.me/<dígitos>`), como acción de fila o de ficha.
- Sin número: `—` (`EmptyValue`).
- En tablas, `type: "phone"` en la columna.

## Prohibido
- Un `<input type="tel">` suelto, o una lista fija de países, prefijos o prioridades en el código.
- Emojis de banderas.
- Mandar al backend el número ya "limpio", armado por el front (manda país + número tal cual).
- Mostrar el E.164 crudo.
- `libphonenumber-js` fuera de `shared/phone` y `shared/format`.

## Copiá de
- `../ArquitecturaBaseFront/src/shared/ui/PhoneField.tsx`: la accesibilidad del selector se conserva; sus opciones se reemplazan por `Countries` del catálogo.
- [Datos de referencia del back](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md) §4: origen y orden de las opciones.

## Lo verifica
- `PhoneField.test.tsx` (E1): busca por nombre y por prefijo, detecta el país al pegar y formatea mientras se escribe; el filtro de países WhatsApp se prueba desde E8.
- `countries.test.ts` (E1) y `referenceData.test.ts` (E1): las opciones habilitadas y su orden salen del catálogo, sin códigos fijos.
- `formatters.test.ts` (E1): los casos de teléfono de `format-cases.json`, los mismos que el back.
- `format-usage.test.ts` (E1): `libphonenumber-js` solo en su lugar y ningún nombre de país armado con `Intl.DisplayNames` en el front.

## Detalle
[formatos.md](../architecture/formatos.md) · back: `../ArquitecturaBaseMutitenant/docs/rules/telefonos.md`
