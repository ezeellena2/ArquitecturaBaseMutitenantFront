// Datos literales de Organizaciones, Organizacion y Cuentas v111, §11 del plan. Sólo para la captura del componente T20d.
const suspend = {
  title: "¿Suspender Grupo Delta?",
  description: "Nadie entra a la organización mientras esté suspendida y se cierran las sesiones abiertas en ella. Los perfiles personales de sus miembros siguen funcionando.",
  confirmLabel: "Suspender", pendingLabel: "Suspendiendo…", destructive: true,
};

export const platformReasons = {
  "organizaciones-confirmacion-motivo": suspend,
  "organizaciones-confirmacion-error": suspend,
  "organizacion-confirmar-aprobar": {
    title: "¿Aprobar Grupo Delta?",
    description: "Terminamos el alta y Lucía Fernández ya puede entrar como Dueño.",
    confirmLabel: "Aprobar", pendingLabel: "Aprobando…", destructive: false,
  },
  "organizacion-modulo-extender-prueba": {
    title: "¿Extender la prueba de Módulo B?",
    description: "Grupo Delta lo sigue usando hasta la fecha que elijas.",
    confirmLabel: "Extender prueba", pendingLabel: "Extendiendo…", destructive: false,
    date: { initialValue: "2026-10-27" },
  },
  "cuentas-baja-bloqueada": {
    title: "¿Dar de baja la cuenta de Lucía Fernández?",
    description: "Se cierran sus sesiones y le avisamos por todos sus métodos de ingreso. Tiene 30 días para cancelar la baja ingresando; después se elimina la cuenta. La plataforma no puede cancelarla.",
    confirmLabel: "Dar de baja", pendingLabel: "Dando de baja…", destructive: true,
    blockedReason: "Es el único Dueño de Grupo Delta. Primero la organización tiene que sumar otro Dueño, o la plataforma tiene que cerrarla.",
  },
  "organizaciones-409": {
    ...suspend,
    failure: { code: "Tenancy.Tenant.InvalidTransition", detail: "La organización no puede pasar a ese estado." },
  },
} as const;
