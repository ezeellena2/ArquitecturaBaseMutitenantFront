# Teléfonos

**Regla:** un teléfono se **carga** siempre con `PhoneField` (país con bandera + número) y se **muestra** siempre con `PhoneText`. El dato que llega de la API está en E.164 (`+5491123456789`). **Quien decide si es válido es el backend.**

## Cómo se hace

### `PhoneField` (en `shared/ui/fields`)
```
┌──────────────────────┐ ┌──────────────────────────────┐
│ [🇦🇷 SVG] AR +54   ▾ │ │ 11 2345-6789                 │
└──────────────────────┘ └──────────────────────────────┘
```
- **Selector de país:** un combobox con buscador (por nombre, código ISO o prefijo: "arg", "AR" o "+54"). Cada fila lleva bandera SVG, nombre traducido y prefijo.
  - Arriba van los **países frecuentes** (`AR`, `UY`, `CL`, `PY`, `BR`, `BO`, `PE`, `MX`, `ES`, `US`; configurable en `shared/phone/priorityCountries.ts`), después una línea y **todos los demás**, ordenados por nombre en el idioma actual.
- **La lista completa sale de `libphonenumber-js`** (`getCountries()` y `getCountryCallingCode()`), y los nombres, de `Intl.DisplayNames(cultura, { type: "region" })`. No hay una lista escrita a mano que mantener.
- **Banderas:** `country-flag-icons` (SVG 3:2), cargadas solo cuando se abre el selector. **Nunca emojis:** Windows no los dibuja.
- **País por defecto:** el del número si ya hay uno; si no, el de la región de la cultura (`es-AR` → AR); si no, el de la organización.
- **Mientras escribe:** `AsYouType(país)` formatea en vivo (`11 2345-6789`). Si pega un número con `+` (`+54 9 11 …`), el país se detecta y el selector cambia solo.
- **Uso:**
  - `usage="whatsapp"` muestra solo los países del canal `whatsapp` que devuelve `GET /api/auth/methods` en `channels` (`[{ key: "whatsapp", countries: [...] }]`; los aporta el módulo de WhatsApp);
  - `usage="mobile"` y `usage="any"` muestran todos.
- **Validación en vivo** (solo guía): `isValidPhoneNumber`. El error definitivo lo manda el backend (`Users.Phone.*`, o el del módulo de WhatsApp sobre el campo `phone` si el país no está habilitado) y lo ubica `applyApiErrorToForm`.
- **Qué emite:** `{ country: "AR", number: "11 2345-6789" }`, que es lo que espera el contrato.
- **Accesibilidad:** el selector se anuncia como "País: Argentina, +54", no "AR +54".

### `PhoneText` (en `shared/ui/format`)
- Si el número es **del país de la cultura**, formato **nacional** (`011 15-2345-6789`); si es de otro país, **internacional** (`+598 94 123 456`).
- Opcional: `link="tel"` o `link="whatsapp"` (`https://wa.me/<dígitos>`), como acción de fila o de ficha.
- Sin número: `—` (`EmptyValue`).
- En tablas, `type: "phone"` en la columna.

## Prohibido
- Un `<input type="tel">` suelto, o una lista de países escrita a mano.
- Emojis de banderas.
- Mandar al backend el número ya "limpio", armado por el front (manda país + número tal cual).
- Mostrar el E.164 crudo.
- `libphonenumber-js` fuera de `shared/phone` y `shared/format`.

## Copiá de
- `../ArquitecturaBaseFront/src/shared/ui/PhoneField.tsx`: la accesibilidad del selector se conserva; la lista fija de 14 países se reemplaza.

## Lo verifica
- `PhoneField.test.tsx` (E1): busca por nombre y por prefijo, detecta el país al pegar y formatea mientras se escribe; el filtro de países WhatsApp se prueba desde E8.
- `formatters.test.ts` (E1): los casos de teléfono de `format-cases.json`, los mismos que el back.
- `format-usage.test.ts` (E1): `libphonenumber-js` solo en su lugar e `Intl.DisplayNames` en `shared/phone` solo para nombres de países.

## Detalle
[formatos.md](../architecture/formatos.md) · back: `../ArquitecturaBaseMutitenant/docs/rules/telefonos.md`
