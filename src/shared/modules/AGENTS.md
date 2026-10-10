# Contribuciones de módulos

Contrato neutral de rutas, navegación e inicio. No importa implementaciones de `modules/` ni APIs de un módulo.
`app/moduleComposition.ts` es la única composición concreta. El registro vacío conserva el núcleo.
Las guardas leen `/api/me` y se resuelven antes de montar un componente React.lazy; no usar route.lazy para módulos.
Cada módulo declara su política y sus permisos sin extender los catálogos de permisos del núcleo.
