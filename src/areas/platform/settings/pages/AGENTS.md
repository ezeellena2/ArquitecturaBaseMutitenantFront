# Pantalla de Configuración de Plataforma
Leé formularios, pantallas-y-ui, responsive, accesibilidad y tests; copiá SettingsPage y ReasonDialog.
Dos Sections Registro y altas/Contacto; móvil Administración constante y acciones fijas de Page.
Validación exacta del tablero: entero 1..50 y regex de correo; errores debajo sin mandar HTTP.
409 de guardado cierra motivo y pasa a useEditPage/ConcurrencyBanner; Ver lo nuevo exige lectura válida.
useEditPage único blocker; observar router.state.blockers vivo abandona confirmación sin perder RHF.
ReasonDialog literal; callbacks de su Mutation exacta por identidad de variables llevan guarda local.
WeakMap sólo de callbacks originales; reaplicar setOptions tras observerOptionsUpdated y al terminar, sin recursión.
