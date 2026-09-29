Zona horaria efectiva para mostrar instantes UTC. Leé `docs/architecture/frontend.md` «Fechas y zona» y `docs/architecture/formatos.md` §1.
`useEffectiveTimeZone` consume la zona efectiva de `/api/me` en 3a.
La prioridad cuenta → empresa → organización o navegador está probada en `useEffectiveTimeZone.test.tsx`.
