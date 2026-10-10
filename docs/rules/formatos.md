# Formatos (fechas, números, moneda, porcentajes, vacíos)

**Regla:** todo dato se **muestra** con `shared/ui/format` y se **carga** con `shared/ui/fields`. Solo `shared/format` formatea. Así una fecha o un monto se ven igual en todas las pantallas y en todas las culturas.

## Cómo se hace
- **Origen de las opciones y patrones:** `shared/referenceData` lee todas las filas traducidas de los cinco catálogos de `GET /api/reference-data`, con `isEnabled`. Los selectores filtran las habilitadas y los formateadores consultan cualquier fila para mostrar valores existentes. `cultureProfiles.ts` adapta los patrones de `Cultures`; código y decimales (`MinorUnits`) vienen de `Currencies`, y el símbolo visible por cultura de `CurrencyTranslations.DisplaySymbol`. País, zona y tipo fiscal vienen de `Countries`, `TimeZones` y `TaxIdTypes`. En E1 el back los lee de JSON; en E2, de tablas. [Diseño canónico](../../../ArquitecturaBaseMutitenant/docs/architecture/datos-de-referencia.md).
- **Moneda:** al aplicar `CurrencyPattern`, insertar el espacio monetario de CLDR si un `DisplaySymbol` alfabético quedaría contiguo al número; símbolos gráficos como `$` respetan el patrón. Los casos compartidos fijan el resultado exacto en ambas culturas.
- **Redondeo visible:** el signo se decide después de redondear (un importe negativo mostrado como cero no lleva menos). Compactos y tamaños pasan a la unidad siguiente cuando el número redondeado alcanza mil; los casos de `format-cases.json` fijan esos límites en ambas culturas.
- **Offset horario:** `formatTimeZone` calcula el offset con una cultura fija de `Intl` para obtener un signo y prefijo interpretables; la ciudad visible siempre viene traducida del catálogo. No se interpreta el texto localizado de `Intl` en la cultura del usuario.
- **Entrada decimal:** `shared/format/parsers.ts` admite como máximo 15 dígitos significativos y comprueba que `Number` recomponga el valor canónico leído. Si perdería precisión, el field conserva el texto, emite `null` y marca invalidez; nunca envía un importe redondeado silenciosamente.
- **En una tabla:** la columna declara el tipo y `DataTable` resuelve el formato, la alineación (números a la derecha, `tabular-nums`), el vacío (`—`) y el tooltip:
  ```tsx
  { id: "createdAtUtc", header: t("createdAt"), type: "date", value: (r) => r.createdAtUtc, sortable: true }
  { id: "total", header: t("total"), type: "money", value: (r) => r.total }
  ```
- **En una ficha o un texto:** `<DateText value={x.createdAtUtc} kind="dateTime" />`, `<MoneyText value={x.total} />`, `<PercentText value={x.rate} />`, `<EnumText enum="UserStatus" value={x.status} />`, `<EmptyValue />`.
- **En un formulario:** `DateField` (fecha civil, sin zona), `DateTimeField` (convierte la zona efectiva a UTC), `MoneyField` + `CurrencySelect`, `NumberField`, `PercentField` (12,5 → 0.125) y `PhoneField` + `CountrySelect` (→ `{ country, number }`; el back lo pasa a E.164). `TimeZoneSelect`, `CultureSelect` y `TaxIdField` también leen el catálogo; muestran carga hasta recibir opciones. `TaxIdField` emite `{ type, number }` con `type = TaxIdTypes.Code` (por ejemplo, `AR-CUIT`).
- **Fecha corta** (lienzo v99): **solo en las listas del teléfono** y solo para el año en curso, la fecha va sin el año: `<DateText kind="shortDate" />` («27/09»; en en-US, «09/27») o `kind="shortDateTime"` («27/09 10:42»). La de otro año va completa, y en la compu, en las fichas y en los textos siempre lleva el año. `useFormat` la da (`formatShortDate`, `formatShortDateTime`): sale del patrón de la cultura sin el año, y el año en curso es el de la zona de la persona.
- **Fuera de JSX** (por ejemplo, en el `aria-label` de un gráfico): `const f = useFormat(); f.money(x)`.
- **Estados:** cada feature registra los tonos de sus estados con el enum del contrato y el color del lienzo para cada valor: `defineStatusTones("CompanyStatus", { Active: "success", Inactive: "neutral" })` (`statusTones.ts`; TypeScript pide un tono por valor). Se muestran con `<StatusBadge tones={companyStatusTones} value={c.status} />` o, en una tabla, con la columna `type: "status"` y sus `tones`: la palabra sale de `enums.<Enum>.<Valor>` y el color de cada tono (`success`, `warning`, `danger`, `neutral` o `pending`), de los tokens de [tema.md](../architecture/tema.md). Cuando la palabra va dentro de otro texto con su letra (el estado de la Página pública en la banda, un dominio de Configuración en el teléfono), va solo el punto: `<StatusMark tones={domainStatusTones} value={domain.status} />`. Un estado que muestran dos features se registra una sola vez, en `shared/format/statusTones.ts`: el de la Página pública (`publicPageStateTones`), que usan su ficha y su tarjeta del Inicio. Ninguna pantalla escribe un color de estado ni elige un tono suelto.

La entrada de tarifas técnicas de IA usa `MoneyField precision="technical-tariff"` (ADR 0051): conserva hasta seis decimales en edición y rechaza siete, siempre con una moneda habilitada del catálogo. El parser y la presentación editable permanecen centrales. El valor predeterminado del field, los presupuestos, `MoneyText` y `DataTable` conservan `MinorUnits`. `MoneyField.test.tsx` verifica blur, escala excesiva y el comportamiento monetario ordinario.

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
- `statusTones.test.ts` (E7): los tonos se registran con el enum del contrato, cada enum una sola vez, y Usuarios, Empresas, la Página pública, Configuración y la tarjeta de la Página pública del Inicio (`HomeCards`) no escriben un color de estado; `StatusBadge.test.tsx` (E7): la palabra del enum y el punto de su tono, y `StatusMark`, solo el punto.
- `formatters.test.ts` (E1): recorre el mismo `format-cases.json` que el back; ambos lados producen el mismo texto en casos válidos y rechazan los casos con `error`. La fecha corta, en es-AR y en-US, con el año en curso, con otro año y en el cambio de año de la zona (E7).
- `DateText.test.tsx` (E7): `shortDate` y `shortDateTime`, con la fecha completa en el tooltip; `UsersPage.test.tsx` y `AuditPage.test.tsx` (E7): las listas del teléfono usan la fecha corta.
- `referenceData.test.ts` (E1): selectores y patrones consumen catálogos, sin listas fijas.
- `parsers.test.ts` (E1): precisión representable y rechazo del valor que `Number` redondearía; `MoneyField.test.tsx` comprueba que no se envía ese importe.

## Detalle
**[architecture/formatos.md](../architecture/formatos.md)**: el catálogo completo, con ejemplos en es-AR y en-US.
