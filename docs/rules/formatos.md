# Formatos (fechas, números, moneda, porcentajes, vacíos)

**Regla:** todo dato se **muestra** con `shared/ui/format` y se **carga** con `shared/ui/fields`. Solo `shared/format` formatea. Así una fecha o un monto se ven igual en todas las pantallas y en todas las culturas.

## Cómo se hace
- **Origen de las opciones y patrones:** `shared/referenceData` lee todas las filas traducidas de los cinco catálogos de `GET /api/reference-data`, con `isEnabled`. Los selectores filtran las habilitadas y los formateadores consultan cualquier fila para mostrar valores existentes. `cultureProfiles.ts` adapta los patrones de `Cultures`; código y decimales (`MinorUnits`) vienen de `Currencies`, y el símbolo visible por cultura de `CurrencyTranslations.DisplaySymbol`. País, zona y tipo fiscal vienen de `Countries`, `TimeZones` y `TaxIdTypes`. En E1 el back los lee de JSON; en E2, de tablas. [Diseño canónico](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md).
- **Moneda:** al aplicar `CurrencyPattern`, insertar el espacio monetario de CLDR si un `DisplaySymbol` alfabético quedaría contiguo al número; símbolos gráficos como `$` respetan el patrón. Los casos compartidos fijan el resultado exacto en ambas culturas.
- **En una tabla:** la columna declara el tipo y `DataTable` resuelve el formato, la alineación (números a la derecha, `tabular-nums`), el vacío (`—`) y el tooltip:
  ```tsx
  { id: "createdAtUtc", header: t("createdAt"), type: "date", value: (r) => r.createdAtUtc, sortable: true }
  { id: "total", header: t("total"), type: "money", value: (r) => r.total }
  ```
- **En una ficha o un texto:** `<DateText value={x.createdAtUtc} kind="dateTime" />`, `<MoneyText value={x.total} />`, `<PercentText value={x.rate} />`, `<EnumText enum="UserStatus" value={x.status} />`, `<EmptyValue />`.
- **En un formulario:** `DateField` (fecha civil, sin zona), `DateTimeField` (convierte la zona efectiva a UTC), `MoneyField` + `CurrencySelect`, `NumberField`, `PercentField` (12,5 → 0.125) y `PhoneField` + `CountrySelect` (→ `{ country, number }`; el back lo pasa a E.164). `TimeZoneSelect`, `CultureSelect` y `TaxIdField` también leen el catálogo; muestran carga hasta recibir opciones. `TaxIdField` emite `{ type, number }` con `type = TaxIdTypes.Code` (por ejemplo, `AR-CUIT`).
- **Fuera de JSX** (por ejemplo, en el `aria-label` de un gráfico): `const f = useFormat(); f.money(x)`.
- **Estados:** `<StatusBadge enum="TenantStatus" value={s} />`; el tono (`success`, `warning`, `danger`, `neutral` o `pending`) sale de `statusTones.ts`, y sus colores, de los tokens de [tema.md](../architecture/tema.md).

## Prohibido
- `toLocaleString`, `toLocaleDateString`, `toFixed`, `Intl.*` o `new Date(...)` para mostrar, fuera de `shared/format` y `shared/time`. Los nombres de países vienen del catálogo, no de `Intl.DisplayNames` en el front.
- Arrays, `switch` o constantes de opciones de moneda, país, zona, cultura o tipo fiscal: son datos de referencia, no código.
- `"N/A"`, `"-"` o `0` para un dato que falta.
- Calcular montos o porcentajes en el front.
- Mostrar un enum sin traducir.

## Copiá de
- `src/areas/business/roles/columns.tsx` (E4) · `src/shared/ui/format/` (E1) · [datos de referencia](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md) §4

## Lo verifica
- `format-usage.test.ts` (E1): formateo fuera de lugar.
- `formatters.test.ts` (E1): recorre el mismo `format-cases.json` que el back; ambos lados producen el mismo texto en casos válidos y rechazan los casos con `error`.
- `referenceData.test.ts` (E1): selectores y patrones consumen catálogos, sin listas fijas.
- `parsers.test.ts` (E1).

## Detalle
**[architecture/formatos.md](../architecture/formatos.md)**: el catálogo completo, con ejemplos en es-AR y en-US.
