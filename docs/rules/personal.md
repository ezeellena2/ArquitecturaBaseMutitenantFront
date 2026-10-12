# Personal: módulos B2C e interacción con empresas

**Regla:** el lado Personal usa el espacio Consumer del token. Comparte la identidad con Business, sin compartir datos ni permisos. La plantilla aporta Inicio, Mi cuenta y la mecánica; cada producto agrega sus módulos reales. La receta funcional y de persistencia está en [Personal del back](../../../ArquitecturaBaseMutitenant/docs/features/personal.md).

## Cómo se hace
- El módulo B2C de un producto va en `src/areas/personal/<módulo>/`, con las carpetas de [estructura y features](estructura-y-features.md) que necesita, como dice la ficha Personal del back. No es un módulo quitable: esos, como el asistente, van en `src/modules/<nombre>/` con su `registration.ts` (estructura y features, «Módulos opcionales»). Copiá Roles para API tipada, Query, listados, concurrencia e idempotencia; no importes una feature Business para acceder a sus datos.
- La ruta privada se monta bajo `AccessRoute access="consumer"`. Su enlace declara `path`, `labelKey`, `icon` y, si es opcional, `feature` en `layouts/navigation/personal.ts`. `visibleNavigation` usa `usePermissions().hasFeature` una sola vez: el menú y la barra toman la misma lista visible. La ruta usa `RequirePermission` para su gate, sin inventar permisos ni roles Consumer.
- En el teléfono, Inicio y los módulos visibles ocupan hasta cuatro secciones, más Más. Todos los módulos visibles se pueden abrir desde el grupo Secciones de Más, incluidos los que no entran en la barra. Mi cuenta conserva `/cuenta`; Inicio conserva `/`. No se agregan módulos ni enlaces ficticios para demostrar la receta.
- El servidor recibe el espacio privado sólo desde `tenant_id`. La API sin sesión responde 401; Business en una ruta Consumer responde 403 por acceso equivocado; un dato de otra persona responde 404. Un módulo apagado responde 404. Ocultar el enlace mejora la experiencia y nunca reemplaza estas barreras.
- Lo publicado vive en `areas/storefront/<módulo>/`; una bandeja de la organización vive en Business. El host resuelve sólo la contraparte pública. El alta de una interacción pide Consumer y publicación en el backend; no elige el espacio personal ni la organización desde el body. El lado Business requiere su permiso real.
- El backend conserva una copia mínima de la interacción, aplica `PartyPolicy` y decide su baja/retención: reemplaza la copia personal inmediatamente o al vencer la política legal, conservando el registro de negocio y el aislamiento. El front no lee la cuenta ajena ni deduce «Cuenta eliminada» de un nombre nulo; usa el estado y texto del contrato. Ver [datos personales](../../../ArquitecturaBaseMutitenant/docs/rules/datos-personales.md).

## Prohibido
- Mostrar organizaciones o «crear empresa» dentro del espacio Personal.
- Guardar un tenant en la URL, body o estado para cambiar el alcance privado.
- Agregar permisos, roles, features o pantallas de negocio productivas para una prueba.
- Importar features entre Personal, Business o Storefront; lo común sube a `shared/`.
- Implementar retención o autorización de partes en el cliente.

## Copiá de
- `src/areas/business/roles/` (E4): flujo tipado y piezas compartidas; la conducta pertenece al acceso Consumer.
- `src/layouts/navigation/personal.ts` y `src/layouts/navigation/visible.ts` (E7): una entrada con feature y el filtro central.
- `src/layouts/PrivateLayoutFrame.tsx` y `src/layouts/MorePage.tsx` (E7): barra limitada y todas las secciones visibles en Más.
- `src/areas/storefront/site/pages/PublicPage.tsx` (E7): publicación y CTA Consumer, sin administración.

## Lo verifica
- `structure.test.ts` (E0)

## Detalle
[frontend.md §3](../architecture/frontend.md#3-rutas) · [accesos y permisos](accesos-y-permisos.md) · [Personal del back](../../../ArquitecturaBaseMutitenant/docs/features/personal.md)
