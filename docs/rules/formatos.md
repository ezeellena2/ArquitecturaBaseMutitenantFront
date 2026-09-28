# Formatos (fechas, números, moneda, porcentajes, vacíos)

**Regla:** todo dato se **muestra** con `shared/ui/format` y se **carga** con `shared/ui/fields`. Solo `shared/format` formatea. Así una fecha o un monto se ven igual en todas las pantallas y en todas las culturas.

## Cómo se hace
- **En una tabla:** la columna declara el tipo y `DataTable` resuelve el formato, la alineación (números a la derecha, `tabular-nums`), el vacío (`—`) y el tooltip:
  ```tsx
  { id: "createdAtUtc", header: t("createdAt"), type: "date", value: (r) => r.createdAtUtc, sortable: true }
  { id: "total", header: t("total"), type: "money", value: (r) => r.total }
  ```
- **En una ficha o un texto:** `<DateText value={x.createdAtUtc} kind="dateTime" />`, `<MoneyText value={x.total} />`, `<PercentText value={x.rate} />`, `<EnumText enum="UserStatus" value={x.status} />`, `<EmptyValue />`.
- **En un formulario:** `DateField` (fecha civil, sin zona), `DateTimeField` (convierte la zona efectiva a UTC), `MoneyField`, `NumberField`, `PercentField` (12,5 → 0.125) y `PhoneField` (→ `{ country, number }`; el back lo pasa a E.164).
- **Fuera de JSX** (por ejemplo, en el `aria-label` de un gráfico): `const f = useFormat(); f.money(x)`.
- **Estados:** `<StatusBadge enum="TenantStatus" value={s} />`; el tono (`success`, `warning`, `danger`, `neutral` o `pending`) sale de `statusTones.ts`, y sus colores, de los tokens de [tema.md](../architecture/tema.md).

## Prohibido
- `toLocaleString`, `toLocaleDateString`, `toFixed`, `Intl.*` o `new Date(...)` para mostrar, fuera de `shared/format` y `shared/time`.
- `"N/A"`, `"-"` o `0` para un dato que falta.
- Calcular montos o porcentajes en el front.
- Mostrar un enum sin traducir.

## Copiá de
- `src/areas/business/roles/columns.tsx` (E4) · `src/shared/ui/format/` (E1)

## Lo verifica
- `format-usage.test.ts`: formateo fuera de lugar.
- `formatters.test.ts`: recorre el mismo `format-cases.json` que el back, así los dos lados producen el mismo texto.
- `parsers.test.ts`.

## Detalle
**[architecture/formatos.md](../architecture/formatos.md)**: el catálogo completo, con ejemplos en es-AR y en-US.
