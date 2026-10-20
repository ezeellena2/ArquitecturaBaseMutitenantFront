import type { ComponentType, ReactNode } from "react";

interface IconProps {
  className?: string;
  /** El trazo, si el tablero dibuja ese ícono con otro: las flechas de los controles van en 2. */
  strokeWidth?: number;
}

/// Un ícono del set (o uno de lucide): lo que pide el menú, el título de una página y los atajos de los inicios.
export type IconComponent = ComponentType<IconProps>;

/// «Extender prueba», tablero Organizacion: calendario con sus dos anillas.
export function CalendarIcon(props: IconProps) {
  return <Icon {...props}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16" />
    <path d="M9 3v4" />
    <path d="M15 3v4" />
  </Icon>;
}

/// Íconos propios en SVG inline para el layout (sección 7.2): mismo trazo para todo el set, sin depender de
/// un paquete de íconos. Son decorativos (aria-hidden): el texto accesible lo pone quien los usa (el label
/// del ítem de navegación, el aria-label del botón).
function Icon({ className, strokeWidth = 1.75, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/// Las áreas, como las dibujan el marco, el título y los atajos de los tableros (Inicio-Org, Usuarios, Roles, Empresas, Cuenta
/// y sus M-*). «Inicio»: el techo, las paredes y la puerta.
export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </Icon>
  );
}

/// «Inicio» en la barra de abajo del teléfono (tableros M-*, .ap-nav): el techo y las paredes, sin puerta.
export function AppHomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10v9h11v-9" />
    </Icon>
  );
}

/// «Organizaciones» en la barra inferior de Plataforma (M-Organizaciones): edificio con seis ventanas.
export function AppOrganizationsIcon(props: IconProps) {
  return <Icon {...props}>
    <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
    <path d="M9 7.5h2M13 7.5h2M9 11h2M13 11h2M9 14.5h2M13 14.5h2" />
  </Icon>;
}

/// «Cuentas» en la barra inferior de Plataforma (M-Organizaciones): dos personas.
export function AppAccountsIcon(props: IconProps) {
  return <Icon {...props}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
    <path d="M18 14.8c1.6.7 2.7 2.3 3 4.7" />
  </Icon>;
}

/// «Recuperaciones» en la barra inferior de Plataforma (M-Organizaciones): la llave chica.
export function AppRecoveriesIcon(props: IconProps) {
  return <Icon {...props}>
    <circle cx="8" cy="15" r="3.5" />
    <path d="M10.5 12.5 19 4" />
    <path d="m16 7 2 2" />
  </Icon>;
}

/// El candado del 403 (tableros Error-Org y M-Error-Org) y de las pantallas de estado (el alta cerrada de Registro y
/// Registro-Empresa, la organización cerrada de Perfil-Suspendido): el cuerpo y el arco, sin cerradura.
export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Icon>
  );
}

/// El edificio de las pantallas de estado (tablero Ingreso, «Empresa: la cuenta no está en ninguna empresa»): el cuerpo
/// con sus ventanas, el ala de la derecha y el piso.
export function BuildingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11" />
      <path d="M3 21h18" />
      <path d="M8 8h3" />
      <path d="M8 12h3" />
      <path d="M8 16h3" />
    </Icon>
  );
}

/// «Usuarios» y «Gestión de usuarios»: dos personas.
export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
      <path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" />
    </Icon>
  );
}

/// «Gestión» de Plataforma (tableros Organizaciones y Config-Plat): cuatro cuadrados.
export function GridIcon(props: IconProps) {
  return <Icon {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Icon>;
}

/// «Documentos legales» de Plataforma (tablero Legales): una hoja con la esquina doblada.
export function DocumentIcon(props: IconProps) {
  return <Icon {...props}>
    <path d="M14 3.5H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5z" />
    <path d="M14 3.5v4h4" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </Icon>;
}

/// «Roles y permisos» en el menú y en los inicios: la llave.
export function KeyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.2-8.2" />
      <path d="m17 6 2 2" />
      <path d="m14 9 2 2" />
    </Icon>
  );
}

/// «Configuración» en el menú y en los inicios: tres reguladores con su perilla.
export function SlidersHorizontalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h10" />
      <circle cx="16" cy="6" r="2" />
      <path d="M4 12h4" />
      <path d="M12 12h8" />
      <circle cx="10" cy="12" r="2" />
      <path d="M4 18h12" />
      <circle cx="18" cy="18" r="2" />
    </Icon>
  );
}

/// «Auditoría»: el portapapeles con sus renglones.
export function ClipboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 3.5h6v3H9z" />
      <path d="M15 5h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </Icon>
  );
}

/// «Copiar» (tablero M-Configuracion-Verificar, .ap-cod): dos hojas chicas, una delante de la otra.
export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15V6a1 1 0 0 1 1-1h9" />
    </Icon>
  );
}

/// «Administración», en el pie del menú: el escudo con la tilde.
export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z" />
      <path d="m9.5 12 1.8 1.8 3.4-3.6" />
    </Icon>
  );
}

/// El título de «Roles y permisos» (tablero Roles): el escudo solo.
export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5.5c0 4.2 2.9 7.8 7 9.5 4.1-1.7 7-5.3 7-9.5V6z" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </Icon>
  );
}

/// Menú de acciones de página y fila; tres puntos como en el lienzo aprobado.
export function MoreVerticalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.6" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/// La ✕ de los tableros: la de cerrar un diálogo o una hoja («Criterio · Diálogos», .ib) y la de «Revocar invitación»
/// (Empresa y Usuarios). Va con trazo 2.
export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 7 7 17" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Icon>
  );
}

/// La flecha de los desplegables (tableros: .fb-sel, .sel, el menú de la cuenta): chica, con trazo 2 a 14 px.
export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m7 10 5 5 5-5" />
    </Icon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M14 6h4v4" />
    </Icon>
  );
}

/// «Salir», como en los tableros (menú de la cuenta, «Más», Perfil-Suspendido): la puerta a la derecha y la flecha que
/// sale hacia la izquierda.
export function LogOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4" />
      <path d="M6 12h10" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 2.75v2" />
      <path d="M12 19.25v2" />
      <path d="M21.25 12h-2" />
      <path d="M4.75 12h-2" />
      <path d="m18.55 5.45-1.4 1.4" />
      <path d="m6.85 17.15-1.4 1.4" />
      <path d="m18.55 18.55-1.4-1.4" />
      <path d="m6.85 6.85-1.4-1.4" />
    </Icon>
  );
}

export function PowerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v7.5" />
      <path d="M17.7 7.3a8 8 0 1 1-11.4 0" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="m6.8 7 .8 11.1a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4L17.2 7" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.5 5.5 18.5 8.5 9 18H6v-3z" />
      <path d="m13.75 7.25 3 3" />
    </Icon>
  );
}

/// Mirar sin cambiar: la acción de lo que se abre de solo lectura (Admin, en el listado de roles). Es el ojo del
/// tablero "Roles · Acciones del listado": el contorno en un solo trazo y la pupila, sin relleno.
export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.75 12S6.25 5.75 12 5.75 21.25 12 21.25 12 17.75 18.25 12 18.25 2.75 12 2.75 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </Icon>
  );
}

/// Los filtros. Tres líneas de distinto largo: se lee como "acotar" sin depender de un embudo, que a este
/// tamaño queda como una mancha.
export function SlidersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h15" />
      <path d="M7.5 12h9" />
      <path d="M10.5 17.5h3" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 3.5 3.5" />
    </Icon>
  );
}

/// «Mi cuenta» (tableros Cuenta e Inicio-Personal): la persona.
export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  );
}

/// El reloj de las pantallas de estado (tableros Ingreso, Registro-Empresa, Invitacion y Perfil-Suspendido: la baja
/// pedida, la organización en revisión, la invitación vencida) y de «Tu sesión venció» (.msj.info de Ingreso). También
/// algo que venció, como el enlace del chat que ya no sirve (tablero "WhatsApp · El enlace del chat").
export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

/// Algo que no se puede hacer: una cuenta que no puede entrar (tablero "WhatsApp · El enlace del chat").
export function BanIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m6.2 6.2 11.6 11.6" />
    </Icon>
  );
}

/// El correo, en la fila de los medios de ingreso del perfil (tablero "WhatsApp · Perfil: correo y WhatsApp").
export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

/// Un celular: el número de WhatsApp, en la fila de los medios de ingreso del perfil.
export function SmartphoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </Icon>
  );
}

/// Un lugar: la dirección, en la tarjeta de la página pública (tableros Pagina-Publica y M-Pagina-Publica).
export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Icon>
  );
}

/// La marca de WhatsApp de Cuenta/Cuenta-Metodo del lienzo; el texto de la fila da el nombre accesible.
export function WhatsAppIcon(props: IconProps) {
  return <Icon {...props}>
    <path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" />
    <path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z" />
  </Icon>;
}

/// Un tubo de teléfono: el teléfono de contacto, en la tarjeta de la página pública.
export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6a2 2 0 0 1 2-2Z" />
    </Icon>
  );
}

/// El mundo: el sitio web, en la tarjeta de la página pública.
export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.6 3.5 5.5 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.5-3.5-8.5s1.1-5.9 3.5-8.5Z" />
    </Icon>
  );
}

/// Algo comprobado: la insignia "Verificado".
export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Icon>
  );
}

/// Salió bien: la tilde en su círculo del aviso pasajero (tableros Avisos, .p-aviso, y M-Avisos, .f-snack .ok).
export function CircleCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.4 2.4 4.6-4.8" />
    </Icon>
  );
}

/// Dos tildes: un mensaje de WhatsApp que llegó ("Entregada") o que se leyó ("Leída"), en la franja de la última
/// invitación (tablero "Editar usuario · B"). Es la marca que la persona ya conoce de WhatsApp.
export function CheckCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m2.5 12.5 4.5 4.5 9-10" />
      <path d="m12 16 1 1 9-10" />
    </Icon>
  );
}

/// El avión de papel: un envío, como la invitación de una cuenta (tablero "Editar usuario · B").
export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 3.5 10.5 13.5" />
      <path d="M20.5 3.5 14 20.5l-3.5-7-7-3.5Z" />
    </Icon>
  );
}

/// Un aviso que informa (`Banner`): una condición que sigue vigente.
export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

/// Un aviso de error (`Banner` con `tone="danger"`, `FormError`, la banda del teléfono y la pantalla de error): el de
/// «Criterio · Formularios» (.aviso-mal) y «Criterio · Avisos». Los avisos lo piden con trazo 2, como sus tableros.
export function AlertCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.5" />
      <path d="M12 15.8h.01" />
    </Icon>
  );
}

/// Una advertencia (`Banner` con `tone="warning"`): algo que se puede hacer igual, pero que tiene una consecuencia que
/// conviene saber antes. El triángulo del tablero "WhatsApp · Usuarios: alta con teléfono".
export function AlertTriangleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4 3 19.5h18Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

// «Criterio · Menús» (v136): los íconos de las opciones de un ⋮ en la compu, con el dibujo que el lienzo usa para la
// misma acción (generador menus_y_solo_lectura_1004.py, IC).

/// «Reenviar invitación» y «Comprobar medio de pago» (tableros Usuario, Usuarios, Empresa, Cuentas, Plat-WA-Numero y
/// WA-Admin): la flecha circular.
export function RotateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </Icon>
  );
}

/// «Quitar de la empresa» y «Quitar de la organización» (tablero Usuario): la persona con «−».
export function UserMinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M4 20a6 6 0 0 1 12 0" />
      <path d="M16 11h5" />
    </Icon>
  );
}

/// «Desconectar» y «Desvincular» (tableros WA-Admin y WA-Mensajes): el eslabón cortado.
export function UnlinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 15l6-6" />
      <path d="M10.5 6.5 12 5a4 4 0 0 1 6 6l-1.5 1.5" />
      <path d="M13.5 17.5 12 19a4 4 0 0 1-6-6l1.5-1.5" />
    </Icon>
  );
}

/// «Hacer principal» (tablero Cuenta-Metodo): la estrella.
export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
    </Icon>
  );
}

/// «Cambiar a quién atiende» (tablero WA-Admin): las dos flechas.
export function SwapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 7h12" />
      <path d="m15 3 4 4-4 4" />
      <path d="M17 17H5" />
      <path d="m9 13-4 4 4 4" />
    </Icon>
  );
}

/// «Editar» en el ⋮ de una fila (tableros WA-Equipos y WA-Respuestas): el lápiz entero, de punta a punta.
export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </Icon>
  );
}

/// «Borrar» o «Quitar» en el ⋮ de una fila (tableros Cuenta-Metodo, WA-Equipos y WA-Respuestas): el tacho de lados rectos.
export function DeleteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l1 12.5h9l1-12.5" />
    </Icon>
  );
}
