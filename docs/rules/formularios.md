# Formularios

**Regla:** lo corto se edita en un **diálogo** y lo largo en una **pantalla propia**. Cada campo usa su field tipado de `shared/ui/fields` y el error del servidor se ubica en su campo.

## Cómo se hace
- **Diálogo:**
  - `Dialog` con título, campos en dos columnas si son más de cuatro, y botonera;
  - `useRestoreFocusOnClose`;
  - se monta solo mientras está abierto.
- **Pantalla:**
  - `Page` con `backTo`, `useUnsavedChangesGuard` y "Cambios sin guardar" en la cabecera;
  - el formulario a la izquierda y lo asignado a la derecha, como en el editor de roles.
- **Validación:** `react-hook-form` + `zod` cuando hay reglas; en un diálogo simple, un draft en `useState`. Los mensajes salen de i18n.
- **Campos:** `FormField` (rótulo, control, error, `aria-describedby`) + el field del tipo (`MoneyField`, `DateField`, `PercentField`…). El control más simple para cada dato: pocas opciones → `Select`; varias a la vez → `MultiSelect`.
- **Errores del servidor:** `applyApiErrorToForm`; lo general va en `<FormError>`.

## Prohibido
- Un diálogo sobre otro, o una tabla dentro de un diálogo.
- Paneles desplegables o filas que se expanden.
- Textos de ayuda que nadie pidió.
- `<input type="number">` para montos, o `<input type="date">` crudo.

## Copiá de
- `src/areas/business/roles/pages/RoleEditorPage.tsx` (E4) · `src/areas/business/users/components/InviteUserDialog.tsx` (E6)

## Lo verifica
- Tests de pantalla: el recorrido del diálogo y un error del servidor ubicado en su campo.
- `parsers.test.ts`.

## Detalle
[frontend.md §4, "UI y pantallas"](../architecture/frontend.md#ui-y-pantallas) · `docs/design/visual-baseline.md`
