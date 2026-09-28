# Formatos: cómo se muestra cada dato en todo el sistema

> Documento canónico de presentación. **Todo** dato que ve el usuario (en pantalla, correo, WhatsApp o exportación) se formatea con estas reglas. En el front, solo `src/shared/format` formatea; en el back, solo `DisplayFormatter` (`backend.md` §18). Los patrones y opciones salen de los [datos de referencia](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md), no de listas en código. Los dos lados se prueban contra los mismos casos: `../ArquitecturaBaseMutitenant/docs/contracts/format-cases.json`.

## 1. De dónde salen la cultura, la zona y la moneda

| Preferencia | Orden de resolución | Por defecto |
|---|---|---|
| **Cultura** (idioma + región: `es-AR`, `en-US`) | cuenta del usuario → organización, en el acceso B2B (`TenantSettings.DefaultCulture`) → navegador, al registrarse | `es-AR` |
| **Zona horaria** (IANA) | cuenta → empresa de la pantalla → organización (en B2B) | `America/Argentina/Buenos_Aires` |
| **Moneda** | la que trae el dato; `TenantSettings.DefaultCurrency` solo para cargar un importe nuevo | `ARS` |

- La cultura decide dos cosas: el **idioma** de los textos (`es`) y el **formato** de fechas y números (`es-AR`).
- `useFormat()` resuelve las tres preferencias una sola vez y toma los patrones de `Cultures`, cargados por `shared/referenceData` desde `GET /api/reference-data`. Ningún componente lee preferencias ni arma patrones por su cuenta.
- **E1:** antes de `/api/me`, el proveedor toma los valores por defecto y sus relaciones del JSON de referencia (hoy `es-AR`, `America/Argentina/Buenos_Aires` y `ARS`) y la cultura guardada en `localStorage` (`arquitecturabasemt.culture`) si está habilitada. **E3:** conecta las preferencias de cuenta y organización a `/api/me`. No hay constantes ni listas de opciones en el componente.

## 2. Patrones de formato por cultura (datos, no código)

Los valores por defecto de `Intl` y de .NET **no alcanzan**. Por ejemplo, `Intl` con `es-AR` da "02:35 p. m.", y en Argentina se usa 24 h. Los patrones están en `cultures.json` en E1 y en `platform.Cultures` desde E2; `shared/format/cultureProfiles.ts` adapta esos datos sin un `switch` ni un perfil escrito por cultura. `DisplayFormatter` usa los mismos datos. Las filas siguientes son ejemplos del catálogo inicial:

| Regla | `es-AR` | `en-US` |
|---|---|---|
| Fecha | `27/09/2026` (dd/MM/yyyy) | `09/27/2026` (MM/dd/yyyy) |
| Hora | `14:35` (24 h) | `2:35 PM` (12 h) |
| Fecha y hora | `27/09/2026 14:35` (sin coma) | `09/27/2026 2:35 PM` |
| Fecha larga | `27 de septiembre de 2026` | `September 27, 2026` |
| Separador de miles / decimal | `.` / `,` | `,` / `.` |

Sumar una cultura significa agregar su fila y sus traducciones al catálogo, sus textos i18n y sus casos en `format-cases.json`; no se cambia un perfil en el código.

## 3. Catálogo de tipos

Cada tipo de dato tiene **un** formateador y **un** componente. Los ejemplos corresponden al 27/09/2026 17:35 UTC en Buenos Aires.

| Tipo | Contrato (API) | Componente / función | `es-AR` | `en-US` | Reglas |
|---|---|---|---|---|---|
| Fecha | instante UTC o `DateOnly` | `<DateText kind="date">` / `formatDate` | `27/09/2026` | `09/27/2026` | Los listados usan fecha; el tooltip muestra fecha y hora |
| Fecha y hora | instante UTC | `kind="dateTime"` | `27/09/2026 14:35` | `09/27/2026 2:35 PM` | Fichas, auditoría, detalles |
| Hora | instante o `TimeOnly` | `kind="time"` | `14:35` | `2:35 PM` | |
| Fecha larga | instante o `DateOnly` | `kind="long"` | `27 de septiembre de 2026` | `September 27, 2026` | Títulos, correos, documentos |
| Relativa | instante UTC | `kind="relative"` | `hace 5 minutos` | `5 minutes ago` | **Solo** en feeds de actividad y "último ingreso", y solo si pasaron menos de 7 días; si no, fecha. Siempre con tooltip absoluto |
| Rango | dos fechas | `<DateRangeText>` | `27/09/2026 – 03/10/2026` | `09/27/2026 – 10/03/2026` | Guion largo con espacios |
| Entero | número | `<NumberText>` / `formatInteger` | `1.234.567` | `1,234,567` | |
| Decimal | número | `<NumberText kind="decimal" digits={2}>` | `1.234,50` | `1,234.50` | Decimales **fijos** según el dato, declarados en la columna |
| Cantidad | número | `kind="quantity"` | `12,5` | `12.5` | De 0 a 3 decimales, sin ceros de más |
| Porcentaje | fracción (`0.125`) | `<PercentText>` | `12,5 %` | `12.5%` | Hasta 2 decimales. En es-AR lleva espacio antes del `%` (lo agrega el perfil) |
| Moneda | `{amount, currency}` | `<MoneyText>` | `$ 1.234,50` · `US$ 1.234,50` | `ARS 1,234.50` · `$1,234.50` | Los decimales (`MinorUnits`) salen de `Currencies`; el símbolo visible sale de `CurrencyTranslations.DisplaySymbol` para la cultura y se aplica con el patrón de `Cultures`. Si un símbolo alfabético queda pegado al número, se inserta el espacio monetario de CLDR; `$` conserva el patrón sin espacio. El nombre también viene traducido del catálogo. Si la moneda no es la de la cultura, se ve el código o el prefijo (US$) |
| Moneda negativa | ídem | ídem | `-$ 1.234,50` | `-ARS 1,234.50` | Nunca paréntesis. En rojo solo en reportes, con el token `--peligro` |
| Compacto | número | `kind="compact"` | `1,3 M` | `1.3M` | **Solo** en tarjetas de KPI, con tooltip del valor completo |
| Tamaño de archivo | bytes | `<FileSizeText>` | `1,5 MB` | `1.5 MB` | |
| Duración | segundos | `<DurationText>` | `2 h 15 min` | `2 h 15 min` | |
| Teléfono | E.164 | `<PhoneText>` / carga con `PhoneField` (país con bandera SVG, buscador, formato al escribir) | `011 15-2345-6789` (si es del país de la cultura) · `+598 94 123 456` | internacional | País, nombre y prefijo salen de `Countries`; `libphonenumber-js` valida y formatea. Detalle: [rules/telefonos.md](../rules/telefonos.md) |
| Zona horaria | ID IANA (`America/Argentina/Buenos_Aires`) | `<TimeZoneText>` / `TimeZoneSelect` | `Buenos Aires (GMT−3)` | `Buenos Aires (GMT−3)` | Nunca el ID crudo. La ciudad traducida sale de `GET /api/reference-data`; el desfase se calcula al mostrar, sin guardarlo. Selector por `SortOrder`, offset y ciudad |
| Idioma y región | `es-AR` | `<CultureText>` / `CultureSelect` | `Español (Argentina)` | `Spanish (Argentina)` | Nombre y opciones habilitadas salen del catálogo; nunca el código crudo |
| CUIT / id fiscal | salida API E6 `{ country: "AR", type: "AR-CUIT", number }`; entrada de `TaxIdField` `{ type, number }` (`type` = `TaxIdTypes.Code`, `number` sin separadores) | `<TaxIdText>` / carga con `TaxIdField` | `20-12345678-6` | `20-12345678-6` | El tipo, país, etiqueta y máscara salen de `TaxIdTypes`; el back valida que el país corresponda al tipo. En E1 el front valida con `stdnum`; el value object y la salida completa del back llegan en E6. Detalle: `../ArquitecturaBaseMutitenant/docs/rules/identificacion-fiscal.md` |
| Correo | texto normalizado (minúsculas) | texto; carga con `EmailField` | `juan@gmail.com` | `juan@gmail.com` | Trim y minúsculas al escribir; nunca se muestra con mayúsculas |
| Enum o estado | `"Active"` | `<EnumText enum="UserStatus">` / `<StatusBadge>` | `Activo` | `Active` | Clave i18n `enums.<Enum>.<Valor>`; el tono del estado sale de un mapa central (`statusTones.ts`) y sus colores, de [tema.md](tema.md) |
| Booleano | `true`/`false` | `<BooleanText>` | `Sí` / `No` | `Yes` / `No` | En tablas, una columna de estado va mejor como `StatusDot` |
| Vacío | `null` | `<EmptyValue>` | `—` | `—` | Raya larga en gris tenue (`--t3`), con `aria-label` "Sin dato". Nunca "null", "N/A", "-" ni `0` |
| Nombre / texto | texto | texto | tal cual | tal cual | Un texto largo se trunca con `…` y tooltip |

## 4. Reglas de uso

1. **Prohibido formatear fuera de `shared/format`.** Un test (`format-usage.test.ts`) recorre `src/` y falla si encuentra `toLocaleString`, `toLocaleDateString`, `toFixed`, `Intl.` o `new Date(` fuera de esa carpeta y de `shared/time`. Los nombres de países vienen del catálogo, no de `Intl.DisplayNames` en el front. El mismo test verifica que `libphonenumber-js` se importe solo en `shared/phone` y `shared/format`.
2. **Las columnas declaran el tipo, no el formato:**
   ```tsx
   { id: "createdAtUtc", header: t("createdAt"), type: "date", value: (r) => r.createdAtUtc }
   ```
   `DataTable` elige el componente, la alineación (**números, montos y porcentajes a la derecha**, con `tabular-nums`), el vacío y el tooltip.
3. **Las fichas y los formularios** usan los mismos componentes: `<DateText>`, `<MoneyText>` y el resto. Nunca un `format…()` suelto dentro de un JSX.
4. **Campos de entrada con la misma regla:** `DateField`, `DateTimeField`, `TimeField`, `NumberField`, `MoneyField`, `PercentField` y `PhoneField` en `shared/ui/fields`.
   - Aceptan lo que el usuario escribe en su cultura (`1.234,5`) y emiten el contrato de la API (`1234.5`; `0.125` para un 12,5 %; ISO en UTC para un instante, convertido desde la zona efectiva).
   - Un `DateField` de fecha civil emite `DateOnly` sin convertir zona.
   - `CurrencySelect`, `CountrySelect`, `TimeZoneSelect`, `CultureSelect` y los tipos de `TaxIdField` leen `shared/referenceData`. Mientras carga el catálogo muestran estado de carga; nunca traen un array local de opciones. `TaxIdField` emite `{ type, number }`, con `type = TaxIdTypes.Code` (por ejemplo, `AR-CUIT`), número sin separadores y validación `stdnum` en E1.
   - `EmailField` (trim y minúsculas al escribir) también vive en `shared/ui/fields`.
5. **El front no calcula dinero.** Solo muestra lo que llega; totales, impuestos y redondeos vienen del backend.
6. **Los errores y textos del backend** que llevan números o fechas ya vienen formateados por `DisplayFormatter`, en la cultura del `Accept-Language`.
7. **Accesibilidad:** las fechas se renderizan como `<time dateTime="ISO">`, y los montos llevan el código de moneda en `aria-label` cuando el símbolo es ambiguo.

## 5. Estructura

```
src/shared/format/
├── cultureProfiles.ts         adapta los patrones de Cultures; sin perfiles fijos en código
├── formatters.ts              formatDate, formatDateTime, formatTime, formatDateLong, formatRelative, formatDateRange,
│                              formatInteger, formatDecimal, formatQuantity, formatPercent, formatMoney, formatCompact,
│                              formatFileSize, formatDuration, formatPhone, formatTaxId, formatTimeZone, formatCulture, EMPTY
│                              (formatTimeZone toma la ciudad traducida del catálogo y calcula con Intl el desfase de hoy:
│                              "Buenos Aires (GMT−3)")
├── parsers.ts                 parseDecimal, parseMoney, parsePercent, parseDate (entrada del usuario → contrato)
├── useFormat.ts               proveedor E1: defaults del catálogo + cultura localStorage; /api/me en E3
├── statusTones.ts             estado → tono visual (success, warning, danger, neutral, pending); colores en tema.md
├── formatters.test.ts         recorre format-cases.json (los mismos casos que el back)
├── parsers.test.ts
└── format-usage.test.ts       prohíbe formatear fuera de shared/format
src/shared/time/
└── useEffectiveTimeZone.ts    [E3] cuenta → empresa → organización (en B2B)
src/shared/referenceData/
├── referenceData.ts           GET /api/reference-data: los cinco catálogos habilitados y traducidos
├── useReferenceData.ts        TanStack Query, staleTime: Infinity; ETag al revalidar
└── referenceData.test.ts      opciones del catálogo y estado de carga
src/shared/ui/format/
├── DateText.tsx · DateRangeText.tsx · NumberText.tsx · MoneyText.tsx · PercentText.tsx
├── FileSizeText.tsx · DurationText.tsx · PhoneText.tsx · TaxIdText.tsx · TimeZoneText.tsx · CultureText.tsx
└── EnumText.tsx · StatusBadge.tsx · BooleanText.tsx · EmptyValue.tsx
src/shared/ui/fields/
└── DateField.tsx · DateTimeField.tsx · TimeField.tsx · NumberField.tsx · MoneyField.tsx · PercentField.tsx · PhoneField.tsx
    · EmailField.tsx · TaxIdField.tsx · CurrencySelect.tsx · CountrySelect.tsx · TimeZoneSelect.tsx · CultureSelect.tsx
```
