// Inventario factual para la prueba completa local. No ejecuta ni certifica casos.
// Las fuentes y los IDs son trazables; no se infiere cobertura por coincidir una URL.

export const inventoryMetadata = {
  "guideVersion": "versión 134 · 20 de octubre de 2026",
  "scope": "Etapas 0–9 y 11; formularios E12–17 y despliegue Azure excluidos.",
  "coverageMeaning": "Inventario factual, sin ejecución. existingCaseIds usa los IDs exactos del informe de recorrido; existingE2EGroups sólo ubica grupos existentes. Compartir ruta no implica compartir acción.",
  "guideCodeStatus": "Se omite CODIGO como prueba de implementación: su comentario está fechado 2026-10-04.",
  "counts": {
    "chapters": 10,
    "screens": 52,
    "boards": 179,
    "guidedFlows": 28,
    "guidedCases": 114,
    "existingBaselineSteps": 98,
    "excludedGuidedFlows": 10
  },
  "excludedSources": [
    "docs/design/recorridos/aprobar-o-rechazar.json",
    "docs/design/recorridos/armar-las-reglas.json",
    "docs/design/recorridos/armar-un-catalogo.json",
    "docs/design/recorridos/armar-una-plantilla.json",
    "docs/design/recorridos/catalogo-con-filtros.json",
    "docs/design/recorridos/el-asistente-en-el-chat.json",
    "docs/design/recorridos/mandar-un-formulario.json",
    "docs/design/recorridos/publicar-un-formulario.json",
    "docs/design/recorridos/revisar-las-respuestas.json",
    "docs/design/recorridos/usar-una-plantilla.json"
  ],
  "routeSources": [
    "src/app/routes.tsx",
    "src/layouts/navigation/business.ts",
    "src/layouts/navigation/platform.ts",
    "src/modules/assistant/registration.ts",
    "src/modules/whatsapp/*/routes.ts"
  ],
  "fixturePolicy": "Las frases del lienzo son citas descriptivas, nunca datos para ejecutar: los runners deben sustituir nombres/correos/teléfonos por datos sintéticos @example.test y el canal controlado."
};

export const screens = [
  {
    "id": "portada",
    "chapter": "llega",
    "title": "Portada",
    "route": "/",
    "boards": [
      "Landing",
      "Landing-Movil"
    ],
    "actors": [
      "Lucía · persona · web",
      "Mariana · persona · web"
    ],
    "actions": [
      "Qué es el servicio, las dos puertas («Ingresá» y «Ingresá como empresa») y la sección «Empresas en ArquitecturaBase», que es de la Etapa 7.",
      "Toca «Ingresar» en la barra de arriba.",
      "Toca «Registrá tu empresa».",
      "Toca «Crear mi cuenta»."
    ],
    "source": "docs/design/guia/recorrido.py:18",
    "actualRoutes": [
      "/"
    ],
    "area": "public",
    "chapterTitle": "Llega al sitio",
    "stage": "3 y 7",
    "existingCaseIds": [
      "01",
      "26"
    ],
    "guidedCaseIds": [
      "GUIA-ingresar-como-persona-01",
      "GUIA-registrar-empresa-01",
      "GUIA-registrarse-01"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "directorio",
    "chapter": "llega",
    "title": "Directorio de empresas",
    "route": "/empresas",
    "boards": [
      "Directorio",
      "M-Directorio"
    ],
    "actors": [
      "Mariana · persona · web"
    ],
    "actions": [
      "Las organizaciones que publicaron su página, en tarjetas, con buscador y paginado.",
      "Busca por nombre y toca la tarjeta de la organización."
    ],
    "source": "docs/design/guia/recorrido.py:20",
    "actualRoutes": [
      "/empresas"
    ],
    "area": "public",
    "chapterTitle": "Llega al sitio",
    "stage": "7",
    "existingCaseIds": [
      "27"
    ],
    "guidedCaseIds": [
      "GUIA-publicar-y-encontrar-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "pagina-publica",
    "chapter": "llega",
    "title": "Página de una organización",
    "route": "delta.plataforma.com",
    "boards": [
      "Pagina-Publica",
      "M-Pagina-Publica"
    ],
    "actors": [
      "Mariana · persona · web"
    ],
    "actions": [
      "Una tarjeta con el logo, el nombre, la descripción y el contacto. Ingresar desde acá vuelve a la misma página.",
      "Toca «Ingresá para continuar».",
      "Ve la página con su sesión iniciada."
    ],
    "source": "docs/design/guia/recorrido.py:22",
    "actualRoutes": [
      "https://:slug.:publicHost/"
    ],
    "area": "public",
    "chapterTitle": "Llega al sitio",
    "stage": "7",
    "existingCaseIds": [
      "28",
      "29",
      "30"
    ],
    "guidedCaseIds": [
      "GUIA-publicar-y-encontrar-04",
      "GUIA-publicar-y-encontrar-06"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "legal",
    "chapter": "llega",
    "title": "Términos y privacidad",
    "route": "/terminos · /privacidad",
    "boards": [
      "Legal",
      "M-Legal"
    ],
    "actors": [
      "Visitante sin sesión"
    ],
    "actions": [
      "La versión vigente de cada documento."
    ],
    "source": "docs/design/guia/recorrido.py:24",
    "actualRoutes": [
      "/terminos",
      "/privacidad"
    ],
    "area": "public",
    "chapterTitle": "Llega al sitio",
    "stage": "3",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "ingreso",
    "chapter": "entra",
    "title": "Ingresá",
    "route": "/login · /login/empresa",
    "boards": [
      "Ingreso",
      "M-Ingreso"
    ],
    "actors": [
      "Lucía · Dueña · web",
      "Lucía · persona · web",
      "Mariana · persona · web",
      "Martín · operador · web",
      "Valentina · invitada · web"
    ],
    "actions": [
      "Las dos puertas, el código, Google y todos los errores. Los estados de WhatsApp son de la Etapa 8 y los del operador, de la 9.",
      "Ve «No hay una cuenta con ese correo.» y toca «Crear mi cuenta».",
      "Escribe lucia.fernandez@delta.ejemplo.com y toca «Enviar código».",
      "Escribe el código que le llegó y toca «Verificar».",
      "Toca «Ingresar con Google» y elige su cuenta en Google.",
      "Elige WhatsApp, escribe su número y toca «Enviar código».",
      "Escribe el código y toca «Verificar».",
      "Escribe valentina.ruiz@gmail.com y toca «Enviar código».",
      "Escribe su correo de operador y toca «Enviar código».",
      "Toca «Ir a Plataforma».",
      "Escribe el código del autenticador y toca «Verificar».",
      "Escribe mariana.lopez@gmail.com y sigue con el código."
    ],
    "source": "docs/design/guia/recorrido.py:28",
    "actualRoutes": [
      "/login",
      "/login/empresa"
    ],
    "area": "identity",
    "chapterTitle": "Entra o crea su cuenta",
    "stage": "3, 8 y 9",
    "existingCaseIds": [
      "01",
      "04",
      "13",
      "21",
      "22",
      "23",
      "24",
      "29",
      "E8-02",
      "E8-04"
    ],
    "guidedCaseIds": [
      "GUIA-correo-sin-cuenta-01",
      "GUIA-ingresar-como-persona-02",
      "GUIA-ingresar-como-persona-03",
      "GUIA-ingresar-con-google-01",
      "GUIA-ingresar-por-whatsapp-01",
      "GUIA-ingresar-por-whatsapp-03",
      "GUIA-invitar-y-aceptar-04",
      "GUIA-invitar-y-aceptar-05",
      "GUIA-operador-en-la-puerta-publica-01",
      "GUIA-operador-en-la-puerta-publica-02",
      "GUIA-operador-en-la-puerta-publica-03",
      "GUIA-operador-en-la-puerta-publica-04",
      "GUIA-publicar-y-encontrar-05"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "registro",
    "chapter": "entra",
    "title": "Crear cuenta",
    "route": "/registro",
    "boards": [
      "Registro",
      "M-Registro"
    ],
    "actors": [
      "Mariana · persona · web"
    ],
    "actions": [
      "Alta de una persona con correo, WhatsApp o Google, con la casilla de los términos.",
      "Marca la casilla y toca «Crear cuenta».",
      "Escribe el código y toca «Verificar y crear la cuenta».",
      "Marca la casilla, escribe mariana.lopez@gmail.com y toca «Crear cuenta»."
    ],
    "source": "docs/design/guia/recorrido.py:30",
    "actualRoutes": [
      "/registro"
    ],
    "area": "identity",
    "chapterTitle": "Entra o crea su cuenta",
    "stage": "3 y 8",
    "existingCaseIds": [
      "02"
    ],
    "guidedCaseIds": [
      "GUIA-correo-sin-cuenta-02",
      "GUIA-correo-sin-cuenta-03",
      "GUIA-registrarse-02",
      "GUIA-registrarse-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "sesion",
    "chapter": "entra",
    "title": "Iniciando y cerrando la sesión",
    "route": "/auth/callback",
    "boards": [
      "Sesion",
      "M-Sesion"
    ],
    "actors": [
      "Sistema"
    ],
    "actions": [
      "Las esperas entre una pantalla y otra, cambiar de perfil y la sesión cerrada después de pedir la baja.",
      "Espera a que se abra la sesión."
    ],
    "source": "docs/design/guia/recorrido.py:32",
    "actualRoutes": [
      "/auth/callback"
    ],
    "area": "identity",
    "chapterTitle": "Entra o crea su cuenta",
    "stage": "3",
    "existingCaseIds": [
      "02",
      "04",
      "E8-05"
    ],
    "guidedCaseIds": [
      "GUIA-ingresar-como-persona-04",
      "GUIA-ingresar-con-google-02",
      "GUIA-ingresar-por-whatsapp-04",
      "GUIA-registrarse-04"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "aceptar-terminos",
    "chapter": "entra",
    "title": "Aceptar términos nuevos",
    "route": "/aceptar-terminos",
    "boards": [
      "Aceptar-Terminos",
      "M-Aceptar-Terminos"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Bloquea la entrada hasta aceptar la versión nueva.",
      "Marca la casilla y toca «Aceptar y seguir»."
    ],
    "source": "docs/design/guia/recorrido.py:34",
    "actualRoutes": [
      "/aceptar-terminos"
    ],
    "area": "identity",
    "chapterTitle": "Entra o crea su cuenta",
    "stage": "3",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-publicar-una-version-legal-03"
    ]
  },
  {
    "id": "recuperar",
    "chapter": "entra",
    "title": "Recuperar mi cuenta",
    "route": "/recuperar",
    "boards": [
      "Recuperar",
      "M-Recuperar"
    ],
    "actors": [
      "Persona sin sesión"
    ],
    "actions": [
      "Para quien perdió su único método de ingreso. Lo revisa un operador y nunca dice si el correo tiene cuenta."
    ],
    "source": "docs/design/guia/recorrido.py:36",
    "actualRoutes": [
      "/recuperar"
    ],
    "area": "identity",
    "chapterTitle": "Entra o crea su cuenta",
    "stage": "5",
    "existingCaseIds": [
      "19",
      "20",
      "E8-20"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "enlace",
    "chapter": "entra",
    "title": "Enlace del bot de WhatsApp",
    "route": "/login/enlace",
    "boards": [
      "Enlace",
      "M-Enlace"
    ],
    "actors": [
      "Lucía · Dueña · web",
      "Sistema"
    ],
    "actions": [
      "El enlace de un solo uso que manda el bot para entrar.",
      "Toca «Continuar».",
      "Espera a que se abra la sesión."
    ],
    "source": "docs/design/guia/recorrido.py:38",
    "actualRoutes": [
      "/login/enlace"
    ],
    "area": "identity",
    "chapterTitle": "Entra o crea su cuenta",
    "stage": "8",
    "existingCaseIds": [
      "E8-15",
      "E8-16"
    ],
    "guidedCaseIds": [
      "GUIA-el-bot-y-su-enlace-02",
      "GUIA-el-bot-y-su-enlace-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "inicio-personal",
    "chapter": "persona",
    "title": "Inicio personal",
    "route": "/",
    "boards": [
      "Inicio-Personal",
      "M-Inicio-Personal",
      "M-Mas-Personal"
    ],
    "actors": [
      "Lucía · Dueña · web",
      "Lucía · persona · web",
      "Mariana · persona · web"
    ],
    "actions": [
      "Con el aviso para sumar un correo propio si solo entra con el de la empresa. El contenido llega con los módulos.",
      "Ve su perfil personal.",
      "Ve su perfil personal con el aviso para agregar un correo o su WhatsApp."
    ],
    "source": "docs/design/guia/recorrido.py:42",
    "actualRoutes": [
      "/"
    ],
    "area": "personal",
    "chapterTitle": "Su perfil personal",
    "stage": "3",
    "existingCaseIds": [
      "02",
      "04",
      "E8-06",
      "E8-17"
    ],
    "guidedCaseIds": [
      "GUIA-el-bot-y-su-enlace-04",
      "GUIA-ingresar-como-persona-05",
      "GUIA-ingresar-con-google-03",
      "GUIA-ingresar-por-whatsapp-05",
      "GUIA-registrarse-05"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "cuenta",
    "chapter": "persona",
    "title": "Mi cuenta",
    "route": "/cuenta",
    "boards": [
      "Cuenta",
      "M-Cuenta",
      "Cuenta-Agregar",
      "Cuenta-Verificar",
      "Cuenta-Metodo",
      "Cuenta-Baja",
      "M-Cuenta-Agregar",
      "M-Cuenta-Verificar",
      "M-Cuenta-Metodo",
      "M-Cuenta-Baja"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Tus datos, cómo entrás y privacidad. Agregar, verificar, quitar y dar de baja van en diálogos. WhatsApp es de la Etapa 8 y exportar, de la 10.",
      "Toca «Agregar correo o teléfono».",
      "Escribe el correo y toca «Enviar código».",
      "Escribe el código y toca «Verificar».",
      "Ve el correo agregado.",
      "Elige WhatsApp, escribe el número y toca «Enviar código».",
      "Cambia el apellido y toca «Guardar cambios».",
      "Ve el aviso de cambios guardados.",
      "Toca el ⋮ del WhatsApp.",
      "Toca «Hacer principal».",
      "Abre el ⋮ del correo, toca «Quitar» y confirma.",
      "Ve el aviso de correo quitado."
    ],
    "source": "docs/design/guia/recorrido.py:44",
    "actualRoutes": [
      "/cuenta"
    ],
    "area": "personal",
    "chapterTitle": "Su perfil personal",
    "stage": "3, 8 y 10",
    "existingCaseIds": [
      "14",
      "15",
      "16",
      "17",
      "E8-07",
      "E8-08",
      "E8-10",
      "E8-11"
    ],
    "guidedCaseIds": [
      "GUIA-agregar-un-correo-01",
      "GUIA-agregar-un-correo-02",
      "GUIA-agregar-un-correo-03",
      "GUIA-agregar-un-correo-04",
      "GUIA-agregar-un-whatsapp-01",
      "GUIA-agregar-un-whatsapp-02",
      "GUIA-agregar-un-whatsapp-04",
      "GUIA-nombre-y-apellido-01",
      "GUIA-nombre-y-apellido-02",
      "GUIA-principal-y-quitar-01",
      "GUIA-principal-y-quitar-02",
      "GUIA-principal-y-quitar-03",
      "GUIA-principal-y-quitar-04",
      "GUIA-principal-y-quitar-05"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "mensajes-persona",
    "chapter": "persona",
    "title": "Mensajes",
    "route": "/mensajes",
    "boards": [
      "WA-Mensajes",
      "M-WA-Mensajes",
      "M-WA-Mensaje"
    ],
    "actors": [
      "Persona (B2C)"
    ],
    "actions": [
      "Las charlas de la persona con las organizaciones por WhatsApp, solo para leer, con «Seguir en WhatsApp»."
    ],
    "source": "docs/design/guia/recorrido.py:46",
    "actualRoutes": [
      "/mensajes",
      "/mensajes/:conversationId"
    ],
    "area": "personal",
    "chapterTitle": "Su perfil personal",
    "stage": "11",
    "existingCaseIds": [
      "E11-15"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "registro-empresa",
    "chapter": "empresa",
    "title": "Registrá tu empresa",
    "route": "/registro/empresa",
    "boards": [
      "Registro-Empresa",
      "M-Registro-Empresa"
    ],
    "actors": [
      "Mariana · persona · web"
    ],
    "actions": [
      "La organización con su dirección en el subdominio y su primera empresa, con los límites y la aprobación.",
      "Marca la casilla, escribe mariana.lopez@gmail.com y toca «Continuar».",
      "Escribe el código y toca «Verificar».",
      "Completa la organización, la dirección y la primera empresa, y toca «Crear organización».",
      "Ve que el pedido quedó en revisión."
    ],
    "source": "docs/design/guia/recorrido.py:50",
    "actualRoutes": [
      "/registro/empresa"
    ],
    "area": "business/onboarding",
    "chapterTitle": "Registra su empresa",
    "stage": "6",
    "existingCaseIds": [
      "08"
    ],
    "guidedCaseIds": [
      "GUIA-registrar-empresa-02",
      "GUIA-registrar-empresa-03",
      "GUIA-registrar-empresa-04",
      "GUIA-registrar-empresa-05"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "inicio-org",
    "chapter": "empresa",
    "title": "Inicio de la organización",
    "route": "/org",
    "boards": [
      "Inicio-Org",
      "M-Inicio-Org"
    ],
    "actors": [
      "Persona que registra una organización",
      "Dueño de la organización"
    ],
    "actions": [
      "Las áreas en tarjetas con un dato real y «Para resolver». En el teléfono, como una billetera."
    ],
    "source": "docs/design/guia/recorrido.py:52",
    "actualRoutes": [
      "/org"
    ],
    "area": "business/onboarding",
    "chapterTitle": "Registra su empresa",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "no-disponible",
    "chapter": "empresa",
    "title": "Organización no disponible",
    "route": "—",
    "boards": [
      "Perfil-Suspendido",
      "M-Perfil-Suspendido"
    ],
    "actors": [
      "Persona que registra una organización",
      "Dueño de la organización"
    ],
    "actions": [
      "Suspendida, esperando aprobación o cerrada."
    ],
    "source": "docs/design/guia/recorrido.py:54",
    "actualRoutes": [],
    "area": "business/onboarding",
    "chapterTitle": "Registra su empresa",
    "stage": "3",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "usuarios",
    "chapter": "equipo",
    "title": "Usuarios",
    "route": "/org/usuarios",
    "boards": [
      "Usuarios",
      "M-Usuarios",
      "M-Usuarios-Invitar"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Quiénes están, con su estado, sus roles y sus empresas. Desde acá se invita y se cargan teléfonos.",
      "Toca «Tomás Acosta».",
      "Toca «Invitar usuario».",
      "Escribe valentina.ruiz@gmail.com, elige sus roles y toca «Invitar».",
      "Ve las invitaciones en Usuarios."
    ],
    "source": "docs/design/guia/recorrido.py:58",
    "actualRoutes": [
      "/org/usuarios"
    ],
    "area": "business/members-and-roles",
    "chapterTitle": "Arma su equipo",
    "stage": "6",
    "existingCaseIds": [
      "E8B-20-3"
    ],
    "guidedCaseIds": [
      "GUIA-crear-un-rol-y-asignarlo-03",
      "GUIA-invitar-y-aceptar-01",
      "GUIA-invitar-y-aceptar-02",
      "GUIA-una-consulta-fija-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "usuario",
    "chapter": "equipo",
    "title": "Ficha de un usuario",
    "route": "/org/usuarios/:id",
    "boards": [
      "Usuario",
      "M-Usuario",
      "M-Usuario-Empresa"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Su estado, sus roles en la organización y sus empresas.",
      "Abre «Roles de la organización», marca «Recursos humanos» y toca «Guardar cambios»."
    ],
    "source": "docs/design/guia/recorrido.py:60",
    "actualRoutes": [
      "/org/usuarios/:memberId"
    ],
    "area": "business/members-and-roles",
    "chapterTitle": "Arma su equipo",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-crear-un-rol-y-asignarlo-04"
    ]
  },
  {
    "id": "roles",
    "chapter": "equipo",
    "title": "Roles y permisos",
    "route": "/org/roles",
    "boards": [
      "Roles",
      "M-Roles"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Los roles de la organización y de cada empresa.",
      "Toca «Crear rol»."
    ],
    "source": "docs/design/guia/recorrido.py:62",
    "actualRoutes": [
      "/org/roles"
    ],
    "area": "business/members-and-roles",
    "chapterTitle": "Arma su equipo",
    "stage": "4",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-crear-un-rol-y-asignarlo-01"
    ]
  },
  {
    "id": "rol",
    "chapter": "equipo",
    "title": "Un rol",
    "route": "/org/roles/:id",
    "boards": [
      "Rol",
      "M-Rol"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Dónde vale y sus permisos por área. Los de sistema, como Dueño, solo se miran.",
      "Escribe el nombre, elige dónde vale, marca los permisos y toca «Crear rol»."
    ],
    "source": "docs/design/guia/recorrido.py:64",
    "actualRoutes": [
      "/org/roles/nuevo",
      "/org/roles/:roleId"
    ],
    "area": "business/members-and-roles",
    "chapterTitle": "Arma su equipo",
    "stage": "4",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-crear-un-rol-y-asignarlo-02"
    ]
  },
  {
    "id": "invitacion",
    "chapter": "equipo",
    "title": "Aceptar una invitación",
    "route": "/invitacion",
    "boards": [
      "Invitacion",
      "M-Invitacion"
    ],
    "actors": [
      "Miembro de la organización con permisos",
      "Persona invitada"
    ],
    "actions": [
      "Con cuenta o sin cuenta, con la sesión de otra persona, vencida o de una organización suspendida."
    ],
    "source": "docs/design/guia/recorrido.py:66",
    "actualRoutes": [
      "/invitacion"
    ],
    "area": "business/members-and-roles",
    "chapterTitle": "Arma su equipo",
    "stage": "3",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "inicio-miembro",
    "chapter": "equipo",
    "title": "Inicio de un miembro",
    "route": "/org",
    "boards": [
      "Inicio-Miembro",
      "M-Inicio-Miembro"
    ],
    "actors": [
      "Valentina · invitada · web"
    ],
    "actions": [
      "Quien solo tiene roles en una empresa ve «Tus empresas» y, si la administra, su «Para resolver».",
      "Ve su inicio de miembro."
    ],
    "source": "docs/design/guia/recorrido.py:68",
    "actualRoutes": [
      "/org"
    ],
    "area": "business/members-and-roles",
    "chapterTitle": "Arma su equipo",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-invitar-y-aceptar-06"
    ]
  },
  {
    "id": "empresas",
    "chapter": "administra",
    "title": "Empresas",
    "route": "/org/empresas",
    "boards": [
      "Empresas",
      "M-Empresas"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Las empresas de la organización, con su CUIT, su zona horaria y sus miembros.",
      "Toca «Crear empresa».",
      "Escribe el nombre y el CUIT y toca «Crear empresa»."
    ],
    "source": "docs/design/guia/recorrido.py:72",
    "actualRoutes": [
      "/org/empresas"
    ],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-sumar-una-empresa-01",
      "GUIA-sumar-una-empresa-02"
    ]
  },
  {
    "id": "empresa",
    "chapter": "administra",
    "title": "Ficha de una empresa",
    "route": "/org/empresas/:id",
    "boards": [
      "Empresa",
      "M-Empresa"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Pestañas Miembros y Roles.",
      "Toca «Agregar miembro».",
      "Elige a la persona y sus roles y toca «Agregar miembro»."
    ],
    "source": "docs/design/guia/recorrido.py:49",
    "actualRoutes": [
      "/org/empresas/:companyId"
    ],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-sumar-una-empresa-03",
      "GUIA-sumar-una-empresa-04"
    ]
  },
  {
    "id": "configuracion",
    "chapter": "administra",
    "title": "Configuración",
    "route": "/org/configuracion",
    "boards": [
      "Configuracion",
      "M-Configuracion",
      "Configuracion-Dominio",
      "Configuracion-Verificar",
      "Configuracion-Quitar",
      "M-Configuracion-Dominio",
      "M-Configuracion-Verificar",
      "M-Configuracion-Quitar"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Nombre, idioma, zona horaria, moneda y el dominio de correo, con sus diálogos.",
      "Toca «Agregar dominio».",
      "Escribe el dominio y toca «Siguiente».",
      "Copia el registro TXT, lo carga en su DNS y toca «Comprobar».",
      "Ve el dominio verificado."
    ],
    "source": "docs/design/guia/recorrido.py:76",
    "actualRoutes": [
      "/org/configuracion"
    ],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-configuracion-y-dominio-01",
      "GUIA-configuracion-y-dominio-02",
      "GUIA-configuracion-y-dominio-03",
      "GUIA-configuracion-y-dominio-04"
    ]
  },
  {
    "id": "pagina-org",
    "chapter": "administra",
    "title": "Su página pública",
    "route": "/org/pagina",
    "boards": [
      "Pagina-Org",
      "M-Pagina-Org",
      "Pagina-Org-Despublicar"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Publicarla, el logo, la dirección, la descripción y el contacto.",
      "Prende «Publicar la página» y toca «Guardar cambios».",
      "Ve la página publicada."
    ],
    "source": "docs/design/guia/recorrido.py:79",
    "actualRoutes": [
      "/org/pagina"
    ],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "6",
    "existingCaseIds": [
      "25"
    ],
    "guidedCaseIds": [
      "GUIA-publicar-y-encontrar-01",
      "GUIA-publicar-y-encontrar-02"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "auditoria-org",
    "chapter": "administra",
    "title": "Auditoría",
    "route": "/org/auditoria",
    "boards": [
      "Auditoria-Org",
      "M-Auditoria-Org"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Qué hizo cada uno, de a tandas con «Cargar más»."
    ],
    "source": "docs/design/guia/recorrido.py:81",
    "actualRoutes": [
      "/org/auditoria"
    ],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "6",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "error-org",
    "chapter": "administra",
    "title": "Sin permiso o no encontrada",
    "route": "—",
    "boards": [
      "Error-Org",
      "M-Error-Org"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Las pantallas de error dentro de la organización."
    ],
    "source": "docs/design/guia/recorrido.py:83",
    "actualRoutes": [
      "/sin-permiso",
      "*"
    ],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "3",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "avisos",
    "chapter": "administra",
    "title": "Avisos del sistema",
    "route": "—",
    "boards": [
      "Avisos",
      "M-Avisos"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Sin conexión, error del servidor, alguien cambió esto, salir sin guardar y los demás avisos comunes."
    ],
    "source": "docs/design/guia/recorrido.py:85",
    "actualRoutes": [],
    "area": "business/administration",
    "chapterTitle": "Administra la organización",
    "stage": "1",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "wa-chats",
    "chapter": "whatsapp",
    "title": "Chats",
    "route": "WhatsApp › Chats",
    "boards": [
      "WA-Chats",
      "M-WA-Chats",
      "WA-Chats-SinTomar",
      "WA-Chats-Nota",
      "WA-Chats-Pasar",
      "WA-Chats-24h",
      "WA-Chats-Plantilla",
      "M-WA-Conversacion",
      "M-WA-Chats-SinTomar",
      "M-WA-Chats-Nota",
      "M-WA-24h",
      "M-WA-Chats-Pasar",
      "M-WA-Chats-Plantilla",
      "M-WA-Menu"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Las bandejas Clientes | Internos, tomar un chat (y si lo tomó otra persona), pasarlo, la nota interna, la ventana de 24 horas, las fotos, audios y documentos como «Mandó…», el número desconectado y sin medio de pago."
    ],
    "source": "docs/design/guia/recorrido.py:89",
    "actualRoutes": [
      "/org/whatsapp/chats",
      "/org/whatsapp/chats/:conversationId"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [
      "E11-09",
      "E11-10",
      "E11-11",
      "E11-12"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "wa-contactos",
    "chapter": "whatsapp",
    "title": "Contactos",
    "route": "WhatsApp › Contactos",
    "boards": [
      "WA-Contactos",
      "M-WA-Contactos",
      "WA-Contacto",
      "WA-Contactos-Importar",
      "M-WA-Contacto",
      "M-WA-Contactos-Importar"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Quién escribió, con sus etiquetas y si acepta promociones; la ficha de cada contacto e importar."
    ],
    "source": "docs/design/guia/recorrido.py:92",
    "actualRoutes": [
      "/org/whatsapp/contactos",
      "/org/whatsapp/contactos/:contactId"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [
      "E11-13"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "wa-difusiones",
    "chapter": "whatsapp",
    "title": "Difusiones",
    "route": "WhatsApp › Difusiones",
    "boards": [
      "WA-Difusiones",
      "M-WA-Difusiones",
      "WA-Difusion-Nueva",
      "WA-Difusion-Resultados",
      "M-WA-Difusion-Nueva",
      "M-WA-Difusion-Resultados"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Mensajes a muchos contactos que aceptaron, con la vista previa, el costo y los resultados."
    ],
    "source": "docs/design/guia/recorrido.py:94",
    "actualRoutes": [
      "/org/whatsapp/difusiones",
      "/org/whatsapp/difusiones/nueva",
      "/org/whatsapp/difusiones/:broadcastId"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "wa-numeros",
    "chapter": "whatsapp",
    "title": "Números y alta con Meta",
    "route": "Administración › WhatsApp",
    "boards": [
      "WA-Admin",
      "M-WA-Admin",
      "WA-Alta",
      "WA-Alta-Meta",
      "WA-Alta-Coexistencia",
      "WA-Admin-Pago",
      "WA-Admin-Vacio",
      "M-WA-Alta",
      "M-WA-Admin-Pago",
      "M-WA-Admin-Vacio"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Conectar un número con la ventana de Meta, a quién atiende, el medio de pago, los 1.000 gratis del mes y desconectarlo."
    ],
    "source": "docs/design/guia/recorrido.py:96",
    "actualRoutes": [
      "/org/whatsapp/numeros"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [
      "E11-02"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "wa-bot",
    "chapter": "whatsapp",
    "title": "Bot",
    "route": "Administración › WhatsApp",
    "boards": [
      "WA-Respuestas",
      "M-WA-Respuestas",
      "WA-Bot-Recorrido",
      "M-WA-Bot-Recorrido",
      "WA-Admin-Editar",
      "M-WA-Editar"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Configuración | Recorrido: la bienvenida, el fuera de horario con sus días y la zona, y el menú de hasta 10 opciones que contesta o pasa a un equipo. No se apaga."
    ],
    "source": "docs/design/guia/recorrido.py:98",
    "actualRoutes": [
      "/org/whatsapp/bot"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [
      "E11-04"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "wa-equipos",
    "chapter": "whatsapp",
    "title": "Equipos",
    "route": "Administración › WhatsApp",
    "boards": [
      "WA-Equipos",
      "M-WA-Equipos",
      "WA-Equipos-Crear",
      "M-WA-Equipos-Crear"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Quién atiende cada bandeja y cuándo avisar por correo si nadie toma un chat."
    ],
    "source": "docs/design/guia/recorrido.py:100",
    "actualRoutes": [
      "/org/whatsapp/equipos"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [
      "E11-03"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "wa-plantillas",
    "chapter": "whatsapp",
    "title": "Plantillas",
    "route": "Administración › WhatsApp",
    "boards": [
      "WA-Plantillas",
      "M-WA-Plantillas",
      "WA-Plantilla-Nueva",
      "M-WA-Plantilla-Nueva"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "Los mensajes que aprueba Meta para escribir fuera de las 24 horas."
    ],
    "source": "docs/design/guia/recorrido.py:102",
    "actualRoutes": [
      "/org/whatsapp/plantillas"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "wa-telefonos",
    "chapter": "whatsapp",
    "title": "Cargar teléfonos de empleados",
    "route": "Usuarios › Cargar teléfonos",
    "boards": [
      "WA-Telefonos",
      "M-WA-Telefonos"
    ],
    "actors": [
      "Miembro de la organización con permisos"
    ],
    "actions": [
      "En dos pasos: pegar o subir los números y ver qué pasa con cada uno, sin revelar quién tiene cuenta. Las invitaciones quedan en Usuarios."
    ],
    "source": "docs/design/guia/recorrido.py:104",
    "actualRoutes": [
      "/org/usuarios/cargar-telefonos"
    ],
    "area": "whatsapp",
    "chapterTitle": "Atiende por WhatsApp",
    "stage": "11",
    "existingCaseIds": [
      "E11-14"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "asistente-inicio",
    "chapter": "asistente",
    "title": "El asistente en el inicio",
    "route": "/ · /org · /plataforma",
    "boards": [
      "Asistente-Org",
      "Asistente-Personal",
      "Asistente-Plat",
      "M-Asistente-Org",
      "M-Asistente-Personal",
      "M-Asistente-Plat"
    ],
    "actors": [
      "Lucía · Dueña · web",
      "Martín · operador · web",
      "Sistema"
    ],
    "actions": [
      "En la compu, el inicio es el asistente: el historial que se pliega, las consultas fijas, los adjuntos, los topes y lo de hoy como bienvenida. En el teléfono, una pestaña de la barra de abajo.",
      "Toca «Revisar» en la organización que espera.",
      "Toca «Entendido».",
      "Ve la bienvenida del asistente.",
      "Ve «Te quedan 10 consultas hoy».",
      "Ve el aviso del tope del día.",
      "Ve el aviso del tope del mes y toca «Ver uso».",
      "Toca el ⋮ de la conversación.",
      "Toca «Guardar».",
      "Toca «Exportar en PDF».",
      "Ve el inicio de Plataforma.",
      "Toca «Invitaciones vencidas».",
      "Toca «Ver en Usuarios».",
      "Adjunta la planilla, escribe la pregunta y la envía.",
      "Espera la respuesta; puede tocar «Detener».",
      "Lee la respuesta mientras se escribe.",
      "Toca «Me sirvió»."
    ],
    "source": "docs/design/guia/recorrido.py:108",
    "actualRoutes": [
      "/",
      "/org",
      "/plataforma",
      "/asistente",
      "/org/asistente",
      "/plataforma/asistente"
    ],
    "area": "assistant",
    "chapterTitle": "Le pregunta al asistente",
    "stage": "8b",
    "existingCaseIds": [
      "E8B-10-1",
      "E8B-10-2",
      "E8B-20-1",
      "E8B-20-2",
      "E8B-30-1",
      "E8B-30-2",
      "E8B-30-3",
      "E8B-30-4",
      "E8B-40-1",
      "E8B-40-2",
      "E8B-40-3",
      "E8B-60-1",
      "E8B-60-2",
      "E8B-60-5"
    ],
    "guidedCaseIds": [
      "GUIA-aprobar-una-organizacion-01",
      "GUIA-asistente-primera-vez-01",
      "GUIA-asistente-primera-vez-02",
      "GUIA-el-tope-01",
      "GUIA-el-tope-02",
      "GUIA-el-tope-05",
      "GUIA-guardar-y-exportar-01",
      "GUIA-guardar-y-exportar-02",
      "GUIA-guardar-y-exportar-03",
      "GUIA-operador-en-la-puerta-publica-05",
      "GUIA-una-consulta-fija-01",
      "GUIA-una-consulta-fija-02",
      "GUIA-una-pregunta-con-herramienta-01",
      "GUIA-una-pregunta-con-herramienta-02",
      "GUIA-una-pregunta-con-herramienta-03",
      "GUIA-una-pregunta-con-herramienta-04"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "asistente-config",
    "chapter": "asistente",
    "title": "Configuración del asistente",
    "route": "Administración › Asistente",
    "boards": [
      "Asistente-Config-Org",
      "Plat-Asistente-Config",
      "M-Asistente-Config-Org",
      "M-Plat-Asistente-Config"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "Qué clave usa, el modelo con su precio y los topes. En Plataforma, además, el catálogo de modelos con sus datos técnicos, los modelos que pueden elegir las organizaciones, las personas y los días para borrar.",
      "Toca «La nuestra».",
      "Pega la clave, elige el modelo y los topes y toca «Guardar cambios».",
      "Ve la configuración guardada."
    ],
    "source": "docs/design/guia/recorrido.py:111",
    "actualRoutes": [
      "/org/asistente/configuracion",
      "/plataforma/asistente/configuracion"
    ],
    "area": "assistant",
    "chapterTitle": "Le pregunta al asistente",
    "stage": "8b",
    "existingCaseIds": [
      "E8B-50-2",
      "E8B-50-3",
      "E8B-50-4"
    ],
    "guidedCaseIds": [
      "GUIA-configurar-la-clave-propia-02",
      "GUIA-configurar-la-clave-propia-03",
      "GUIA-configurar-la-clave-propia-04"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "asistente-uso",
    "chapter": "asistente",
    "title": "Uso del asistente",
    "route": "Administración › Asistente › Uso",
    "boards": [
      "Asistente-Uso-Org",
      "Plat-Asistente-Uso",
      "M-Asistente-Uso-Org",
      "M-Plat-Asistente-Uso"
    ],
    "actors": [
      "Lucía · Dueña · web"
    ],
    "actions": [
      "El tope del mes y el uso por día y por persona; en Plataforma, el costo por organización. Nunca el texto de las conversaciones.",
      "Abre Administración › Asistente › Uso."
    ],
    "source": "docs/design/guia/recorrido.py:114",
    "actualRoutes": [
      "/org/asistente/uso",
      "/plataforma/asistente/uso"
    ],
    "area": "assistant",
    "chapterTitle": "Le pregunta al asistente",
    "stage": "8b",
    "existingCaseIds": [
      "E8B-60-3"
    ],
    "guidedCaseIds": [
      "GUIA-el-tope-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "organizaciones",
    "chapter": "plataforma",
    "title": "Organizaciones",
    "route": "/plataforma/organizaciones",
    "boards": [
      "Organizaciones",
      "M-Organizaciones",
      "M-Mas-Plat"
    ],
    "actors": [
      "Martín · operador · web"
    ],
    "actions": [
      "Todas las organizaciones, con su Dueño, su origen y su estado. Aprobar, rechazar y crear.",
      "Toca «Crear organización».",
      "Completa los datos y toca «Crear organización»."
    ],
    "source": "docs/design/guia/recorrido.py:162",
    "actualRoutes": [
      "/plataforma",
      "/plataforma/organizaciones"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-crear-una-organizacion-01",
      "GUIA-crear-una-organizacion-02"
    ]
  },
  {
    "id": "organizacion",
    "chapter": "plataforma",
    "title": "Ficha de una organización",
    "route": "/plataforma/organizaciones/:id",
    "boards": [
      "Organizacion",
      "M-Organizacion"
    ],
    "actors": [
      "Martín · operador · web"
    ],
    "actions": [
      "Historial, Dueños, módulos (el Asistente dice qué clave usa), dominio verificado y página pública.",
      "Toca «Aprobar».",
      "Escribe el motivo y toca «Aprobar».",
      "Ve la organización activa.",
      "Abre el ⋮ del Asistente, toca «Permitir su propia clave» y confirma con un motivo.",
      "Ve la ficha de la organización nueva."
    ],
    "source": "docs/design/guia/recorrido.py:164",
    "actualRoutes": [
      "/plataforma/organizaciones/:id"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [
      "E8B-50-1"
    ],
    "guidedCaseIds": [
      "GUIA-aprobar-una-organizacion-02",
      "GUIA-aprobar-una-organizacion-03",
      "GUIA-aprobar-una-organizacion-04",
      "GUIA-configurar-la-clave-propia-01",
      "GUIA-crear-una-organizacion-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "cuentas",
    "chapter": "plataforma",
    "title": "Cuentas y operadores",
    "route": "/plataforma/cuentas",
    "boards": [
      "Cuentas",
      "M-Cuentas"
    ],
    "actors": [
      "Martín · operador · web"
    ],
    "actions": [
      "Las personas y los operadores, con la invitación que vence a los 7 días.",
      "Busca la cuenta y la abre."
    ],
    "source": "docs/design/guia/recorrido.py:166",
    "actualRoutes": [
      "/plataforma/cuentas"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-suspender-y-reactivar-01"
    ]
  },
  {
    "id": "cuenta-plat",
    "chapter": "plataforma",
    "title": "Ficha de una cuenta",
    "route": "/plataforma/cuentas/:id",
    "boards": [
      "Cuenta-Plat",
      "M-Cuenta-Plat"
    ],
    "actors": [
      "Martín · operador · web"
    ],
    "actions": [
      "Sus métodos de ingreso, sus organizaciones y el historial de seguridad.",
      "Toca «Suspender».",
      "Escribe el motivo y toca «Suspender».",
      "Toca «Reactivar».",
      "Ve la cuenta activa."
    ],
    "source": "docs/design/guia/recorrido.py:168",
    "actualRoutes": [
      "/plataforma/cuentas/:id"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [
      "E9-03",
      "E9-04",
      "E9-05"
    ],
    "guidedCaseIds": [
      "GUIA-suspender-y-reactivar-02",
      "GUIA-suspender-y-reactivar-03",
      "GUIA-suspender-y-reactivar-04",
      "GUIA-suspender-y-reactivar-05"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "recuperaciones",
    "chapter": "plataforma",
    "title": "Recuperaciones",
    "route": "/plataforma/recuperaciones",
    "boards": [
      "Recuperaciones",
      "M-Recuperaciones"
    ],
    "actors": [
      "Martín · operador · web"
    ],
    "actions": [
      "Los pedidos de «Recuperar mi cuenta» para aprobar o rechazar.",
      "Abre el primer pedido.",
      "Escribe el motivo y toca «Aprobar»."
    ],
    "source": "docs/design/guia/recorrido.py:170",
    "actualRoutes": [
      "/plataforma/recuperaciones"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [
      "E8-21",
      "E8-22"
    ],
    "guidedCaseIds": [
      "GUIA-atender-una-recuperacion-01",
      "GUIA-atender-una-recuperacion-02"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "legales",
    "chapter": "plataforma",
    "title": "Documentos legales",
    "route": "/plataforma/legales",
    "boards": [
      "Legales",
      "M-Legales"
    ],
    "actors": [
      "Martín · operador · web"
    ],
    "actions": [
      "Publicar una versión nueva de los términos o la privacidad.",
      "Toca «Publicar versión nueva».",
      "Completa el documento, la vigencia y los textos y toca «Publicar»."
    ],
    "source": "docs/design/guia/recorrido.py:172",
    "actualRoutes": [
      "/plataforma/legales",
      "/plataforma/legales/nueva"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [],
    "guidedCaseIds": [
      "GUIA-publicar-una-version-legal-01",
      "GUIA-publicar-una-version-legal-02"
    ]
  },
  {
    "id": "auditoria-plat",
    "chapter": "plataforma",
    "title": "Auditoría de la plataforma",
    "route": "/plataforma/auditoria",
    "boards": [
      "Auditoria-Plat",
      "M-Auditoria-Plat",
      "M-Auditoria-Plat-Detalle"
    ],
    "actors": [
      "Operador de Plataforma con permisos"
    ],
    "actions": [
      "Los eventos de seguridad de todo el servicio."
    ],
    "source": "docs/design/guia/recorrido.py:174",
    "actualRoutes": [
      "/plataforma/auditoria"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [
      "E9-07"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "config-plat",
    "chapter": "plataforma",
    "title": "Configuración de la plataforma",
    "route": "/plataforma/configuracion",
    "boards": [
      "Config-Plat",
      "M-Config-Plat"
    ],
    "actors": [
      "Operador de Plataforma con permisos"
    ],
    "actions": [
      "Registro de personas, alta de organizaciones, límites y los correos de contacto."
    ],
    "source": "docs/design/guia/recorrido.py:176",
    "actualRoutes": [
      "/plataforma/configuracion"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "5",
    "existingCaseIds": [
      "E9-06"
    ],
    "guidedCaseIds": [],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "plat-wa",
    "chapter": "plataforma",
    "title": "WhatsApp de la plataforma",
    "route": "WhatsApp › Consultas",
    "boards": [
      "Plat-WA-Chats",
      "M-Plat-WA-Chats",
      "Plat-WA-Numero",
      "Plat-WA-Bot",
      "Plat-WA-Equipos",
      "Plat-WA-Plantillas",
      "Plat-WA-Alta",
      "M-Plat-WA-Conversacion",
      "M-Plat-WA-Numero",
      "Plat-WA-Bot-Recorrido",
      "M-Plat-WA-Alta",
      "M-Plat-WA-Bot",
      "M-Plat-WA-Equipos",
      "M-Plat-WA-Plantillas"
    ],
    "actors": [
      "Operador de Plataforma con permisos"
    ],
    "actions": [
      "Solo consultas, además de los códigos y avisos que manda el sistema: el número, el bot, los equipos y las plantillas."
    ],
    "source": "docs/design/guia/recorrido.py:178",
    "actualRoutes": [
      "/plataforma/whatsapp",
      "/plataforma/whatsapp/consultas/:conversationId",
      "/plataforma/whatsapp/numero",
      "/plataforma/whatsapp/bot",
      "/plataforma/whatsapp/equipos",
      "/plataforma/whatsapp/plantillas"
    ],
    "area": "platform",
    "chapterTitle": "La plataforma",
    "stage": "11",
    "existingCaseIds": [],
    "guidedCaseIds": []
  },
  {
    "id": "mensajes",
    "chapter": "manda",
    "title": "Correos y WhatsApp",
    "route": "—",
    "boards": [
      "Mensajes"
    ],
    "actors": [
      "Dueño · correo",
      "Lucía · WhatsApp",
      "Lucía · correo",
      "Persona · correo",
      "Valentina · invitada · correo"
    ],
    "actions": [
      "Códigos, invitaciones, avisos de la cuenta y de la plataforma. Los correos de la Etapa 3 ya salen.",
      "Copia el código del WhatsApp.",
      "Recibe el correo de organización aprobada.",
      "Recibe el aviso de recuperación aprobada.",
      "Escribe «Hola» y toca «Entrar».",
      "Recibe el correo de alerta.",
      "Abre el WhatsApp y copia el código.",
      "Abre el correo de la invitación."
    ],
    "source": "docs/design/guia/recorrido.py:183",
    "actualRoutes": [],
    "area": "system-delivery",
    "chapterTitle": "Lo que manda el sistema",
    "stage": "3, 5, 8 y 10",
    "existingCaseIds": [
      "E8-03",
      "E8-09",
      "E8-14",
      "E8-23",
      "E8B-60-4"
    ],
    "guidedCaseIds": [
      "GUIA-agregar-un-whatsapp-03",
      "GUIA-aprobar-una-organizacion-05",
      "GUIA-atender-una-recuperacion-03",
      "GUIA-el-bot-y-su-enlace-01",
      "GUIA-el-tope-04",
      "GUIA-ingresar-por-whatsapp-02",
      "GUIA-invitar-y-aceptar-03"
    ],
    "coverageNotes": [
      "Estos IDs prueban acciones concretas de esta pantalla; no certifican todos sus tableros, actores ni estados. Consultar guidedCaseIds y expected del script."
    ]
  },
  {
    "id": "palabras",
    "chapter": "manda",
    "title": "Palabras",
    "route": "—",
    "boards": [
      "Palabras"
    ],
    "actors": [
      "Sistema",
      "Persona destinataria"
    ],
    "actions": [
      "El vocabulario de la pantalla: Organización, Dueño, Personal."
    ],
    "source": "docs/design/guia/recorrido.py:185",
    "actualRoutes": [],
    "area": "system-delivery",
    "chapterTitle": "Lo que manda el sistema",
    "stage": "—",
    "existingCaseIds": [],
    "guidedCaseIds": [],
    "reference": true
  },
  {
    "id": "mapas",
    "chapter": "manda",
    "title": "Mapas",
    "route": "—",
    "boards": [
      "Recorridos",
      "Mapa-Ingreso"
    ],
    "actors": [
      "Sistema",
      "Persona destinataria"
    ],
    "actions": [
      "Quién es quién y todos los casos del ingreso. Son de referencia y no se programan."
    ],
    "source": "docs/design/guia/recorrido.py:187",
    "actualRoutes": [],
    "area": "system-delivery",
    "chapterTitle": "Lo que manda el sistema",
    "stage": "—",
    "existingCaseIds": [],
    "guidedCaseIds": [],
    "reference": true
  }
];

export const guidedCases = [
  {
    "id": "GUIA-agregar-un-correo-01",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Agregar correo o teléfono».",
    "route": "/cuenta",
    "expected": "En «Cómo entrás» están sus correos, su WhatsApp y Google.",
    "source": "docs/design/recorridos/agregar-un-correo.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "15"
    ],
    "existingE2EGroups": [
      "3b: sumar correo personal con código leído del .eml",
      "3b seguridad: sumar correo manda sólo código del nuevo"
    ],
    "flow": "agregar-un-correo",
    "step": 1,
    "title": "Va a Mi cuenta",
    "board": "Cuenta"
  },
  {
    "id": "GUIA-agregar-un-correo-02",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el correo y toca «Enviar código».",
    "route": "/cuenta",
    "expected": "Si ese correo ya es de otra cuenta, lo dice ahí y no manda código.",
    "source": "docs/design/recorridos/agregar-un-correo.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "15"
    ],
    "existingE2EGroups": [
      "3b: sumar correo personal con código leído del .eml",
      "3b seguridad: sumar correo manda sólo código del nuevo"
    ],
    "flow": "agregar-un-correo",
    "step": 2,
    "title": "Escribe el correo nuevo",
    "board": "Cuenta-Agregar"
  },
  {
    "id": "GUIA-agregar-un-correo-03",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el código y toca «Verificar».",
    "route": "/cuenta",
    "expected": "Un solo código: el que prueba que el correo nuevo es suyo. No le pide otro para confirmar.",
    "source": "docs/design/recorridos/agregar-un-correo.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "15"
    ],
    "existingE2EGroups": [
      "3b: sumar correo personal con código leído del .eml",
      "3b seguridad: sumar correo manda sólo código del nuevo"
    ],
    "flow": "agregar-un-correo",
    "step": 3,
    "title": "Lo verifica",
    "board": "Cuenta-Verificar"
  },
  {
    "id": "GUIA-agregar-un-correo-04",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Ve el correo agregado.",
    "route": "/cuenta",
    "expected": "El correo nuevo ya sirve para entrar, y a sus otros métodos les llega un aviso.",
    "source": "docs/design/recorridos/agregar-un-correo.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "15"
    ],
    "existingE2EGroups": [
      "3b: sumar correo personal con código leído del .eml",
      "3b seguridad: sumar correo manda sólo código del nuevo"
    ],
    "flow": "agregar-un-correo",
    "step": 4,
    "title": "Queda agregado",
    "board": "Cuenta"
  },
  {
    "id": "GUIA-agregar-un-whatsapp-01",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Agregar correo o teléfono».",
    "route": "/cuenta",
    "expected": "En «Cómo entrás» puede sumar un correo o un WhatsApp.",
    "source": "docs/design/recorridos/agregar-un-whatsapp.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-07"
    ],
    "existingE2EGroups": [
      "agregar Phone"
    ],
    "flow": "agregar-un-whatsapp",
    "step": 1,
    "title": "Va a Mi cuenta",
    "board": "Cuenta"
  },
  {
    "id": "GUIA-agregar-un-whatsapp-02",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Elige WhatsApp, escribe el número y toca «Enviar código».",
    "route": "/cuenta",
    "expected": "Elige WhatsApp, el país y el número. Si ese número ya es de otra cuenta, lo dice ahí y no manda código.",
    "source": "docs/design/recorridos/agregar-un-whatsapp.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-08"
    ],
    "existingE2EGroups": [
      "agregar Phone"
    ],
    "flow": "agregar-un-whatsapp",
    "step": 2,
    "title": "Escribe su número",
    "board": "Cuenta-Agregar"
  },
  {
    "id": "GUIA-agregar-un-whatsapp-03",
    "area": "system-delivery",
    "actor": "Lucía · WhatsApp",
    "action": "Copia el código del WhatsApp.",
    "route": "—",
    "expected": "El código prueba que el número es suyo.",
    "source": "docs/design/recorridos/agregar-un-whatsapp.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-09"
    ],
    "existingE2EGroups": [],
    "flow": "agregar-un-whatsapp",
    "step": 3,
    "title": "Le llega el código",
    "board": "Mensajes",
    "manual": true,
    "manualReason": "El canal de Testing verifica webhook/outbox/OTP controlado; recibir el mensaje en un celular real y delivered de Meta queda a mano."
  },
  {
    "id": "GUIA-agregar-un-whatsapp-04",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el código y toca «Verificar».",
    "route": "/cuenta",
    "expected": "Con ese código, el WhatsApp ya sirve para entrar.",
    "source": "docs/design/recorridos/agregar-un-whatsapp.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-10"
    ],
    "existingE2EGroups": [
      "agregar Phone"
    ],
    "flow": "agregar-un-whatsapp",
    "step": 4,
    "title": "Lo verifica",
    "board": "Cuenta-Verificar"
  },
  {
    "id": "GUIA-aprobar-una-organizacion-01",
    "area": "assistant",
    "actor": "Martín · operador · web",
    "action": "Toca «Revisar» en la organización que espera.",
    "route": "/plataforma",
    "expected": "En el inicio de Plataforma, «Para resolver» muestra las organizaciones que esperan aprobación.",
    "source": "docs/design/recorridos/aprobar-una-organizacion.json#pasos/1",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "aprobar-una-organizacion",
    "step": 1,
    "title": "Ve lo que espera",
    "board": "Asistente-Plat",
    "coverageNotes": [
      "El E2E abre la ficha desde Organizaciones; no comprueba este pendiente del asistente del inicio."
    ]
  },
  {
    "id": "GUIA-aprobar-una-organizacion-02",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Toca «Aprobar».",
    "route": "/plataforma/organizaciones/:id",
    "expected": "Mira el historial, el Dueño y la página antes de decidir.",
    "source": "docs/design/recorridos/aprobar-una-organizacion.json#pasos/2",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5b: crear, aprobar, reintentar y moderar organizaciones reales"
    ],
    "flow": "aprobar-una-organizacion",
    "step": 2,
    "title": "Revisa la ficha",
    "board": "Organizacion"
  },
  {
    "id": "GUIA-aprobar-una-organizacion-03",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Escribe el motivo y toca «Aprobar».",
    "route": "/plataforma/organizaciones/:id",
    "expected": "El motivo queda en el historial de la organización.",
    "source": "docs/design/recorridos/aprobar-una-organizacion.json#pasos/3",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5b: crear, aprobar, reintentar y moderar organizaciones reales"
    ],
    "flow": "aprobar-una-organizacion",
    "step": 3,
    "title": "Confirma con un motivo",
    "board": "Organizacion"
  },
  {
    "id": "GUIA-aprobar-una-organizacion-04",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Ve la organización activa.",
    "route": "/plataforma/organizaciones/:id",
    "expected": "La organización ya está habilitada.",
    "source": "docs/design/recorridos/aprobar-una-organizacion.json#pasos/4",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5b: crear, aprobar, reintentar y moderar organizaciones reales"
    ],
    "flow": "aprobar-una-organizacion",
    "step": 4,
    "title": "Queda activa",
    "board": "Organizacion"
  },
  {
    "id": "GUIA-aprobar-una-organizacion-05",
    "area": "system-delivery",
    "actor": "Dueño · correo",
    "action": "Recibe el correo de organización aprobada.",
    "route": "—",
    "expected": "Le llega por correo y, si tiene WhatsApp, también por ahí.",
    "source": "docs/design/recorridos/aprobar-una-organizacion.json#pasos/5",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "aprobar-una-organizacion",
    "step": 5,
    "title": "Al Dueño le llega el aviso",
    "board": "Mensajes",
    "coverageNotes": [
      "No se encontró aserción de entrega del aviso de aprobación en este guion. Correo local puede verificarse leyendo .eml; WhatsApp real queda a mano."
    ]
  },
  {
    "id": "GUIA-asistente-primera-vez-01",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Entendido».",
    "route": "/org",
    "expected": "La primera vez, el asistente avisa que las consultas las procesa un proveedor de IA y que no suba datos sensibles. «Entendido» queda registrado.",
    "source": "docs/design/recorridos/asistente-primera-vez.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-10-1"
    ],
    "existingE2EGroups": [],
    "flow": "asistente-primera-vez",
    "step": 1,
    "title": "Lee el aviso",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-asistente-primera-vez-02",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Ve la bienvenida del asistente.",
    "route": "/org",
    "expected": "Ve «¿Qué querés consultar?», las consultas fijas y, debajo, lo que tiene para resolver.",
    "source": "docs/design/recorridos/asistente-primera-vez.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-10-2"
    ],
    "existingE2EGroups": [],
    "flow": "asistente-primera-vez",
    "step": 2,
    "title": "Ya puede preguntar",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-atender-una-recuperacion-01",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Abre el primer pedido.",
    "route": "/plataforma/recuperaciones",
    "expected": "Cada pedido trae el método de antes y el nuevo, tapados.",
    "source": "docs/design/recorridos/atender-una-recuperacion.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "E8-21"
    ],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "atender-una-recuperacion",
    "step": 1,
    "title": "Ve los pedidos",
    "board": "Recuperaciones",
    "critical": true
  },
  {
    "id": "GUIA-atender-una-recuperacion-02",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Escribe el motivo y toca «Aprobar».",
    "route": "/plataforma/recuperaciones",
    "expected": "Confirma con la persona que la cuenta es suya y escribe el motivo.",
    "source": "docs/design/recorridos/atender-una-recuperacion.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "E8-22"
    ],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "atender-una-recuperacion",
    "step": 2,
    "title": "Lo revisa",
    "board": "Recuperaciones",
    "critical": true
  },
  {
    "id": "GUIA-atender-una-recuperacion-03",
    "area": "system-delivery",
    "actor": "Persona · correo",
    "action": "Recibe el aviso de recuperación aprobada.",
    "route": "—",
    "expected": "Le llega el aviso al método nuevo; ya puede entrar con él.",
    "source": "docs/design/recorridos/atender-una-recuperacion.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-23"
    ],
    "existingE2EGroups": [],
    "flow": "atender-una-recuperacion",
    "step": 3,
    "title": "Le avisan a la persona",
    "board": "Mensajes",
    "critical": true,
    "manual": true,
    "manualReason": "El canal de Testing verifica webhook/outbox/OTP controlado; recibir el mensaje en un celular real y delivered de Meta queda a mano."
  },
  {
    "id": "GUIA-configuracion-y-dominio-01",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Agregar dominio».",
    "route": "/org/configuracion",
    "expected": "Están los datos de la organización y el dominio de correo.",
    "source": "docs/design/recorridos/configuracion-y-dominio.json#pasos/1",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "configuracion-y-dominio",
    "step": 1,
    "title": "Va a Configuración",
    "board": "Configuracion",
    "coverageNotes": [
      "No se encontró automatización real de Agregar dominio/Comprobar desde Organización. E2E 5b prueba únicamente quitar un dominio previamente preparado desde Plataforma."
    ]
  },
  {
    "id": "GUIA-configuracion-y-dominio-02",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el dominio y toca «Siguiente».",
    "route": "/org/configuracion",
    "expected": "Escribe el dominio de los correos de su organización.",
    "source": "docs/design/recorridos/configuracion-y-dominio.json#pasos/2",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "configuracion-y-dominio",
    "step": 2,
    "title": "Escribe el dominio",
    "board": "Configuracion-Dominio",
    "coverageNotes": [
      "No se encontró automatización real de Agregar dominio/Comprobar desde Organización. E2E 5b prueba únicamente quitar un dominio previamente preparado desde Plataforma."
    ]
  },
  {
    "id": "GUIA-configuracion-y-dominio-03",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Copia el registro TXT, lo carga en su DNS y toca «Comprobar».",
    "route": "/org/configuracion",
    "expected": "Copia el registro TXT y lo carga en su proveedor de dominio. Después comprueba.",
    "source": "docs/design/recorridos/configuracion-y-dominio.json#pasos/3",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "configuracion-y-dominio",
    "step": 3,
    "title": "Lo verifica",
    "board": "Configuracion-Verificar",
    "manual": true,
    "manualReason": "Cargar el TXT en un proveedor DNS real queda a mano; una futura prueba local controlada no certifica al proveedor.",
    "coverageNotes": [
      "No se encontró automatización real de Agregar dominio/Comprobar desde Organización. E2E 5b prueba únicamente quitar un dominio previamente preparado desde Plataforma."
    ]
  },
  {
    "id": "GUIA-configuracion-y-dominio-04",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Ve el dominio verificado.",
    "route": "/org/configuracion",
    "expected": "Los correos de ese dominio quedan administrados por la organización.",
    "source": "docs/design/recorridos/configuracion-y-dominio.json#pasos/4",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "configuracion-y-dominio",
    "step": 4,
    "title": "Queda verificado",
    "board": "Configuracion",
    "coverageNotes": [
      "No se encontró automatización real de Agregar dominio/Comprobar desde Organización. E2E 5b prueba únicamente quitar un dominio previamente preparado desde Plataforma."
    ]
  },
  {
    "id": "GUIA-configurar-la-clave-propia-01",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Abre el ⋮ del Asistente, toca «Permitir su propia clave» y confirma con un motivo.",
    "route": "/plataforma/organizaciones/:id",
    "expected": "En los módulos de la organización, el Asistente dice qué clave usa.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-50-1"
    ],
    "existingE2EGroups": [],
    "flow": "configurar-la-clave-propia",
    "step": 1,
    "title": "Permite la clave propia",
    "board": "Organizacion"
  },
  {
    "id": "GUIA-configurar-la-clave-propia-02",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «La nuestra».",
    "route": "/org/asistente/configuracion",
    "expected": "Ahora puede elegir qué clave usa. Para usar la propia, algún Dueño tiene que tener un correo verificado.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-50-2"
    ],
    "existingE2EGroups": [],
    "flow": "configurar-la-clave-propia",
    "step": 2,
    "title": "Elige «La nuestra»",
    "board": "Asistente-Config-Org"
  },
  {
    "id": "GUIA-configurar-la-clave-propia-03",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Pega la clave, elige el modelo y los topes y toca «Guardar cambios».",
    "route": "/org/asistente/configuracion",
    "expected": "Pega la clave de Anthropic; después solo se ve tapada. Con su clave elige cualquier modelo y fija sus topes.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-50-3"
    ],
    "existingE2EGroups": [],
    "flow": "configurar-la-clave-propia",
    "step": 3,
    "title": "Pega la clave",
    "board": "Asistente-Config-Org",
    "coverageNotes": [
      "La clave de proveedor usada por el guion real es controlada; validar una clave real de Anthropic queda a mano."
    ]
  },
  {
    "id": "GUIA-configurar-la-clave-propia-04",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Ve la configuración guardada.",
    "route": "/org/asistente/configuracion",
    "expected": "El asistente de Grupo Delta usa su clave y sus topes.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-50-4"
    ],
    "existingE2EGroups": [],
    "flow": "configurar-la-clave-propia",
    "step": 4,
    "title": "Queda configurada",
    "board": "Asistente-Config-Org",
    "coverageNotes": [
      "La clave de proveedor usada por el guion real es controlada; validar una clave real de Anthropic queda a mano."
    ]
  },
  {
    "id": "GUIA-correo-sin-cuenta-01",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Ve «No hay una cuenta con ese correo.» y toca «Crear mi cuenta».",
    "route": "/login",
    "expected": "La pantalla lo dice debajo del campo, no manda ningún código y le ofrece crear la cuenta con ese correo.",
    "source": "docs/design/recorridos/correo-sin-cuenta.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "01"
    ],
    "existingE2EGroups": [],
    "flow": "correo-sin-cuenta",
    "step": 1,
    "title": "Su correo no tiene cuenta",
    "board": "Ingreso"
  },
  {
    "id": "GUIA-correo-sin-cuenta-02",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Marca la casilla y toca «Crear cuenta».",
    "route": "/registro",
    "expected": "Llega al registro con el correo ya escrito. Acepta los términos y sigue.",
    "source": "docs/design/recorridos/correo-sin-cuenta.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "02"
    ],
    "existingE2EGroups": [],
    "flow": "correo-sin-cuenta",
    "step": 2,
    "title": "Crea la cuenta con ese correo",
    "board": "Registro"
  },
  {
    "id": "GUIA-correo-sin-cuenta-03",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Escribe el código y toca «Verificar y crear la cuenta».",
    "route": "/registro",
    "expected": "Con el código queda creada la cuenta, como en «Registrarse».",
    "source": "docs/design/recorridos/correo-sin-cuenta.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "02"
    ],
    "existingE2EGroups": [],
    "flow": "correo-sin-cuenta",
    "step": 3,
    "title": "Confirma el correo",
    "board": "Registro"
  },
  {
    "id": "GUIA-crear-un-rol-y-asignarlo-01",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Crear rol».",
    "route": "/org/roles",
    "expected": "Ve los roles de la organización y de cada empresa; los de sistema no se editan.",
    "source": "docs/design/recorridos/crear-un-rol-y-asignarlo.json#pasos/1",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "4: administrar roles y bloquear la baja del único Dueño"
    ],
    "flow": "crear-un-rol-y-asignarlo",
    "step": 1,
    "title": "Va a Roles",
    "board": "Roles",
    "critical": true
  },
  {
    "id": "GUIA-crear-un-rol-y-asignarlo-02",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el nombre, elige dónde vale, marca los permisos y toca «Crear rol».",
    "route": "/org/roles/nuevo",
    "expected": "Escribe el nombre, elige dónde vale y marca los permisos, agrupados por área.",
    "source": "docs/design/recorridos/crear-un-rol-y-asignarlo.json#pasos/2",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "4: administrar roles y bloquear la baja del único Dueño"
    ],
    "flow": "crear-un-rol-y-asignarlo",
    "step": 2,
    "title": "Le pone nombre y permisos",
    "board": "Rol",
    "critical": true
  },
  {
    "id": "GUIA-crear-un-rol-y-asignarlo-03",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Tomás Acosta».",
    "route": "/org/usuarios",
    "expected": "Vuelve a Usuarios y abre la ficha de Tomás.",
    "source": "docs/design/recorridos/crear-un-rol-y-asignarlo.json#pasos/3",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "crear-un-rol-y-asignarlo",
    "step": 3,
    "title": "Busca a la persona",
    "board": "Usuarios",
    "critical": true,
    "coverageNotes": [
      "E2E 4 crea/edita/archiva roles y prueba la baja del Dueño; no asigna el rol recién creado a otro miembro como este paso."
    ]
  },
  {
    "id": "GUIA-crear-un-rol-y-asignarlo-04",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Abre «Roles de la organización», marca «Recursos humanos» y toca «Guardar cambios».",
    "route": "/org/usuarios/:id",
    "expected": "En «Roles de la organización» marca el rol nuevo. «Guardar cambios» se prende cuando hay algo que guardar.",
    "source": "docs/design/recorridos/crear-un-rol-y-asignarlo.json#pasos/4",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "crear-un-rol-y-asignarlo",
    "step": 4,
    "title": "Le da el rol",
    "board": "Usuario",
    "critical": true,
    "coverageNotes": [
      "E2E 4 crea/edita/archiva roles y prueba la baja del Dueño; no asigna el rol recién creado a otro miembro como este paso."
    ]
  },
  {
    "id": "GUIA-crear-una-organizacion-01",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Toca «Crear organización».",
    "route": "/plataforma/organizaciones",
    "expected": "Ve todas las organizaciones, con su Dueño, su origen y su estado.",
    "source": "docs/design/recorridos/crear-una-organizacion.json#pasos/1",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5b: crear, aprobar, reintentar y moderar organizaciones reales"
    ],
    "flow": "crear-una-organizacion",
    "step": 1,
    "title": "Va a Organizaciones",
    "board": "Organizaciones"
  },
  {
    "id": "GUIA-crear-una-organizacion-02",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Completa los datos y toca «Crear organización».",
    "route": "/plataforma/organizaciones",
    "expected": "Escribe el nombre, la primera empresa y el correo del Dueño; la zona y el idioma vienen por defecto.",
    "source": "docs/design/recorridos/crear-una-organizacion.json#pasos/2",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5b: crear, aprobar, reintentar y moderar organizaciones reales"
    ],
    "flow": "crear-una-organizacion",
    "step": 2,
    "title": "Carga los datos",
    "board": "Organizaciones"
  },
  {
    "id": "GUIA-crear-una-organizacion-03",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Ve la ficha de la organización nueva.",
    "route": "/plataforma/organizaciones/:id",
    "expected": "La organización queda activa y su Dueño, invitado: entra cuando acepta.",
    "source": "docs/design/recorridos/crear-una-organizacion.json#pasos/3",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5b: crear, aprobar, reintentar y moderar organizaciones reales"
    ],
    "flow": "crear-una-organizacion",
    "step": 3,
    "title": "Queda creada",
    "board": "Organizacion"
  },
  {
    "id": "GUIA-el-bot-y-su-enlace-01",
    "area": "system-delivery",
    "actor": "Lucía · WhatsApp",
    "action": "Escribe «Hola» y toca «Entrar».",
    "route": "—",
    "expected": "Le escribe «Hola» al número de la plataforma. El bot le contesta con un enlace de un solo uso, que vence en 10 minutos.",
    "source": "docs/design/recorridos/el-bot-y-su-enlace.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-14"
    ],
    "existingE2EGroups": [],
    "flow": "el-bot-y-su-enlace",
    "step": 1,
    "title": "Le escribe al bot",
    "board": "Mensajes",
    "manual": true,
    "manualReason": "El canal de Testing verifica webhook/outbox/OTP controlado; recibir el mensaje en un celular real y delivered de Meta queda a mano."
  },
  {
    "id": "GUIA-el-bot-y-su-enlace-02",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Continuar».",
    "route": "/login/enlace",
    "expected": "El enlace entra como persona; después puede ir a su organización desde Perfiles. Si no pidió entrar, cierra la página.",
    "source": "docs/design/recorridos/el-bot-y-su-enlace.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-15"
    ],
    "existingE2EGroups": [],
    "flow": "el-bot-y-su-enlace",
    "step": 2,
    "title": "Confirma que es ella",
    "board": "Enlace"
  },
  {
    "id": "GUIA-el-bot-y-su-enlace-03",
    "area": "identity",
    "actor": "Sistema",
    "action": "Espera a que se abra la sesión.",
    "route": "/login/enlace",
    "expected": "Un mensaje nunca abre la sesión solo: hace falta tocar «Continuar».",
    "source": "docs/design/recorridos/el-bot-y-su-enlace.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-16"
    ],
    "existingE2EGroups": [],
    "flow": "el-bot-y-su-enlace",
    "step": 3,
    "title": "Se abre la sesión",
    "board": "Enlace"
  },
  {
    "id": "GUIA-el-bot-y-su-enlace-04",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Ve su perfil personal.",
    "route": "/",
    "expected": "Entró a su perfil personal. Si el número no tuviera cuenta, el bot le ofrecería crearla en la web; a un operador le contesta «Para entrar, usá la web.».",
    "source": "docs/design/recorridos/el-bot-y-su-enlace.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-17"
    ],
    "existingE2EGroups": [],
    "flow": "el-bot-y-su-enlace",
    "step": 4,
    "title": "Está adentro",
    "board": "Inicio-Personal"
  },
  {
    "id": "GUIA-el-tope-01",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Ve «Te quedan 10 consultas hoy».",
    "route": "/org",
    "expected": "El contador aparece recién cuando quedan 10 consultas del día.",
    "source": "docs/design/recorridos/el-tope.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-60-1"
    ],
    "existingE2EGroups": [],
    "flow": "el-tope",
    "step": 1,
    "title": "Le quedan pocas",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-el-tope-02",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Ve el aviso del tope del día.",
    "route": "/org",
    "expected": "No puede preguntar más hasta que se renueva, a la hora que dice el aviso. Las consultas fijas siguen andando.",
    "source": "docs/design/recorridos/el-tope.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-60-2"
    ],
    "existingE2EGroups": [],
    "flow": "el-tope",
    "step": 2,
    "title": "Llega al tope del día",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-el-tope-03",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Abre Administración › Asistente › Uso.",
    "route": "/org/asistente/uso",
    "expected": "Como Dueña, ve el gasto contra el tope del mes, por día y por persona, nunca el texto de las conversaciones.",
    "source": "docs/design/recorridos/el-tope.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-60-3"
    ],
    "existingE2EGroups": [],
    "flow": "el-tope",
    "step": 3,
    "title": "Mira el uso del mes",
    "board": "Asistente-Uso-Org"
  },
  {
    "id": "GUIA-el-tope-04",
    "area": "system-delivery",
    "actor": "Lucía · correo",
    "action": "Recibe el correo de alerta.",
    "route": "—",
    "expected": "Al 80 % y al 100 % del tope del mes, los Dueños reciben un correo.",
    "source": "docs/design/recorridos/el-tope.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-60-4"
    ],
    "existingE2EGroups": [],
    "flow": "el-tope",
    "step": 4,
    "title": "Le llega la alerta",
    "board": "Mensajes",
    "coverageNotes": [
      "E8B-60-4 comprueba el correo local en pickup; recibir WhatsApp en un celular no queda certificado."
    ]
  },
  {
    "id": "GUIA-el-tope-05",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Ve el aviso del tope del mes y toca «Ver uso».",
    "route": "/org",
    "expected": "El asistente de la organización deja de responder hasta el mes siguiente o hasta que suba el tope.",
    "source": "docs/design/recorridos/el-tope.json#pasos/5",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-60-5"
    ],
    "existingE2EGroups": [],
    "flow": "el-tope",
    "step": 5,
    "title": "Si llega al tope del mes",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-guardar-y-exportar-01",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca el ⋮ de la conversación.",
    "route": "/org",
    "expected": "Las conversaciones se borran solas a los 30 días sin actividad, salvo las guardadas.",
    "source": "docs/design/recorridos/guardar-y-exportar.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-40-1"
    ],
    "existingE2EGroups": [],
    "flow": "guardar-y-exportar",
    "step": 1,
    "title": "Abre el menú de la conversación",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-guardar-y-exportar-02",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Guardar».",
    "route": "/org",
    "expected": "Guardada, no vence nunca y pasa a «Guardadas».",
    "source": "docs/design/recorridos/guardar-y-exportar.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-40-2"
    ],
    "existingE2EGroups": [],
    "flow": "guardar-y-exportar",
    "step": 2,
    "title": "La guarda",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-guardar-y-exportar-03",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Exportar en PDF».",
    "route": "/org",
    "expected": "Puede bajarla en Markdown o en PDF.",
    "source": "docs/design/recorridos/guardar-y-exportar.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-40-3"
    ],
    "existingE2EGroups": [],
    "flow": "guardar-y-exportar",
    "step": 3,
    "title": "La exporta",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-ingresar-como-persona-01",
    "area": "public",
    "actor": "Lucía · persona · web",
    "action": "Toca «Ingresar» en la barra de arriba.",
    "route": "/",
    "expected": "Lucía abre ArquitecturaBase. Arriba están las dos puertas: «Ingresar», para entrar como persona, e «Ingresá como empresa», para trabajar en su organización.",
    "source": "docs/design/recorridos/ingresar-como-persona.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "01"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-como-persona",
    "step": 1,
    "title": "Llega al sitio",
    "board": "Landing",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-como-persona-02",
    "area": "identity",
    "actor": "Lucía · persona · web",
    "action": "Escribe lucia.fernandez@delta.ejemplo.com y toca «Enviar código».",
    "route": "/login",
    "expected": "No hay contraseñas: escribe el correo de su cuenta y el sistema le manda un código. También podría entrar con Google o con WhatsApp.",
    "source": "docs/design/recorridos/ingresar-como-persona.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "04"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-como-persona",
    "step": 2,
    "title": "Escribe su correo",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-como-persona-03",
    "area": "identity",
    "actor": "Lucía · persona · web",
    "action": "Escribe el código que le llegó y toca «Verificar».",
    "route": "/login",
    "expected": "Le llega un código de seis números al correo. Vence en 10 minutos y sirve una sola vez; si no llega, puede pedir otro.",
    "source": "docs/design/recorridos/ingresar-como-persona.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "04"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-como-persona",
    "step": 3,
    "title": "Pone el código",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-como-persona-04",
    "area": "identity",
    "actor": "Sistema",
    "action": "Espera a que se abra la sesión.",
    "route": "/auth/callback",
    "expected": "El sistema confirma el código y abre la sesión de persona. Es una espera corta, sin nada que tocar.",
    "source": "docs/design/recorridos/ingresar-como-persona.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "04"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-como-persona",
    "step": 4,
    "title": "Se abre su sesión",
    "board": "Sesion",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-como-persona-05",
    "area": "identity",
    "actor": "Lucía · persona · web",
    "action": "Ve su perfil personal con el aviso para agregar un correo o su WhatsApp.",
    "route": "/",
    "expected": "Entró como persona. Como solo entra con el correo de su empresa, el inicio le sugiere sumar un correo propio o su WhatsApp para no perder la cuenta si deja la empresa.",
    "source": "docs/design/recorridos/ingresar-como-persona.json#pasos/5",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "04"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-como-persona",
    "step": 5,
    "title": "Está en su perfil personal",
    "board": "Inicio-Personal",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-con-google-01",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Ingresar con Google» y elige su cuenta en Google.",
    "route": "/login",
    "expected": "En el ingreso, Google está arriba de todo. Si su correo de Google es el de su cuenta, entra sin código.",
    "source": "docs/design/recorridos/ingresar-con-google.json#pasos/1",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "ingresar-con-google",
    "step": 1,
    "title": "Elige Google",
    "board": "Ingreso",
    "critical": true,
    "manual": true,
    "manualReason": "El ingreso completo requiere una cuenta real de Google. Los scripts sólo comprueban el destino OAuth desde registro, no este flujo completo de /login.",
    "coverageNotes": [
      "Sólo hay cobertura parcial del desafío OAuth en registro: recorrido-usuario 06/07 y E2E A4; no se importa como paso aprobado de este guion."
    ]
  },
  {
    "id": "GUIA-ingresar-con-google-02",
    "area": "identity",
    "actor": "Sistema",
    "action": "Espera a que se abra la sesión.",
    "route": "/auth/callback",
    "expected": "Google confirma quién es y vuelve al sistema, que abre la sesión.",
    "source": "docs/design/recorridos/ingresar-con-google.json#pasos/2",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "ingresar-con-google",
    "step": 2,
    "title": "Se abre la sesión",
    "board": "Sesion",
    "critical": true,
    "manual": true,
    "manualReason": "El ingreso completo requiere una cuenta real de Google. Los scripts sólo comprueban el destino OAuth desde registro, no este flujo completo de /login."
  },
  {
    "id": "GUIA-ingresar-con-google-03",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Ve su perfil personal.",
    "route": "/",
    "expected": "Entró a su perfil personal, como con el código.",
    "source": "docs/design/recorridos/ingresar-con-google.json#pasos/3",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "ingresar-con-google",
    "step": 3,
    "title": "Está adentro",
    "board": "Inicio-Personal",
    "critical": true,
    "manual": true,
    "manualReason": "El ingreso completo requiere una cuenta real de Google. Los scripts sólo comprueban el destino OAuth desde registro, no este flujo completo de /login."
  },
  {
    "id": "GUIA-ingresar-por-whatsapp-01",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Elige WhatsApp, escribe su número y toca «Enviar código».",
    "route": "/login",
    "expected": "Escribe su número, con el país. Si el número no tuviera cuenta, lo diría ahí mismo.",
    "source": "docs/design/recorridos/ingresar-por-whatsapp.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-02"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-por-whatsapp",
    "step": 1,
    "title": "Elige WhatsApp",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-por-whatsapp-02",
    "area": "system-delivery",
    "actor": "Lucía · WhatsApp",
    "action": "Abre el WhatsApp y copia el código.",
    "route": "—",
    "expected": "El código llega al WhatsApp de su celular, con el botón para copiarlo.",
    "source": "docs/design/recorridos/ingresar-por-whatsapp.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-03"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-por-whatsapp",
    "step": 2,
    "title": "Le llega el código",
    "board": "Mensajes",
    "critical": true,
    "manual": true,
    "manualReason": "El canal de Testing verifica webhook/outbox/OTP controlado; recibir el mensaje en un celular real y delivered de Meta queda a mano."
  },
  {
    "id": "GUIA-ingresar-por-whatsapp-03",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el código y toca «Verificar».",
    "route": "/login",
    "expected": "El mismo código de seis números, de un solo uso.",
    "source": "docs/design/recorridos/ingresar-por-whatsapp.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-04"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-por-whatsapp",
    "step": 3,
    "title": "Pone el código",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-por-whatsapp-04",
    "area": "identity",
    "actor": "Sistema",
    "action": "Espera a que se abra la sesión.",
    "route": "/auth/callback",
    "expected": "El sistema confirma el código y abre la sesión. Es una espera corta, sin nada que tocar.",
    "source": "docs/design/recorridos/ingresar-por-whatsapp.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-05"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-por-whatsapp",
    "step": 4,
    "title": "Se abre la sesión",
    "board": "Sesion",
    "critical": true
  },
  {
    "id": "GUIA-ingresar-por-whatsapp-05",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Ve su perfil personal.",
    "route": "/",
    "expected": "Entró a su perfil personal.",
    "source": "docs/design/recorridos/ingresar-por-whatsapp.json#pasos/5",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-06"
    ],
    "existingE2EGroups": [],
    "flow": "ingresar-por-whatsapp",
    "step": 5,
    "title": "Está adentro",
    "board": "Inicio-Personal",
    "critical": true
  },
  {
    "id": "GUIA-invitar-y-aceptar-01",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Invitar usuario».",
    "route": "/org/usuarios",
    "expected": "En Usuarios, Lucía ve quiénes están, con su estado y sus roles.",
    "source": "docs/design/recorridos/invitar-y-aceptar.json#pasos/1",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "invitar-y-aceptar",
    "step": 1,
    "title": "Invita a alguien",
    "board": "Usuarios",
    "critical": true
  },
  {
    "id": "GUIA-invitar-y-aceptar-02",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe valentina.ruiz@gmail.com, elige sus roles y toca «Invitar».",
    "route": "/org/usuarios",
    "expected": "Escribe el correo de Valentina y, si quiere, sus roles en la organización o en una empresa.",
    "source": "docs/design/recorridos/invitar-y-aceptar.json#pasos/2",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "invitar-y-aceptar",
    "step": 2,
    "title": "Escribe su correo",
    "board": "Usuarios",
    "critical": true
  },
  {
    "id": "GUIA-invitar-y-aceptar-03",
    "area": "system-delivery",
    "actor": "Valentina · invitada · correo",
    "action": "Abre el correo de la invitación.",
    "route": "—",
    "expected": "El correo trae «Ver la invitación» y dice que puede entrar con su correo y un código.",
    "source": "docs/design/recorridos/invitar-y-aceptar.json#pasos/3",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "invitar-y-aceptar",
    "step": 3,
    "title": "Le llega la invitación",
    "board": "Mensajes",
    "critical": true
  },
  {
    "id": "GUIA-invitar-y-aceptar-04",
    "area": "identity",
    "actor": "Valentina · invitada · web",
    "action": "Escribe valentina.ruiz@gmail.com y toca «Enviar código».",
    "route": "/login/empresa",
    "expected": "Entra por la puerta de empresa con el correo invitado. Como tiene una invitación vigente, el ingreso manda el código.",
    "source": "docs/design/recorridos/invitar-y-aceptar.json#pasos/4",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "invitar-y-aceptar",
    "step": 4,
    "title": "Ingresa con su correo",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-invitar-y-aceptar-05",
    "area": "identity",
    "actor": "Valentina · invitada · web",
    "action": "Escribe el código y toca «Verificar».",
    "route": "/login/empresa",
    "expected": "Al ponerlo se crea su cuenta, si no la tenía, y se aceptan todas sus invitaciones vigentes.",
    "source": "docs/design/recorridos/invitar-y-aceptar.json#pasos/5",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "invitar-y-aceptar",
    "step": 5,
    "title": "Pone el código",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-invitar-y-aceptar-06",
    "area": "business",
    "actor": "Valentina · invitada · web",
    "action": "Ve su inicio de miembro.",
    "route": "/org",
    "expected": "Entra como empresa y ve su empresa con su rol. Lucía la ve activa en Usuarios.",
    "source": "docs/design/recorridos/invitar-y-aceptar.json#pasos/6",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "invitar-y-aceptar",
    "step": 6,
    "title": "Ya es parte de la organización",
    "board": "Inicio-Miembro",
    "critical": true
  },
  {
    "id": "GUIA-nombre-y-apellido-01",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Cambia el apellido y toca «Guardar cambios».",
    "route": "/cuenta",
    "expected": "Nombre y apellido van en dos campos. Al cambiar algo, aparece «Cambios sin guardar».",
    "source": "docs/design/recorridos/nombre-y-apellido.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "14"
    ],
    "existingE2EGroups": [
      "A6: nombre y apellido independientes y persistentes"
    ],
    "flow": "nombre-y-apellido",
    "step": 1,
    "title": "Cambia su apellido",
    "board": "Cuenta"
  },
  {
    "id": "GUIA-nombre-y-apellido-02",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Ve el aviso de cambios guardados.",
    "route": "/cuenta",
    "expected": "El cambio se ve en todo el sistema.",
    "source": "docs/design/recorridos/nombre-y-apellido.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "14"
    ],
    "existingE2EGroups": [
      "A6: nombre y apellido independientes y persistentes"
    ],
    "flow": "nombre-y-apellido",
    "step": 2,
    "title": "Queda guardado",
    "board": "Cuenta"
  },
  {
    "id": "GUIA-operador-en-la-puerta-publica-01",
    "area": "identity",
    "actor": "Martín · operador · web",
    "action": "Escribe su correo de operador y toca «Enviar código».",
    "route": "/login",
    "expected": "Nada menciona la plataforma antes del código: su correo se porta como el de cualquier cuenta.",
    "source": "docs/design/recorridos/operador-en-la-puerta-publica.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "13"
    ],
    "existingE2EGroups": [
      "A1: operador probado en ambas puertas sale del lado público y conserva Plataforma"
    ],
    "flow": "operador-en-la-puerta-publica",
    "step": 1,
    "title": "Escribe su correo en el ingreso de todos",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-operador-en-la-puerta-publica-02",
    "area": "identity",
    "actor": "Martín · operador · web",
    "action": "Escribe el código y toca «Verificar».",
    "route": "/login",
    "expected": "El código prueba que el correo es suyo.",
    "source": "docs/design/recorridos/operador-en-la-puerta-publica.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "13"
    ],
    "existingE2EGroups": [
      "A1: operador probado en ambas puertas sale del lado público y conserva Plataforma"
    ],
    "flow": "operador-en-la-puerta-publica",
    "step": 2,
    "title": "Pone su código",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-operador-en-la-puerta-publica-03",
    "area": "identity",
    "actor": "Martín · operador · web",
    "action": "Toca «Ir a Plataforma».",
    "route": "/login",
    "expected": "Recién ahora el sistema le dice que esa cuenta entra por Plataforma. No le abre la sesión de persona ni de empresa.",
    "source": "docs/design/recorridos/operador-en-la-puerta-publica.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "13"
    ],
    "existingE2EGroups": [
      "A1: operador probado en ambas puertas sale del lado público y conserva Plataforma"
    ],
    "flow": "operador-en-la-puerta-publica",
    "step": 3,
    "title": "Una pantalla solo para él",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-operador-en-la-puerta-publica-04",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Escribe el código del autenticador y toca «Verificar».",
    "route": "/plataforma",
    "expected": "En /plataforma pone el código de su autenticador. Plataforma tiene su propia sesión, aparte de la pública.",
    "source": "docs/design/recorridos/operador-en-la-puerta-publica.json#pasos/4",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "A1: operador probado en ambas puertas sale del lado público y conserva Plataforma"
    ],
    "flow": "operador-en-la-puerta-publica",
    "step": 4,
    "title": "Entra con su segundo factor",
    "board": "Ingreso",
    "critical": true
  },
  {
    "id": "GUIA-operador-en-la-puerta-publica-05",
    "area": "assistant",
    "actor": "Martín · operador · web",
    "action": "Ve el inicio de Plataforma.",
    "route": "/plataforma",
    "expected": "Llega al inicio de Plataforma: el asistente y lo que tiene para resolver.",
    "source": "docs/design/recorridos/operador-en-la-puerta-publica.json#pasos/5",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "A1: operador probado en ambas puertas sale del lado público y conserva Plataforma"
    ],
    "flow": "operador-en-la-puerta-publica",
    "step": 5,
    "title": "Está en Plataforma",
    "board": "Asistente-Plat",
    "critical": true
  },
  {
    "id": "GUIA-principal-y-quitar-01",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Toca el ⋮ del WhatsApp.",
    "route": "/cuenta",
    "expected": "Cada método tiene su ⋮ con lo que se puede hacer.",
    "source": "docs/design/recorridos/principal-y-quitar.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-11"
    ],
    "existingE2EGroups": [
      "principal y quitar Phone"
    ],
    "flow": "principal-y-quitar",
    "step": 1,
    "title": "Abre el menú del WhatsApp",
    "board": "Cuenta",
    "critical": true
  },
  {
    "id": "GUIA-principal-y-quitar-02",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Hacer principal».",
    "route": "/cuenta",
    "expected": "El principal es al que le llegan los avisos.",
    "source": "docs/design/recorridos/principal-y-quitar.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-11"
    ],
    "existingE2EGroups": [
      "principal y quitar Phone"
    ],
    "flow": "principal-y-quitar",
    "step": 2,
    "title": "Lo hace principal",
    "board": "Cuenta-Metodo",
    "critical": true
  },
  {
    "id": "GUIA-principal-y-quitar-03",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Hacer principal».",
    "route": "/cuenta",
    "expected": "Alcanza con la sesión iniciada. A sus otros métodos les llega un aviso.",
    "source": "docs/design/recorridos/principal-y-quitar.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-whatsapp.mjs",
      "scripts/test-e2e-real-whatsapp.mjs"
    ],
    "existingCaseIds": [
      "E8-11"
    ],
    "existingE2EGroups": [
      "principal y quitar Phone"
    ],
    "flow": "principal-y-quitar",
    "step": 3,
    "title": "Confirma, sin código",
    "board": "Cuenta-Metodo",
    "critical": true
  },
  {
    "id": "GUIA-principal-y-quitar-04",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Abre el ⋮ del correo, toca «Quitar» y confirma.",
    "route": "/cuenta",
    "expected": "Tampoco pide código. Lo único que no puede es quedarse sin métodos o sin principal.",
    "source": "docs/design/recorridos/principal-y-quitar.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "17"
    ],
    "existingE2EGroups": [
      "A5: propio correo, principal, quitar, baja y cancelación desde la UI"
    ],
    "flow": "principal-y-quitar",
    "step": 4,
    "title": "Quita un correo",
    "board": "Cuenta-Metodo",
    "critical": true
  },
  {
    "id": "GUIA-principal-y-quitar-05",
    "area": "personal/account",
    "actor": "Lucía · Dueña · web",
    "action": "Ve el aviso de correo quitado.",
    "route": "/cuenta",
    "expected": "El correo ya no sirve para entrar, y sus otros métodos reciben el aviso.",
    "source": "docs/design/recorridos/principal-y-quitar.json#pasos/5",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "17"
    ],
    "existingE2EGroups": [
      "A5: propio correo, principal, quitar, baja y cancelación desde la UI"
    ],
    "flow": "principal-y-quitar",
    "step": 5,
    "title": "Listo",
    "board": "Cuenta",
    "critical": true
  },
  {
    "id": "GUIA-publicar-una-version-legal-01",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Toca «Publicar versión nueva».",
    "route": "/plataforma/legales",
    "expected": "Están los términos y la privacidad, con la versión vigente.",
    "source": "docs/design/recorridos/publicar-una-version-legal.json#pasos/1",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5d: publicar y aceptar legales, consultar auditoría y guardar configuración"
    ],
    "flow": "publicar-una-version-legal",
    "step": 1,
    "title": "Va a Documentos legales",
    "board": "Legales"
  },
  {
    "id": "GUIA-publicar-una-version-legal-02",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Completa el documento, la vigencia y los textos y toca «Publicar».",
    "route": "/plataforma/legales",
    "expected": "Elige el documento, la fecha desde la que rige y el texto en español y en inglés.",
    "source": "docs/design/recorridos/publicar-una-version-legal.json#pasos/2",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5d: publicar y aceptar legales, consultar auditoría y guardar configuración"
    ],
    "flow": "publicar-una-version-legal",
    "step": 2,
    "title": "Carga el texto",
    "board": "Legales"
  },
  {
    "id": "GUIA-publicar-una-version-legal-03",
    "area": "identity",
    "actor": "Lucía · Dueña · web",
    "action": "Marca la casilla y toca «Aceptar y seguir».",
    "route": "/aceptar-terminos",
    "expected": "En su próximo ingreso, la versión nueva aparece antes de seguir.",
    "source": "docs/design/recorridos/publicar-una-version-legal.json#pasos/3",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5d: publicar y aceptar legales, consultar auditoría y guardar configuración"
    ],
    "flow": "publicar-una-version-legal",
    "step": 3,
    "title": "Lucía la acepta al entrar",
    "board": "Aceptar-Terminos"
  },
  {
    "id": "GUIA-publicar-y-encontrar-01",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Prende «Publicar la página» y toca «Guardar cambios».",
    "route": "/org/pagina",
    "expected": "La página pública está en borrador. La prende y guarda.",
    "source": "docs/design/recorridos/publicar-y-encontrar.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "25"
    ],
    "existingE2EGroups": [],
    "flow": "publicar-y-encontrar",
    "step": 1,
    "title": "Prende la página",
    "board": "Pagina-Org"
  },
  {
    "id": "GUIA-publicar-y-encontrar-02",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Ve la página publicada.",
    "route": "/org/pagina",
    "expected": "La página se ve en su subdominio y la organización aparece en el directorio.",
    "source": "docs/design/recorridos/publicar-y-encontrar.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "25"
    ],
    "existingE2EGroups": [],
    "flow": "publicar-y-encontrar",
    "step": 2,
    "title": "Queda publicada",
    "board": "Pagina-Org"
  },
  {
    "id": "GUIA-publicar-y-encontrar-03",
    "area": "public",
    "actor": "Mariana · persona · web",
    "action": "Busca por nombre y toca la tarjeta de la organización.",
    "route": "/empresas",
    "expected": "Mariana busca en «Empresas en ArquitecturaBase» y encuentra la organización.",
    "source": "docs/design/recorridos/publicar-y-encontrar.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "27"
    ],
    "existingE2EGroups": [],
    "flow": "publicar-y-encontrar",
    "step": 3,
    "title": "La encuentra en el directorio",
    "board": "Directorio"
  },
  {
    "id": "GUIA-publicar-y-encontrar-04",
    "area": "public",
    "actor": "Mariana · persona · web",
    "action": "Toca «Ingresá para continuar».",
    "route": "delta.plataforma.com",
    "expected": "La página muestra el logo, la descripción y el contacto.",
    "source": "docs/design/recorridos/publicar-y-encontrar.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "28"
    ],
    "existingE2EGroups": [],
    "flow": "publicar-y-encontrar",
    "step": 4,
    "title": "Ve la página",
    "board": "Pagina-Publica"
  },
  {
    "id": "GUIA-publicar-y-encontrar-05",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Escribe mariana.lopez@gmail.com y sigue con el código.",
    "route": "/login",
    "expected": "Entra con su correo y su código, como siempre.",
    "source": "docs/design/recorridos/publicar-y-encontrar.json#pasos/5",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "29"
    ],
    "existingE2EGroups": [],
    "flow": "publicar-y-encontrar",
    "step": 5,
    "title": "Ingresa con su cuenta",
    "board": "Ingreso"
  },
  {
    "id": "GUIA-publicar-y-encontrar-06",
    "area": "public",
    "actor": "Mariana · persona · web",
    "action": "Ve la página con su sesión iniciada.",
    "route": "delta.plataforma.com",
    "expected": "Después de ingresar, vuelve a la página de la organización, ya con su sesión.",
    "source": "docs/design/recorridos/publicar-y-encontrar.json#pasos/6",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "29"
    ],
    "existingE2EGroups": [],
    "flow": "publicar-y-encontrar",
    "step": 6,
    "title": "Vuelve a la misma página",
    "board": "Pagina-Publica"
  },
  {
    "id": "GUIA-registrar-empresa-01",
    "area": "public",
    "actor": "Mariana · persona · web",
    "action": "Toca «Registrá tu empresa».",
    "route": "/",
    "expected": "Mariana quiere usar el sistema con su grupo de empresas. Desde la portada toca «Registrá tu empresa».",
    "source": "docs/design/recorridos/registrar-empresa.json#pasos/1",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "registrar-empresa",
    "step": 1,
    "title": "Quiere registrar su empresa",
    "board": "Landing",
    "critical": true
  },
  {
    "id": "GUIA-registrar-empresa-02",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Marca la casilla, escribe mariana.lopez@gmail.com y toca «Continuar».",
    "route": "/registro/empresa",
    "expected": "Acepta los términos y escribe su correo. Si ya tiene una cuenta, se usa esa: no hace falta otra.",
    "source": "docs/design/recorridos/registrar-empresa.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "08"
    ],
    "existingE2EGroups": [
      "6: registrar empresa por correo sin crear Personal"
    ],
    "flow": "registrar-empresa",
    "step": 2,
    "title": "Prueba que el correo es suyo",
    "board": "Registro-Empresa",
    "critical": true
  },
  {
    "id": "GUIA-registrar-empresa-03",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Escribe el código y toca «Verificar».",
    "route": "/registro/empresa",
    "expected": "Le llega un código al correo, de un solo uso y con vencimiento.",
    "source": "docs/design/recorridos/registrar-empresa.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [
      "08"
    ],
    "existingE2EGroups": [
      "6: registrar empresa por correo sin crear Personal"
    ],
    "flow": "registrar-empresa",
    "step": 3,
    "title": "Pone el código",
    "board": "Registro-Empresa",
    "critical": true
  },
  {
    "id": "GUIA-registrar-empresa-04",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Completa la organización, la dirección y la primera empresa, y toca «Crear organización».",
    "route": "/registro/empresa",
    "expected": "Escribe el nombre de la organización, la dirección de su página en el subdominio y su primera empresa con el CUIT.",
    "source": "docs/design/recorridos/registrar-empresa.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs",
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "A10: CUIT con mensajes por causa y tipo fiscal de la organización"
    ],
    "flow": "registrar-empresa",
    "step": 4,
    "title": "Carga su organización",
    "board": "Registro-Empresa",
    "critical": true,
    "coverageNotes": [
      "Recorrido 08 crea sin CUIT. El grupo E2E A10 sí verifica CUIT en el registro empresarial; no dispone de ID de evidencia del recorrido para esa variante."
    ]
  },
  {
    "id": "GUIA-registrar-empresa-05",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Ve que el pedido quedó en revisión.",
    "route": "/registro/empresa",
    "expected": "La plataforma revisa la organización antes de habilitarla. Cuando la aprueba, le llega un aviso por correo y, si lo tiene, por WhatsApp.",
    "source": "docs/design/recorridos/registrar-empresa.json#pasos/5",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "registrar-empresa",
    "step": 5,
    "title": "Espera la aprobación",
    "board": "Registro-Empresa",
    "critical": true,
    "coverageNotes": [
      "Recorrido 08 automatiza el modo de aprobación automática; este estado pendiente requiere configuración distinta y no se importa como aprobado."
    ]
  },
  {
    "id": "GUIA-registrarse-01",
    "area": "public",
    "actor": "Mariana · persona · web",
    "action": "Toca «Crear mi cuenta».",
    "route": "/",
    "expected": "Mariana todavía no tiene cuenta. En la portada, «Crear mi cuenta» es para personas; «Registrá tu empresa», para organizaciones.",
    "source": "docs/design/recorridos/registrarse.json#pasos/1",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "registrarse",
    "step": 1,
    "title": "Quiere crear su cuenta",
    "board": "Landing",
    "critical": true
  },
  {
    "id": "GUIA-registrarse-02",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Marca la casilla, escribe mariana.lopez@gmail.com y toca «Crear cuenta».",
    "route": "/registro",
    "expected": "Marca la casilla de los términos y la privacidad y escribe su correo. También podría registrarse con Google o con WhatsApp.",
    "source": "docs/design/recorridos/registrarse.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "02"
    ],
    "existingE2EGroups": [],
    "flow": "registrarse",
    "step": 2,
    "title": "Acepta los términos y escribe su correo",
    "board": "Registro",
    "critical": true
  },
  {
    "id": "GUIA-registrarse-03",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Escribe el código y toca «Verificar y crear la cuenta».",
    "route": "/registro",
    "expected": "Le llega un código al correo. Con él prueba que el correo es suyo y la cuenta queda creada.",
    "source": "docs/design/recorridos/registrarse.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "02"
    ],
    "existingE2EGroups": [],
    "flow": "registrarse",
    "step": 3,
    "title": "Confirma el correo",
    "board": "Registro",
    "critical": true
  },
  {
    "id": "GUIA-registrarse-04",
    "area": "identity",
    "actor": "Sistema",
    "action": "Espera a que se abra la sesión.",
    "route": "/auth/callback",
    "expected": "El sistema confirma el código y abre la sesión. Es una espera corta, sin nada que tocar.",
    "source": "docs/design/recorridos/registrarse.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "02"
    ],
    "existingE2EGroups": [],
    "flow": "registrarse",
    "step": 4,
    "title": "Se abre la sesión",
    "board": "Sesion",
    "critical": true
  },
  {
    "id": "GUIA-registrarse-05",
    "area": "identity",
    "actor": "Mariana · persona · web",
    "action": "Ve su perfil personal.",
    "route": "/",
    "expected": "Entró a su perfil personal. Con esta misma cuenta puede registrar una empresa o aceptar una invitación más adelante.",
    "source": "docs/design/recorridos/registrarse.json#pasos/5",
    "existingScripts": [
      "scripts/recorrido-usuario.mjs"
    ],
    "existingCaseIds": [
      "02"
    ],
    "existingE2EGroups": [],
    "flow": "registrarse",
    "step": 5,
    "title": "Ya tiene su cuenta",
    "board": "Inicio-Personal",
    "critical": true
  },
  {
    "id": "GUIA-sumar-una-empresa-01",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Crear empresa».",
    "route": "/org/empresas",
    "expected": "Ve las empresas de la organización.",
    "source": "docs/design/recorridos/sumar-una-empresa.json#pasos/1",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "6: invitar desde Usuarios y aceptar con/sin cuenta previa"
    ],
    "flow": "sumar-una-empresa",
    "step": 1,
    "title": "Va a Empresas",
    "board": "Empresas"
  },
  {
    "id": "GUIA-sumar-una-empresa-02",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Escribe el nombre y el CUIT y toca «Crear empresa».",
    "route": "/org/empresas",
    "expected": "Escribe el nombre y el CUIT. La zona horaria es la de la organización, salvo que elija otra.",
    "source": "docs/design/recorridos/sumar-una-empresa.json#pasos/2",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "sumar-una-empresa",
    "step": 2,
    "title": "Carga la empresa",
    "board": "Empresas",
    "coverageNotes": [
      "E2E 6 crea una empresa sin CUIT y vincula por invitación; no se importa como cobertura de crear con CUIT ni de Agregar miembro desde la ficha."
    ]
  },
  {
    "id": "GUIA-sumar-una-empresa-03",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Agregar miembro».",
    "route": "/org/empresas/:id",
    "expected": "En la ficha de la empresa están sus miembros y sus roles.",
    "source": "docs/design/recorridos/sumar-una-empresa.json#pasos/3",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "sumar-una-empresa",
    "step": 3,
    "title": "Abre la empresa",
    "board": "Empresa",
    "coverageNotes": [
      "E2E 6 crea una empresa sin CUIT y vincula por invitación; no se importa como cobertura de crear con CUIT ni de Agregar miembro desde la ficha."
    ]
  },
  {
    "id": "GUIA-sumar-una-empresa-04",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Elige a la persona y sus roles y toca «Agregar miembro».",
    "route": "/org/empresas/:id",
    "expected": "Elige a una persona de la organización y sus roles en esta empresa.",
    "source": "docs/design/recorridos/sumar-una-empresa.json#pasos/4",
    "existingScripts": [],
    "existingCaseIds": [],
    "existingE2EGroups": [],
    "flow": "sumar-una-empresa",
    "step": 4,
    "title": "Suma a alguien",
    "board": "Empresa",
    "coverageNotes": [
      "E2E 6 crea una empresa sin CUIT y vincula por invitación; no se importa como cobertura de crear con CUIT ni de Agregar miembro desde la ficha."
    ]
  },
  {
    "id": "GUIA-suspender-y-reactivar-01",
    "area": "personal/account",
    "actor": "Martín · operador · web",
    "action": "Busca la cuenta y la abre.",
    "route": "/plataforma/cuentas",
    "expected": "En Cuentas están las personas y los operadores.",
    "source": "docs/design/recorridos/suspender-y-reactivar.json#pasos/1",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "suspender-y-reactivar",
    "step": 1,
    "title": "Busca la cuenta",
    "board": "Cuentas"
  },
  {
    "id": "GUIA-suspender-y-reactivar-02",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Toca «Suspender».",
    "route": "/plataforma/cuentas/:id",
    "expected": "Ve sus métodos de ingreso, sus organizaciones y su historial de seguridad.",
    "source": "docs/design/recorridos/suspender-y-reactivar.json#pasos/2",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "suspender-y-reactivar",
    "step": 2,
    "title": "Abre la ficha",
    "board": "Cuenta-Plat"
  },
  {
    "id": "GUIA-suspender-y-reactivar-03",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Escribe el motivo y toca «Suspender».",
    "route": "/plataforma/cuentas/:id",
    "expected": "Suspender cierra sus sesiones y le impide entrar. El motivo queda en el historial.",
    "source": "docs/design/recorridos/suspender-y-reactivar.json#pasos/3",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "suspender-y-reactivar",
    "step": 3,
    "title": "Confirma con un motivo",
    "board": "Cuenta-Plat"
  },
  {
    "id": "GUIA-suspender-y-reactivar-04",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Toca «Reactivar».",
    "route": "/plataforma/cuentas/:id",
    "expected": "La ficha muestra la suspensión. Cuando se resuelve, la reactiva.",
    "source": "docs/design/recorridos/suspender-y-reactivar.json#pasos/4",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "suspender-y-reactivar",
    "step": 4,
    "title": "Queda suspendida",
    "board": "Cuenta-Plat"
  },
  {
    "id": "GUIA-suspender-y-reactivar-05",
    "area": "platform",
    "actor": "Martín · operador · web",
    "action": "Ve la cuenta activa.",
    "route": "/plataforma/cuentas/:id",
    "expected": "La persona puede volver a entrar.",
    "source": "docs/design/recorridos/suspender-y-reactivar.json#pasos/5",
    "existingScripts": [
      "scripts/test-e2e-real.test.mjs"
    ],
    "existingCaseIds": [],
    "existingE2EGroups": [
      "5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas"
    ],
    "flow": "suspender-y-reactivar",
    "step": 5,
    "title": "Vuelve a estar activa",
    "board": "Cuenta-Plat"
  },
  {
    "id": "GUIA-una-consulta-fija-01",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Invitaciones vencidas».",
    "route": "/org",
    "expected": "Las consultas fijas no gastan el modelo: son gratis e instantáneas.",
    "source": "docs/design/recorridos/una-consulta-fija.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-20-1"
    ],
    "existingE2EGroups": [],
    "flow": "una-consulta-fija",
    "step": 1,
    "title": "Elige una consulta fija",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-una-consulta-fija-02",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Ver en Usuarios».",
    "route": "/org",
    "expected": "La respuesta tiene un texto armado y un enlace a la pantalla donde se hace cada cosa.",
    "source": "docs/design/recorridos/una-consulta-fija.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-20-2"
    ],
    "existingE2EGroups": [],
    "flow": "una-consulta-fija",
    "step": 2,
    "title": "Ve la respuesta",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-una-consulta-fija-03",
    "area": "business",
    "actor": "Lucía · Dueña · web",
    "action": "Ve las invitaciones en Usuarios.",
    "route": "/org/usuarios",
    "expected": "Desde Usuarios reenvía las invitaciones vencidas.",
    "source": "docs/design/recorridos/una-consulta-fija.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-20-3"
    ],
    "existingE2EGroups": [],
    "flow": "una-consulta-fija",
    "step": 3,
    "title": "Va a la pantalla",
    "board": "Usuarios"
  },
  {
    "id": "GUIA-una-pregunta-con-herramienta-01",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Adjunta la planilla, escribe la pregunta y la envía.",
    "route": "/org",
    "expected": "Puede adjuntar imágenes o PDF, hasta 10 MB y 5 por consulta.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/1",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-30-1"
    ],
    "existingE2EGroups": [],
    "flow": "una-pregunta-con-herramienta",
    "step": 1,
    "title": "Adjunta y pregunta",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-una-pregunta-con-herramienta-02",
    "area": "assistant",
    "actor": "Sistema",
    "action": "Espera la respuesta; puede tocar «Detener».",
    "route": "/org",
    "expected": "Mientras corre una herramienta, muestra «Consultando usuarios…». Solo ve lo que Lucía ya puede ver.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/2",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-30-2"
    ],
    "existingE2EGroups": [],
    "flow": "una-pregunta-con-herramienta",
    "step": 2,
    "title": "Consulta con las herramientas",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-una-pregunta-con-herramienta-03",
    "area": "assistant",
    "actor": "Sistema",
    "action": "Lee la respuesta mientras se escribe.",
    "route": "/org",
    "expected": "La respuesta aparece a medida que se escribe. «Detener» la corta.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/3",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-30-3"
    ],
    "existingE2EGroups": [],
    "flow": "una-pregunta-con-herramienta",
    "step": 3,
    "title": "Escribe la respuesta",
    "board": "Asistente-Org"
  },
  {
    "id": "GUIA-una-pregunta-con-herramienta-04",
    "area": "assistant",
    "actor": "Lucía · Dueña · web",
    "action": "Toca «Me sirvió».",
    "route": "/org",
    "expected": "Puede copiar la respuesta y marcar si le sirvió.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/4",
    "existingScripts": [
      "scripts/recorrido-usuario-asistente.mjs",
      "scripts/test-e2e-real-assistant.mjs"
    ],
    "existingCaseIds": [
      "E8B-30-4"
    ],
    "existingE2EGroups": [],
    "flow": "una-pregunta-con-herramienta",
    "step": 4,
    "title": "Lee y califica",
    "board": "Asistente-Org"
  }
];

export const existingScriptCases = [
  {
    "id": "01",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "1 · Persona sin cuenta",
    "expected": "Desde la portada, Ingresá rechaza el correo desconocido y ofrece Crear mi cuenta sin enviar código.",
    "source": "scripts/recorrido-usuario.mjs:118"
  },
  {
    "id": "02",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "1 · Registro desde el ingreso",
    "expected": "El correo viene escrito; aceptar términos y verificar el .eml lleva al inicio Personal.",
    "source": "scripts/recorrido-usuario.mjs:119"
  },
  {
    "id": "03",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "2 · Cuenta existente en registro",
    "expected": "Crear mi cuenta con el mismo correo informa que ya existe y ofrece Ingresar con el correo conservado.",
    "source": "scripts/recorrido-usuario.mjs:120"
  },
  {
    "id": "04",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "2 · Ingreso por código",
    "expected": "El código del pickup lleva al inicio Personal.",
    "source": "scripts/recorrido-usuario.mjs:121"
  },
  {
    "id": "05",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "2 · Salir y volver a ingresar",
    "expected": "La salida por UI vuelve a la portada y otro código permite entrar en el mismo contexto.",
    "source": "scripts/recorrido-usuario.mjs:122"
  },
  {
    "id": "06",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "3 · Google en registro de persona",
    "expected": "Sin escribir correo, Registrarte con Google inicia OAuth real hacia accounts.google.com.",
    "source": "scripts/recorrido-usuario.mjs:123"
  },
  {
    "id": "07",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "3 · Google en registro de empresa",
    "expected": "Sin escribir correo, Seguir con Google inicia OAuth real hacia accounts.google.com.",
    "source": "scripts/recorrido-usuario.mjs:124"
  },
  {
    "id": "08",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "4 · Registrar una empresa",
    "expected": "Un correo nuevo verifica su .eml, crea organización y primera empresa, y entra a /org.",
    "source": "scripts/recorrido-usuario.mjs:125"
  },
  {
    "id": "09",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "4 · Persona sin empresa",
    "expected": "Ingresá como empresa con la cuenta personal muestra que no está en ninguna empresa y ofrece una salida.",
    "source": "scripts/recorrido-usuario.mjs:126"
  },
  {
    "id": "10",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "4 · Cuenta con empresa",
    "expected": "Ingresá como empresa lleva a la organización propia y conserva el acceso tras recargar.",
    "source": "scripts/recorrido-usuario.mjs:127"
  },
  {
    "id": "11",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "5 · Ingreso del operador",
    "expected": "El operador ingresa por código a Plataforma.",
    "source": "scripts/recorrido-usuario.mjs:128"
  },
  {
    "id": "12",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "5 · Operador y persona conviven",
    "expected": "Otra pestaña muestra el ingreso, permite entrar a otra persona y Plataforma sigue abierta tras F5.",
    "source": "scripts/recorrido-usuario.mjs:129"
  },
  {
    "id": "13",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "5 · Operador en puerta personal",
    "expected": "Antes del código no revela Plataforma; después muestra la pantalla privada y Salir conserva Plataforma.",
    "source": "scripts/recorrido-usuario.mjs:130"
  },
  {
    "id": "14",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "6 · Guardar nombre y apellido",
    "expected": "Mi cuenta guarda las dos partes y F5 conserva el nombre completo.",
    "source": "scripts/recorrido-usuario.mjs:131"
  },
  {
    "id": "15",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "6 · Agregar correo",
    "expected": "Solo se envía un código al correo nuevo; verificarlo lo agrega a Cómo entrás.",
    "source": "scripts/recorrido-usuario.mjs:132"
  },
  {
    "id": "16",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "6 · Cambiar principal",
    "expected": "Hacer principal confirma y guarda sin pedir ni enviar otro código.",
    "source": "scripts/recorrido-usuario.mjs:133"
  },
  {
    "id": "17",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "6 · Quitar correo",
    "expected": "Quitar confirma sin código y conserva el otro método como principal.",
    "source": "scripts/recorrido-usuario.mjs:134"
  },
  {
    "id": "18",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "6 · Correo de otra cuenta",
    "expected": "Agregar un correo verificado ajeno informa que ya está asociado, sin enviar código.",
    "source": "scripts/recorrido-usuario.mjs:135"
  },
  {
    "id": "19",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "7 · Recuperación sin cuenta",
    "expected": "Recuperar mi cuenta informa que el correo anterior no tiene cuenta.",
    "source": "scripts/recorrido-usuario.mjs:136"
  },
  {
    "id": "20",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "7 · Recuperación con correo ocupado",
    "expected": "Un correo nuevo que es de otra cuenta se rechaza con explicación concreta.",
    "source": "scripts/recorrido-usuario.mjs:137"
  },
  {
    "id": "21",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "8 · Correo mal escrito",
    "expected": "El ingreso pide un correo electrónico válido y conserva una acción para corregirlo.",
    "source": "scripts/recorrido-usuario.mjs:138"
  },
  {
    "id": "22",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "8 · Código equivocado",
    "expected": "El código incorrecto informa El código no es válido y permite verificar o pedir otro.",
    "source": "scripts/recorrido-usuario.mjs:139"
  },
  {
    "id": "23",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "8 · Otro código antes de tiempo",
    "expected": "Otra solicitud inmediata respeta el cooldown e informa Esperá un momento antes de pedir otro código.",
    "source": "scripts/recorrido-usuario.mjs:140"
  },
  {
    "id": "24",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "8 · Código vencido",
    "expected": "Un desafío real vencido informa El código venció. Pedí uno nuevo, con salida para reenviar.",
    "source": "scripts/recorrido-usuario.mjs:141"
  },
  {
    "id": "25",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "E7 · Empresa publica su página",
    "expected": "El Dueño guarda y publica por UI su página con el interruptor de publicación.",
    "source": "scripts/recorrido-usuario.mjs:142"
  },
  {
    "id": "26",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "E7 · Portada con la empresa",
    "expected": "La publicación aparece en Empresas en ArquitecturaBase.",
    "source": "scripts/recorrido-usuario.mjs:143"
  },
  {
    "id": "27",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "E7 · Directorio y búsqueda",
    "expected": "Ver todas las empresas abre /empresas y el buscador encuentra la publicación.",
    "source": "scripts/recorrido-usuario.mjs:144"
  },
  {
    "id": "28",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "E7 · Tarjeta y subdominio",
    "expected": "La tarjeta abre la publicación en su subdominio y muestra Ingresá para continuar.",
    "source": "scripts/recorrido-usuario.mjs:145"
  },
  {
    "id": "29",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "E7 · Persona vuelve con su menú",
    "expected": "Ingresar desde la publicación vuelve al mismo subdominio con el menú; F5 conserva la sesión.",
    "source": "scripts/recorrido-usuario.mjs:146"
  },
  {
    "id": "30",
    "script": "scripts/recorrido-usuario.mjs",
    "title": "E7 · Página sin publicar",
    "expected": "Al despublicar por UI, ese mismo subdominio dice Esta página no está disponible.",
    "source": "scripts/recorrido-usuario.mjs:147"
  },
  {
    "id": "E8-01",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Preparar una cuenta Phone por UI",
    "expected": "Registro por WhatsApp y OTP controlado crean una persona sin nombre, sin correo y con Phone principal.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:19"
  },
  {
    "id": "E8-02",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Ingresar por WhatsApp · enviar",
    "expected": "Elige WhatsApp y envía un código a su número; el país viene de la API.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:20"
  },
  {
    "id": "E8-03",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Ingresar por WhatsApp · código",
    "expected": "La pantalla pide el OTP; se lee del outbox real por control privado, sin certificar entrega al celular.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:21"
  },
  {
    "id": "E8-04",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Ingresar por WhatsApp · verificar",
    "expected": "El OTP verifica posesión antes de completar la autorización OIDC inicial, sin iniciar otra durante el envío.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:22"
  },
  {
    "id": "E8-05",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Ingresar por WhatsApp · sesión",
    "expected": "OIDC usa state y PKCE actuales, acceso consumer y retorno propio.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:23"
  },
  {
    "id": "E8-06",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Ingresar por WhatsApp · Personal",
    "expected": "Personal y F5 conservan el acceso, en el mismo contexto que Plataforma.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:24"
  },
  {
    "id": "E8-07",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Agregar WhatsApp · abrir",
    "expected": "Mi cuenta ofrece Agregar correo o teléfono.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:25"
  },
  {
    "id": "E8-08",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Agregar WhatsApp · enviar",
    "expected": "WhatsApp y el número nuevo envían el código sólo al nuevo método.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:26"
  },
  {
    "id": "E8-09",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Agregar WhatsApp · código",
    "expected": "OTP controlado del nuevo Phone; la captura oculta las casillas y no representa WhatsApp real.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:27"
  },
  {
    "id": "E8-10",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Agregar WhatsApp · verificar",
    "expected": "Verificar agrega el Phone real; F5 lo conserva en Cómo entrás.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:28"
  },
  {
    "id": "E8-11",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Principal y quitar sin otro OTP",
    "expected": "Hacer principal y Quitar confirman sin pedir ni enviar código adicional, según ADR0045.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:29"
  },
  {
    "id": "E8-12",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Phone con correo de respaldo",
    "expected": "Email verificado de respaldo no desplaza Phone principal: Me, menú/lateral o Más/barra usan la máscara literal y avatar con raya.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:30"
  },
  {
    "id": "E8-13",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Registro existente → ingreso Persona",
    "expected": "Registro ocupado conserva Phone en memoria al ir a Ingresar; OTP fijo abre consumer en / sin teléfono en URL/storage.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:31"
  },
  {
    "id": "E8-14",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Bot · respuesta controlada",
    "expected": "Webhook firmado y deduplicado procesa Hola y devuelve el enlace del outbox real; Meta queda manual.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:32"
  },
  {
    "id": "E8-15",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Bot · vista previa",
    "expected": "La vista previa limpia el fragmento y ofrece Continuar sin iniciar OIDC ni canjear el ticket.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:33"
  },
  {
    "id": "E8-16",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Bot · sesión",
    "expected": "Sólo Continuar canjea el ticket e inicia OIDC con state/PKCE actuales.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:34"
  },
  {
    "id": "E8-17",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Bot · Personal",
    "expected": "Personal y F5 conservan la sesión; el enlace usado se rechaza al volver a abrirlo.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:35"
  },
  {
    "id": "E8-18",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Menú público con Phone principal",
    "expected": "La publicación E7 conserva la sesión Personal tras F5 y muestra la máscara recibida sin usar el correo de respaldo.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:36"
  },
  {
    "id": "E8-19",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Cuentas y ficha con Phone principal",
    "expected": "Plataforma ya abierta identifica lista, acciones y ficha por la máscara principal; F5 conserva Phone y Email de respaldo verificado.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:37"
  },
  {
    "id": "E8-20",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Pedir recuperación Phone",
    "expected": "Recuperar verifica el método nuevo por OTP controlado y registra un pedido Pending por UI.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:38"
  },
  {
    "id": "E8-21",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Recuperación · abrir pedido",
    "expected": "Se correlaciona el pedido por métodos tapados y se abre el formulario Pending con su versión original.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:39"
  },
  {
    "id": "E8-22",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Recuperación · aviso y aprobación",
    "expected": "El aviso real y su repetición no cambian la versión leída; una aprobación UI usa esa versión y F5 conserva Approved.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:40"
  },
  {
    "id": "E8-23",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Recuperación · volver a ingresar",
    "expected": "El nuevo Phone ingresa a la cuenta recuperada; recibir el aviso en WhatsApp real queda manual.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:41"
  },
  {
    "id": "E8-24",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Alta empresarial Phone por UI",
    "expected": "OTP controlado y creación de organización por UI llevan a /org sin certificar bienvenida E8b.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:42"
  },
  {
    "id": "E8-25",
    "script": "scripts/recorrido-usuario-whatsapp.mjs",
    "title": "Registro existente → ingreso Empresa",
    "expected": "Ingresá como empresa conserva Phone en memoria; OTP fija business y /org, conserva máscara en Me/marco/F5 y no expone Phone en URL/storage.",
    "source": "scripts/recorrido-usuario-whatsapp.mjs:43"
  },
  {
    "id": "E9-01",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Primer ingreso de un operador",
    "expected": "Después del código del correo, Plataforma pide configurar el autenticador: el QR, la clave para escribirla a mano y el código de 6 números. La captura tapa el QR y la clave.",
    "source": "scripts/recorrido-usuario-e9.mjs:14"
  },
  {
    "id": "E9-02",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Los ocho códigos de recuperación",
    "expected": "El código de la app activa el autenticador y muestra los 8 códigos para descargar o copiar; «Entrar a la plataforma» espera «Los guardé en un lugar seguro». La captura tapa los códigos.",
    "source": "scripts/recorrido-usuario-e9.mjs:15"
  },
  {
    "id": "E9-03",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Confirmá que sos vos",
    "expected": "Con la prueba reciente vencida, guardar los permisos de otro operador abre «Confirmá que sos vos» en lugar del diálogo, que queda oculto con lo cargado.",
    "source": "scripts/recorrido-usuario-e9.mjs:16"
  },
  {
    "id": "E9-04",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Confirmar con la app guarda una vez",
    "expected": "El código de la app confirma y el mismo guardado sale una sola vez más, con la misma clave: «Cambiamos los permisos de …».",
    "source": "scripts/recorrido-usuario-e9.mjs:17"
  },
  {
    "id": "E9-05",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Restablecer el autenticador de otro operador",
    "expected": "Desde la ficha del otro operador, «Restablecer el autenticador» pide un motivo y avisa «Restablecimos el autenticador de …».",
    "source": "scripts/recorrido-usuario-e9.mjs:18"
  },
  {
    "id": "E9-06",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Configuración › Límites de uso",
    "expected": "Configuración muestra los doce límites de uso en sus cuatro grupos (todo el servicio, Ingreso, Asistente y WhatsApp), cada uno con pedidos y «cada».",
    "source": "scripts/recorrido-usuario-e9.mjs:19"
  },
  {
    "id": "E9-07",
    "script": "scripts/recorrido-usuario-e9.mjs",
    "title": "Auditoría con los eventos del autenticador",
    "expected": "Auditoría muestra el alta del autenticador, el restablecimiento, la confirmación y el ingreso con el autenticador, sin códigos ni claves.",
    "source": "scripts/recorrido-usuario-e9.mjs:20"
  },
  {
    "id": "E11-01",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Prender WhatsApp para la organización",
    "expected": "Plataforma › Organización › Módulos prende WhatsApp con motivo, por UI y con la versión leída.",
    "source": "scripts/recorrido-usuario-e11.mjs:17"
  },
  {
    "id": "E11-02",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Número conectado",
    "expected": "El control conecta un número sin Meta; la Dueña lo ve Conectado en Números y F5 lo conserva.",
    "source": "scripts/recorrido-usuario-e11.mjs:18"
  },
  {
    "id": "E11-03",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Equipos Ventas y Soporte",
    "expected": "La Dueña crea dos equipos de Clientes por UI, con una persona y sin aviso por correo.",
    "source": "scripts/recorrido-usuario-e11.mjs:19"
  },
  {
    "id": "E11-04",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Opción del bot",
    "expected": "El bot del número suma «Hacer un pedido», que pasa a Ventas; F5 la conserva.",
    "source": "scripts/recorrido-usuario-e11.mjs:20"
  },
  {
    "id": "E11-05",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Cliente con cuenta por WhatsApp",
    "expected": "El registro por WhatsApp y el OTP controlado crean la cuenta Phone de quien va a escribir.",
    "source": "scripts/recorrido-usuario-e11.mjs:21"
  },
  {
    "id": "E11-06",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "El cliente escribe y recibe el menú",
    "expected": "«Hola» entra firmado al webhook real y el bot contesta la bienvenida con su menú, todavía sin ofrecer vincular.",
    "source": "scripts/recorrido-usuario-e11.mjs:22"
  },
  {
    "id": "E11-07",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Elige una opción y pasa al bot",
    "expected": "La fila «Hacer un pedido» pasa la conversación a Ventas y el bot ofrece «Vincular mi cuenta».",
    "source": "scripts/recorrido-usuario-e11.mjs:23"
  },
  {
    "id": "E11-08",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Vincula su cuenta",
    "expected": "El botón del bot vincula la conversación con la cuenta y el bot lo confirma.",
    "source": "scripts/recorrido-usuario-e11.mjs:24"
  },
  {
    "id": "E11-09",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Chats: contador y conversación sin tomar",
    "expected": "Chats cuenta una sin tomar; la conversación está en Ventas, vinculada a su cuenta.",
    "source": "scripts/recorrido-usuario-e11.mjs:25"
  },
  {
    "id": "E11-10",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Tomar y responder",
    "expected": "Tomar y responder dejan la respuesta en el hilo y en el outbox de prueba, sin «entregado» ni Meta.",
    "source": "scripts/recorrido-usuario-e11.mjs:26"
  },
  {
    "id": "E11-11",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Nota interna",
    "expected": "La nota queda en el hilo para el equipo y nunca sale: el outbox no suma nada.",
    "source": "scripts/recorrido-usuario-e11.mjs:27"
  },
  {
    "id": "E11-12",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Pasar a Soporte",
    "expected": "Pasar manda la versión de la fila y la conversación queda en Soporte.",
    "source": "scripts/recorrido-usuario-e11.mjs:28"
  },
  {
    "id": "E11-13",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Contacto con etiqueta nueva",
    "expected": "La ficha del contacto edita sus etiquetas creando una nueva; F5 la conserva.",
    "source": "scripts/recorrido-usuario-e11.mjs:29"
  },
  {
    "id": "E11-14",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Cargar teléfonos: revisar",
    "expected": "La revisión dice cuántos se invitan y cuántos son inválidos, sin decir si hay cuenta y sin mandar invitaciones.",
    "source": "scripts/recorrido-usuario-e11.mjs:30"
  },
  {
    "id": "E11-15",
    "script": "scripts/recorrido-usuario-e11.mjs",
    "title": "Mensajes de la persona",
    "expected": "La persona entra por WhatsApp y ve en «Mensajes» la respuesta de la organización y nunca la nota.",
    "source": "scripts/recorrido-usuario-e11.mjs:31"
  },
  {
    "id": "E8B-10-1",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Lee el aviso",
    "expected": "La primera vez, el asistente avisa que las consultas las procesa un proveedor de IA y que no suba datos sensibles. «Entendido» queda registrado.",
    "source": "docs/design/recorridos/asistente-primera-vez.json#pasos/1"
  },
  {
    "id": "E8B-10-2",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Ya puede preguntar",
    "expected": "Ve «¿Qué querés consultar?», las consultas fijas y, debajo, lo que tiene para resolver.",
    "source": "docs/design/recorridos/asistente-primera-vez.json#pasos/2"
  },
  {
    "id": "E8B-50-1",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Permite la clave propia",
    "expected": "En los módulos de la organización, el Asistente dice qué clave usa.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/1"
  },
  {
    "id": "E8B-50-2",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Elige «La nuestra»",
    "expected": "Ahora puede elegir qué clave usa. Para usar la propia, algún Dueño tiene que tener un correo verificado.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/2"
  },
  {
    "id": "E8B-50-3",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Pega la clave",
    "expected": "Pega la clave de Anthropic; después solo se ve tapada. Con su clave elige cualquier modelo y fija sus topes.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/3"
  },
  {
    "id": "E8B-50-4",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Queda configurada",
    "expected": "El asistente de Grupo Delta usa su clave y sus topes.",
    "source": "docs/design/recorridos/configurar-la-clave-propia.json#pasos/4"
  },
  {
    "id": "E8B-60-1",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Le quedan pocas",
    "expected": "El contador aparece recién cuando quedan 10 consultas del día.",
    "source": "docs/design/recorridos/el-tope.json#pasos/1"
  },
  {
    "id": "E8B-60-2",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Llega al tope del día",
    "expected": "No puede preguntar más hasta que se renueva, a la hora que dice el aviso. Las consultas fijas siguen andando.",
    "source": "docs/design/recorridos/el-tope.json#pasos/2"
  },
  {
    "id": "E8B-60-3",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Mira el uso del mes",
    "expected": "Como Dueña, ve el gasto contra el tope del mes, por día y por persona, nunca el texto de las conversaciones.",
    "source": "docs/design/recorridos/el-tope.json#pasos/3"
  },
  {
    "id": "E8B-60-4",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Le llega la alerta",
    "expected": "Al 80 % y al 100 % del tope del mes, los Dueños reciben un correo.",
    "source": "docs/design/recorridos/el-tope.json#pasos/4"
  },
  {
    "id": "E8B-60-5",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Si llega al tope del mes",
    "expected": "El asistente de la organización deja de responder hasta el mes siguiente o hasta que suba el tope.",
    "source": "docs/design/recorridos/el-tope.json#pasos/5"
  },
  {
    "id": "E8B-40-1",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Abre el menú de la conversación",
    "expected": "Las conversaciones se borran solas a los 30 días sin actividad, salvo las guardadas.",
    "source": "docs/design/recorridos/guardar-y-exportar.json#pasos/1"
  },
  {
    "id": "E8B-40-2",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · La guarda",
    "expected": "Guardada, no vence nunca y pasa a «Guardadas».",
    "source": "docs/design/recorridos/guardar-y-exportar.json#pasos/2"
  },
  {
    "id": "E8B-40-3",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · La exporta",
    "expected": "Puede bajarla en Markdown o en PDF.",
    "source": "docs/design/recorridos/guardar-y-exportar.json#pasos/3"
  },
  {
    "id": "E8B-20-1",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Elige una consulta fija",
    "expected": "Las consultas fijas no gastan el modelo: son gratis e instantáneas.",
    "source": "docs/design/recorridos/una-consulta-fija.json#pasos/1"
  },
  {
    "id": "E8B-20-2",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Ve la respuesta",
    "expected": "La respuesta tiene un texto armado y un enlace a la pantalla donde se hace cada cosa.",
    "source": "docs/design/recorridos/una-consulta-fija.json#pasos/2"
  },
  {
    "id": "E8B-20-3",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Va a la pantalla",
    "expected": "Desde Usuarios reenvía las invitaciones vencidas.",
    "source": "docs/design/recorridos/una-consulta-fija.json#pasos/3"
  },
  {
    "id": "E8B-30-1",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Adjunta y pregunta",
    "expected": "Puede adjuntar imágenes o PDF, hasta 10 MB y 5 por consulta.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/1"
  },
  {
    "id": "E8B-30-2",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Consulta con las herramientas",
    "expected": "Mientras corre una herramienta, muestra «Consultando usuarios…». Solo ve lo que Lucía ya puede ver.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/2"
  },
  {
    "id": "E8B-30-3",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Escribe la respuesta",
    "expected": "La respuesta aparece a medida que se escribe. «Detener» la corta.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/3"
  },
  {
    "id": "E8B-30-4",
    "script": "scripts/recorrido-usuario-asistente.mjs",
    "title": "E8b · Lee y califica",
    "expected": "Puede copiar la respuesta y marcar si le sirvió.",
    "source": "docs/design/recorridos/una-pregunta-con-herramienta.json#pasos/4"
  }
];

