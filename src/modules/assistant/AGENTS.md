# Asistente opcional
Sólo `app/moduleComposition.ts` importa el registro concreto; el núcleo recibe contribuciones neutrales de `shared/modules`, sin importar APIs o pantallas de este módulo.
Leé las reglas de [estructura](../../../docs/rules/estructura-y-features.md), [datos y API](../../../docs/rules/datos-y-api.md), [errores](../../../docs/rules/errores.md), [formatos](../../../docs/rules/formatos.md) y [tests](../../../docs/rules/tests.md).
Copiá los tableros aprobados Asistente/Asistente-Config y sus M-*; las ADR y correcciones humanas posteriores gobiernan la conducta. Chat, Configuración y política por organización están publicados; Uso espera su contrato implementado.
Tipos HTTP generados, MSW en tests, catálogo de modelos por modo desde la API y topes de adjuntos desde State; no inventes proyecciones, TextLimits, rutas ni códigos.
Cada operación pertenece a acceso/organización/persona/conversación. Salir, revocar o limpiar caché retira cuerpos, claves, bytes y callbacks; Retry de red conserva cuerpo y clave, Failed crea otra operación con copias nuevas de sus adjuntos.
Usá los componentes y adaptadores públicos de assistant-ui; el SDK presenta la UI y los endpoints existentes conservan la admisión, versiones y flujo SSE. Verifican composición, límites de módulos, runtime, stream y ajustes; una sola puerta completa sobre el corte fijo.
