# Tests compartidos

Acá van el setup, arnés y verificaciones transversales; los tests de piezas van junto a cada pieza.
Leé [tests](../../docs/rules/tests.md), [accesibilidad](../../docs/rules/accesibilidad.md) y [arnés](../../docs/architecture/arnes.md).
`HarnessStage.ts` lista las etapas cerradas (`ClosedStages`) y se actualiza en la puerta de cada etapa; `mocks/currentUsers.ts` tiene los fixtures de `/api/me` y `visualApp.tsx` es el arnés visual de las capturas.
