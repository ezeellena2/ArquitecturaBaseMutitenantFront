Cliente HTTP, errores y tipos OpenAPI. `generated/` contiene solo `schema.d.ts` generado; los alias van en `types.ts`.
Leé `docs/rules/datos-y-api.md` y `docs/rules/errores.md`; nunca edites el schema a mano.
`httpClient` solo transporta; los avisos globales y el 403 que bloquea la vista (`meta.blocksView`) viven en `queryClient`.
Corré `npm run contracts:check`, `contracts.test.ts`, `httpClient.test.ts` y `queryClient.test.ts`.
