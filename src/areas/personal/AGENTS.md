Acceso personal B2C de la cuenta. Leé [personal](../../../docs/rules/personal.md), [accesos](../../../docs/rules/accesos-y-permisos.md) y la [ficha funcional Personal del back](../../../../ArquitecturaBaseMutitenant/docs/features/personal.md).
El espacio personal no muestra organizaciones ni acciones de crear empresa.
Las features se separan en carpetas y comparten piezas solo desde `shared/`.
Una entrada real con `feature` en `layouts/navigation/personal.ts` suma el módulo al menú y barra; `visibleNavigation` es el único filtro. La barra tiene hasta cuatro secciones y Más.
