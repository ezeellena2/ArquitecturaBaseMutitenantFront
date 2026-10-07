# Pantalla de configuración

Copiá Configuración y sus diálogos de Dominio de correo del lienzo vigente; «Agregar dominio» es `../components/AddDomainDialog.tsx`.
Los formularios usan catálogos y guardan con la versión de lo que se está editando (`useEditForm`), con el 409 de `useEditPage`.
El retiro del dominio conserva la protección de correos que ya estaban administrados.
Al guardar otra región, releé `currentUserQueryKey` cuando el país del catálogo difiera de `MeResponse.organizationCountryCode`: Empresas toma de ese perfil el tipo fiscal y no requiere permiso para leer Configuración.
