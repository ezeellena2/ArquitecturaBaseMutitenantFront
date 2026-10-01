import type * as React from "react";


export interface AppShellProps {
  /** La navegación del menú y de las migas (`NavigationGroup` está en Sidebar.d.ts). Por defecto, la real. */
  navigation?: NavigationGroup[];
  /** La ruta activa, que comparten el menú y las migas ("/usuarios"). */
  active?: string;
  /** Por defecto, "/usuarios". */
  defaultActive?: string;
  /** Se llama con el `href` del ítem o la miga tocados, y con "/perfil" desde "Mi perfil". Nada navega. */
  onNavigate?: (href: string) => void;
  /** La barra lateral contraída (el ☰ y el círculo del borde la cambian). */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** La persona de la sesión (`SessionUser` está en Sidebar.d.ts). Por defecto, Ana Pérez. */
  user?: SessionUser | null;
  userName?: string;
  userEmail?: string;
  /** Los permisos, en lista o separados por comas. Sin nada, ve todo. */
  permissions?: string[] | string;
  /** `/api/me` todavía no llegó. */
  loading?: boolean;
  /** `/api/me` falló: el menú avisa y no hay persona ni menú del usuario. */
  loadError?: boolean;
  onRetry?: () => void;
  /** Migas armadas a mano (`BreadcrumbItem` está en Breadcrumbs.d.ts). */
  breadcrumbs?: BreadcrumbItem[];
  /** El último nivel de las migas en una ruta hija. */
  leaf?: string;
  language?: string;
  defaultLanguage?: string;
  onLanguageChange?: (language: string) => void;
  /** "Mi perfil": la ruta pasa a "/perfil" y después se llama a esto. */
  onProfile?: () => void;
  onSignOut?: () => void;
  userMenuOpen?: boolean;
  defaultUserMenuOpen?: boolean;
  onUserMenuOpenChange?: (open: boolean) => void;
  /** El alto del caparazón. Por defecto, "100%" de su contenedor. Un número (o "720") son píxeles. */
  height?: number | string;
  /** El contenido de la pantalla, normalmente un `Page`. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** El caparazón de toda pantalla con sesión: barra lateral, barra superior y el contenido. */
export declare function AppShell(props: AppShellProps): React.ReactElement;


/** Un enlace del menú. `permission` es el de su ruta: decide si se ve y si reserva lugar mientras carga. */
export interface NavigationLink {
  label: string;
  /** Nombre de un ícono del set o un nodo. Adentro de un grupo solo lo usa la barra contraída. */
  icon?: string | React.ReactNode;
  href: string;
  permission?: string;
}
/** Un ítem que agrupa enlaces. No tiene `href`: a un grupo no se navega, se despliega. */
export interface NavigationBranch {
  label: string;
  icon?: string | React.ReactNode;
  children: NavigationLink[];
}
export type NavigationItem = NavigationLink | NavigationBranch;
export interface NavigationGroup {
  /** El rótulo del grupo ("Administración"). El del primer grupo no se dibuja. */
  label: string;
  items: NavigationItem[];
}
/** La persona de la sesión. Sin `name` se muestra el correo, como `displayName ?? email` en el código. */
export interface SessionUser {
  name?: string;
  email: string;
}

export interface SidebarProps {
  /** Por defecto, la de `layouts/navigation.ts`: Inicio; y en "Administración", "Gestión de usuarios" (Usuarios,
   *  Roles y permisos) y Configuración. */
  navigation?: NavigationGroup[];
  /** La ruta activa ("/usuarios"). Una ruta hija ("/roles/abc") marca a su padre. */
  active?: string;
  /** La ruta activa al empezar, sin controlarla. Por defecto, "/usuarios". */
  defaultActive?: string;
  /** Se llama con el `href` del ítem tocado. Los enlaces no navegan. */
  onNavigate?: (href: string) => void;
  /** Contraída a solo íconos (72 px). */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** La persona del pie. Por defecto, Ana Pérez; `null` no dibuja el pie. */
  user?: SessionUser | null;
  /** Atajo literal de `user`. */
  userName?: string;
  userEmail?: string;
  /** Los permisos de la persona, en lista o separados por comas ("users.read, roles.read"). Sin nada, ve todo. */
  permissions?: string[] | string;
  /** `/api/me` todavía no llegó: bloques de carga en los ítems con permiso y en el pie. */
  loading?: boolean;
  /** `/api/me` falló: el aviso con "Reintentar", sin los ítems con permiso y sin pie. */
  loadError?: boolean;
  onRetry?: () => void;
  /** "Navegación principal". */
  navigationLabel?: string;
  /** "Contraer menú". */
  collapseLabel?: string;
  /** "Expandir menú". */
  expandLabel?: string;
  /** "No pudimos cargar tu menú." */
  loadErrorLabel?: string;
  /** "Reintentar". */
  retryLabel?: string;
  /** "Reintentar cargar el menú" (el botón de ícono de la barra contraída). */
  retryLoadLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** La barra lateral: la marca, el menú con sus grupos desplegables y la persona abajo. */
export declare function Sidebar(props: SidebarProps): React.ReactElement;


export interface TopbarProps {
  /** Las migas armadas a mano (`BreadcrumbItem` está en Breadcrumbs.d.ts). Sin esto, salen de la navegación. */
  breadcrumbs?: BreadcrumbItem[];
  /** La navegación de la que salen las migas (`NavigationGroup` está en Sidebar.d.ts). */
  navigation?: NavigationGroup[];
  /** La ruta activa, para las migas. */
  active?: string;
  /** Por defecto, "/usuarios". */
  defaultActive?: string;
  /** El último nivel de una ruta hija ("Soporte" en "/roles/abc"). */
  leaf?: string;
  /** Se llama con el `href` de la miga tocada. */
  onNavigate?: (href: string) => void;
  /** Si lo que controla el ☰ está abierto (la barra lateral expandida): va a `aria-expanded`. */
  sidebarExpanded?: boolean;
  /** Por defecto, true. */
  defaultSidebarExpanded?: boolean;
  /** El ☰. */
  onToggleSidebar?: () => void;
  /** El nombre accesible del ☰: "Menú de navegación". */
  toggleLabel?: string;
  /** Lo de UserMenu (`SessionUser` está en Sidebar.d.ts). */
  user?: SessionUser | null;
  userName?: string;
  userEmail?: string;
  loading?: boolean;
  language?: string;
  defaultLanguage?: string;
  onLanguageChange?: (language: string) => void;
  onProfile?: () => void;
  onSignOut?: () => void;
  /** El menú del usuario abierto. */
  userMenuOpen?: boolean;
  defaultUserMenuOpen?: boolean;
  onUserMenuOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}
/** La barra superior: el ☰, las migas y el menú del usuario. */
export declare function Topbar(props: TopbarProps): React.ReactElement;


/** Un nivel de las migas. Con `href` es enlace; sin `href`, texto apagado (un grupo del menú). */
export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  /** La página actual. Por defecto, la última. */
  current?: boolean;
}

export interface BreadcrumbsProps {
  /** Las migas armadas a mano. Sin esto, salen de `navigation` y la ruta activa. */
  items?: BreadcrumbItem[];
  /** La navegación de la que se deducen (la de Sidebar por defecto; `NavigationGroup` está en Sidebar.d.ts). */
  navigation?: NavigationGroup[];
  /** La ruta activa ("/usuarios", "/roles/abc"). */
  active?: string;
  /** Por defecto, "/usuarios". */
  defaultActive?: string;
  /** El último nivel de una ruta hija, que el menú no conoce (el nombre del rol en "/roles/abc"). */
  leaf?: string;
  /** Se llama con el `href` de la miga tocada. Los enlaces no navegan. */
  onNavigate?: (href: string) => void;
  /** Por defecto, el rótulo del enlace a "/" de la navegación: "Inicio". */
  homeLabel?: string;
  /** El nombre accesible del `nav`: "Migas de pan". */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** Las migas de la barra superior: Inicio / grupo / página. */
export declare function Breadcrumbs(props: BreadcrumbsProps): React.ReactElement;


/** Un idioma que se puede elegir. */
export interface LanguageOption {
  value: string;
  label: string;
}

export interface UserMenuProps {
  /** La persona de la sesión (`SessionUser` está en Sidebar.d.ts). Por defecto, Ana Pérez; `null` no dibuja nada. */
  user?: SessionUser | null;
  /** Atajo literal de `user`. */
  userName?: string;
  userEmail?: string;
  /** El perfil todavía no llegó: el bloque de carga del avatar, del mismo tamaño. */
  loading?: boolean;
  /** El idioma elegido ("es" o "en"). */
  language?: string;
  /** Por defecto, "es". */
  defaultLanguage?: string;
  onLanguageChange?: (language: string) => void;
  /** Por defecto, Español e Inglés. */
  languages?: LanguageOption[];
  /** "Mi perfil". */
  onProfile?: () => void;
  /** "Cerrar sesión". */
  onSignOut?: () => void;
  open?: boolean;
  /** Lo dibuja abierto. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** El nombre accesible del disparador: "Menú de {{name}}". */
  triggerLabel?: string;
  /** "Mi perfil". */
  profileLabel?: string;
  /** "Idioma". */
  languageLabel?: string;
  /** "Cerrar sesión". */
  signOutLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** El menú del avatar: la sesión, el perfil, el idioma y cerrar sesión. */
export declare function UserMenu(props: UserMenuProps): React.ReactElement | null;


/** A dónde vuelve una pantalla hija. `to` se acepta como en el código. */
export interface PageBackTo {
  href?: string;
  to?: string;
  /** El nombre accesible y el `title` de la flecha ("Volver a Roles y permisos"). */
  label: string;
}

export interface PageProps {
  /** El ícono de la sección: nombre del set ("users") o un nodo. */
  icon?: string | React.ReactNode;
  /** El título de la pantalla abierta. */
  title: React.ReactNode;
  /** Una pantalla hija: la flecha para volver, en el lugar del ícono. */
  backTo?: PageBackTo;
  /** Atajo literal de `backTo`. */
  backHref?: string;
  backLabel?: string;
  /** Lo que acompaña al título sin ser parte de él ("Del sistema", "· Cambios sin guardar"). */
  status?: React.ReactNode;
  /** La acción primaria (y, si hace falta, sus compañeras), a la derecha. */
  actions?: React.ReactNode;
  /** Atajo del tablero: dibuja `actions` como un botón primario con este texto ("Nuevo usuario"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Se llama con el `href` de la flecha de volver. No navega. */
  onNavigate?: (href: string) => void;
  /** El cuerpo de la pantalla, con 24 px de padding. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** El caparazón de una pantalla: la banda adherida con ícono, título y acción, y el cuerpo. */
export declare function Page(props: PageProps): React.ReactElement;


export interface AuthLayoutProps {
  /** El idioma elegido ("es" o "en"). */
  language?: string;
  /** Por defecto, "es". */
  defaultLanguage?: string;
  onLanguageChange?: (language: string) => void;
  /** Por defecto, Español e Inglés (`LanguageOption` está en UserMenu.d.ts). */
  languages?: LanguageOption[];
  /** "Idioma". */
  languageLabel?: string;
  /** El alto mínimo. Por defecto, "100%" de su contenedor. Un número (o "600") son píxeles. */
  minHeight?: number | string;
  /** La pantalla del ingreso, adentro de la tarjeta. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** El chrome del ingreso: la marca, la tarjeta centrada y el cambio de idioma. */
export declare function AuthLayout(props: AuthLayoutProps): React.ReactElement;


export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Por defecto, "default" (el relleno de marca). */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Por defecto, "default" (36 px de alto). */
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  /** Nombre de un ícono del set o un nodo. Va antes del texto, a 16 px (12 en xs e icon-xs). */
  icon?: string | React.ReactNode;
  /** Otro tamaño para el ícono por nombre, en px (en el código, la clase `size-*` del ícono). */
  iconSize?: number;
  /** "button" por defecto; en el código no se pone y el navegador usa "submit". */
  type?: "button" | "submit" | "reset";
  ref?: React.Ref<HTMLButtonElement>;
}
/** La acción de una pantalla, un formulario o un diálogo. */
export declare function Button(props: ButtonProps): React.ReactElement;


export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** El nombre accesible (aria-label) y el tooltip nativo (title). Obligatorio. */
  label: string;
  /** Nombre de un ícono del set o un nodo. Si no viene, el ícono va como hijo. */
  icon?: string | React.ReactNode;
  /** Tamaño del ícono por nombre, en px. Por defecto 16 (12 en icon-xs). */
  iconSize?: number;
  /** Por defecto, "ghost". */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** Por defecto, "icon" (36 × 36). */
  size?: "icon" | "icon-xs" | "icon-sm" | "icon-lg" | "default" | "xs" | "sm" | "lg";
  ref?: React.Ref<HTMLButtonElement>;
}
/** Un botón que solo muestra un ícono, con el nombre accesible obligatorio. */
export declare function IconButton(props: IconButtonProps): React.ReactElement;


export interface RowAction {
  /** Texto corto del tooltip: "Roles", "Desactivar", "Eliminar". */
  label: string;
  /** Nombre accesible completo, con el dato de la fila: "Eliminar a ana@ejemplo.com". */
  accessibleName: string;
  /** Nombre de un ícono del set o un nodo. Se dibuja a 18 px. */
  icon: string | React.ReactNode;
  /** Lo que no se puede deshacer: va última y se tiñe de rojo al interactuar. */
  destructive?: boolean;
  /** Sin permiso: no se dibuja. */
  hidden?: boolean;
  onSelect?: () => void;
}

export interface RowActionsProps {
  actions: RowAction[];
  /** El label de la acción cuyo tooltip se dibuja visible (para un tablero). */
  openTooltip?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** Las acciones de una fila, en un grupo segmentado. Sin acciones visibles no dibuja nada. */
export declare function RowActions(props: RowActionsProps): React.ReactElement | null;


export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Por defecto, "default". "role" no es una variante del código: es la etiqueta de rol del listado de
   * usuarios (outline, 11 px, font-medium, color apagado).
   */
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | "role";
}
/** Una etiqueta chica en píldora. */
export declare function Badge(props: BadgeProps): React.ReactElement;


export interface StatusDotProps {
  /** Verde si es true (por defecto), gris si es false. */
  active?: boolean;
  /** La palabra para el lector de pantalla. Por defecto, "Activo" o "Inactivo". */
  label?: string;
  /** El texto visible: el correo. Se trunca. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** El estado de una cuenta como un punto delante del correo. */
export declare function StatusDot(props: StatusDotProps): React.ReactElement;


export interface AvatarProps {
  /** El nombre visible o el correo; se muestra la inicial en mayúscula ("?" si está vacío). */
  name?: string;
  /** Diámetro en px (o una medida CSS). Por defecto 32. */
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}
/** La inicial del nombre en un círculo de marca. */
export declare function Avatar(props: AvatarProps): React.ReactElement;


export interface SpinnerProps {
  /** El texto para el lector de pantalla. Por defecto, "Cargando…". */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** El indicador de carga, con role="status". */
export declare function Spinner(props: SpinnerProps): React.ReactElement;


export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** En px o una medida CSS. Sin width ocupa todo el ancho. */
  width?: number | string;
  /** En px o una medida CSS. Sin alto no se ve. */
  height?: number | string;
  /** En px o una medida CSS; "full" es el círculo. Por defecto, 8 px. */
  radius?: number | string;
}
/** Un bloque de carga que ocupa el lugar de lo que todavía no llegó. */
export declare function Skeleton(props: SkeletonProps): React.ReactElement;


export interface TooltipProps {
  /** El texto del tooltip. */
  content: React.ReactNode;
  /** De qué lado del disparador aparece. Por defecto, "top". */
  side?: "top" | "right" | "bottom" | "left";
  /** Lo dibuja visible (para un tablero). */
  open?: boolean;
  /** El disparador, que tiene que tener su propio nombre accesible. */
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** Un rótulo con flecha que aparece al hover y al foco del disparador. */
export declare function Tooltip(props: TooltipProps): React.ReactElement;


export interface DropdownMenuProps {
  /** Lo que dice el disparador. */
  label: React.ReactNode;
  children?: React.ReactNode;
  align?: "start" | "end";
  minWidth?: number | string;
  matchTriggerWidth?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** El disparador ocupa todo el ancho, como un campo. */
  block?: boolean;
  /** Clase y ancho del panel (el menú del usuario mide 256). */
  panelClassName?: string;
  width?: number | string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  triggerAriaLabel?: string;
  triggerProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  className?: string;
  style?: React.CSSProperties;
}
/** Un botón que abre una lista de acciones u opciones. */
export declare function DropdownMenu(props: DropdownMenuProps): React.ReactElement;

export interface MenuItemProps {
  children?: React.ReactNode;
  /** Con href es un enlace ("Mi perfil"). */
  href?: string;
  /** Nombre de un ícono del set o un nodo. */
  icon?: string | React.ReactNode;
  /** A la derecha: el conteo de una opción. */
  trailing?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  destructive?: boolean;
  /** No cierra el menú al elegir. */
  keepOpen?: boolean;
  onSelect?: () => void;
  className?: string;
}
export declare function MenuItem(props: MenuItemProps): React.ReactElement;

export interface MenuCheckboxItemProps {
  children?: React.ReactNode;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}
export declare function MenuCheckboxItem(props: MenuCheckboxItemProps): React.ReactElement;

export interface MenuRadioItemProps {
  children?: React.ReactNode;
  checked?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  /** Elegirla cierra el menú; keepOpen lo deja abierto. */
  keepOpen?: boolean;
}
export declare function MenuRadioItem(props: MenuRadioItemProps): React.ReactElement;

export declare function MenuLabel(props: { children?: React.ReactNode; caps?: boolean }): React.ReactElement;
export declare function MenuSeparator(): React.ReactElement;


export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** El `id` del control que nombra. */
  htmlFor?: string;
  children?: React.ReactNode;
}
/** La etiqueta de un control: 14 px, peso 500, interlineado 1. */
export declare function Label(props: LabelProps): React.ReactElement;


export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Borde de peligro; con el foco, además, el anillo de peligro. `FormField` lo pone solo cuando hay error. */
  "aria-invalid"?: boolean | "true" | "false";
}
/** El campo de texto de 36 px. Expone su nodo (`ref`), como el del código. */
export declare function Input(props: InputProps & React.RefAttributes<HTMLInputElement>): React.ReactElement;


export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  "aria-invalid"?: boolean | "true" | "false";
}
/** El texto de varias líneas: crece con el contenido desde 64 px. Expone su nodo (`ref`). */
export declare function Textarea(
  props: TextareaProps & React.RefAttributes<HTMLTextAreaElement>,
): React.ReactElement;


export interface FormFieldProps {
  /** El texto de la etiqueta, arriba del control. */
  label: string;
  /** El `id` del control. Sin él, usa el `id` del hijo o genera uno. */
  htmlFor?: string;
  /** La ayuda, debajo, en `--color-content-muted`. */
  hint?: string;
  /** El error, en el renglón de la ayuda, con `role="alert"`. Marca el control con `aria-invalid`. */
  error?: string;
  /** Suma " *" a la etiqueta (oculto para el lector de pantalla). */
  required?: boolean;
  /** Un solo control: `Input`, `Textarea`, `Select` o `MultiSelect`. Recibe `id`, `aria-invalid` y `aria-describedby`. */
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
  className?: string;
  style?: React.CSSProperties;
}
/** Etiqueta, control y ayuda o error, atados para el lector de pantalla. */
export declare function FormField(props: FormFieldProps): React.ReactElement;


export interface FormErrorProps {
  /** El error del servidor que no es de ningún campo. Sin texto, no dibuja nada. */
  children?: React.ReactNode;
  className?: string;
}
/** El error sin campo, arriba de la botonera, con `role="alert"`. */
export declare function FormError(props: FormErrorProps): React.ReactElement | null;


export interface SearchInputProps {
  /** Controlado: el valor de la búsqueda (el de la URL). */
  value?: string;
  /** Solo: el valor con el que arranca. */
  defaultValue?: string;
  /** Llega `delay` ms después de la última tecla, no en cada una. */
  onChange?: (value: string) => void;
  /** La espera, en ms. Por defecto, 300. */
  delay?: number;
  /** El nombre accesible y el placeholder. Por defecto, "Buscar". */
  label?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** El buscador de texto libre de un listado, con espera. */
export declare function SearchInput(props: SearchInputProps): React.ReactElement;


export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Las opciones; un texto suelto vale como `{ value: texto, label: texto }`, y un texto con comas
   *  (`"Admin, User"`) como una lista de textos sueltos. */
  options: ReadonlyArray<SelectOption | string> | string;
  value?: string;
  defaultValue?: string;
  /** Recibe el valor elegido, no el evento (también con `native`). */
  onChange?: (value: string) => void;
  /** Lo que dice sin nada elegido, en `muted-foreground`. */
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  /** `"sm"`: 32 px de alto en vez de 36. Sin efecto con `native`. */
  size?: "default" | "sm";
  /** El `<select>` nativo con las clases del `Input`, como el idioma y la zona horaria del perfil. */
  native?: boolean;
  /** Estira el disparador al ancho del contenedor (sin `block` mide lo que su texto). */
  block?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** Un valor de una lista corta, con la opción elegida marcada con un tilde a la derecha. */
export declare function Select(props: SelectProps): React.ReactElement;


export interface MultiSelectOption {
  value: string;
  label: string;
  /** Línea de ayuda debajo de la opción. */
  description?: string;
}

export interface MultiSelectProps {
  /** Las opciones; un texto suelto vale como `{ value: texto, label: texto }`, y un texto con comas
   *  (`"Admin, User"`) como una lista de textos sueltos. */
  options: ReadonlyArray<MultiSelectOption | string> | string;
  /** Los valores marcados; también como texto con comas (`"Admin, User"`). */
  value?: readonly string[] | string;
  defaultValue?: readonly string[] | string;
  /** Los valores marcados, en el orden en que se fueron marcando. */
  onChange?: (value: string[]) => void;
  /** Lo que dice sin nada elegido. Por defecto, "Sin roles". */
  placeholder?: string;
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** Varias opciones con el alto de un campo; lo elegido, separado por comas en el orden de las opciones. */
export declare function MultiSelect(props: MultiSelectProps): React.ReactElement;


export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "defaultValue"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}
/** La casilla de 16 px: un `button` con `role="checkbox"`, como en Radix. */
export declare function Checkbox(props: CheckboxProps): React.ReactElement;


export interface CheckboxFieldProps {
  /** El texto al lado de la casilla; es su nombre accesible. */
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Línea de ayuda debajo de la etiqueta. */
  description?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
/** Una casilla con su etiqueta al lado y la descripción debajo. */
export declare function CheckboxField(props: CheckboxFieldProps): React.ReactElement;


export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "defaultValue"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  /** `"default"`: 32 × 18,4 px; `"sm"`: 24 × 14 px. */
  size?: "default" | "sm";
}
/** El interruptor de un ajuste: un `button` con `role="switch"`. */
export declare function Switch(props: SwitchProps): React.ReactElement;


export interface SurfaceProps {
  /** Lo que va en la caja: la tabla (o su carga, vacío o error) y el paginado. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** La caja de un listado: fondo de superficie, borde de 1 px, radio de 12 y sin relleno. */
export declare function Surface(props: SurfaceProps): React.ReactElement;


export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Un `TableHeader` y un `TableBody`. */
  children?: React.ReactNode;
  /** Van a la `<table>`, no al contenedor con scroll. */
  className?: string;
  style?: React.CSSProperties;
}
/** La tabla: un contenedor con scroll horizontal propio y la `<table>` de 14 px. */
export declare function Table(props: TableProps): React.ReactElement;


export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Las `TableHead` de la banda. La fila la pone la pieza. */
  children?: React.ReactNode;
  /** Van al `<thead>`. */
  className?: string;
  style?: React.CSSProperties;
}
/** El `<thead>` con su única fila: la banda de superficie, sin hover. */
export declare function TableHeader(props: TableHeaderProps): React.ReactElement;


export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Las `TableRow` de datos. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** El `<tbody>`; la última fila va sin borde. */
export declare function TableBody(props: TableBodyProps): React.ReactElement;


export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Las `TableCell` de la fila. */
  children?: React.ReactNode;
  /** La pinta elegida, con el fondo apagado pleno: pone `data-state="selected"`, como `data-[state=selected]` en el
   *  código. Por defecto, `false`. */
  selected?: boolean;
  /** El mismo `data-state`, como llega desde el markup de un tablero (`data-state` pasa a `dataState`). */
  dataState?: "selected";
  "data-state"?: "selected";
  className?: string;
  style?: React.CSSProperties;
}
/** Una fila de datos de 44 px, con el borde a media opacidad y el fondo apagado al pasar por encima. */
export declare function TableRow(props: TableRowProps): React.ReactElement;


export interface TableHeadProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align"> {
  /** El rótulo de la columna. */
  children?: React.ReactNode;
  /** Por defecto, `"left"`. Fechas, números y acciones van a la derecha. */
  align?: "left" | "right";
  /** Lo vuelve un botón fantasma chico con la misma tipografía. Por defecto, `false`. */
  sortable?: boolean;
  /** Va a `aria-sort`. Sin valor, `"none"`, como en todas las columnas de `DataTable`. */
  sort?: "ascending" | "descending" | "none";
  /** El clic del botón de una columna ordenable. */
  onSort?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
/** Un encabezado de columna en el nivel rótulo: 11 px, semibold, versalitas con 0.06em. */
export declare function TableHead(props: TableHeadProps): React.ReactElement;


export interface TableCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> {
  children?: React.ReactNode;
  /** Por defecto, `"left"`. */
  align?: "left" | "right";
  /** Cifras tabulares, para fechas y números. Por defecto, `false`. */
  numeric?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
/** Una celda de datos: 16 px a los lados, sin cortar el renglón. */
export declare function TableCell(props: TableCellProps): React.ReactElement;


export interface Column<TRow = Record<string, unknown>> {
  /** Coincide con el nombre del campo ordenable del backend. Sin `cell`, la celda muestra `row[id]`. */
  id: string;
  header: string;
  cell?: (row: TRow) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right";
  /** Cifras tabulares en la celda, como el `<span className="tabular-nums">` de la columna "Creado". */
  numeric?: boolean;
}

export interface DataTableProps<TRow = Record<string, unknown>> {
  columns: Column<TRow>[];
  rows: readonly TRow[];
  /** Una función, o el nombre del campo que identifica la fila ("email"). Por defecto, `row.id` o la posición. */
  rowKey?: ((row: TRow, index: number) => string) | string;
  isLoading?: boolean;
  /** El título del error. Con valor, la tabla muestra el error en lugar de los datos. */
  error?: string;
  /** Detalle extra del error (por ejemplo, el código para reportar). */
  errorDescription?: string;
  onRetry?: () => void;
  /** El botón del error. Por defecto, "Reintentar"; `null` lo saca. */
  retryLabel?: string | null;
  /** Por defecto, "No hay nada para mostrar". */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Lo que se puede hacer desde el vacío: un nodo, o un texto que se dibuja como botón outline. */
  emptyAction?: React.ReactNode;
  /** El clic de `emptyAction` cuando es un texto. */
  onEmptyAction?: () => void;
  /** Orden actual, en el formato del backend: "campo" o "-campo". Con valor, manda el de afuera. */
  sort?: string;
  /** El orden con el que arranca si no viene `sort`. */
  defaultSort?: string;
  /** Recibe el campo apretado; quien controla `sort` decide el orden nuevo. Con `sort` y sin esto, las columnas
   *  ordenables quedan como texto, como en el código. */
  onSortChange?: (field: string) => void;
  /** El texto de la carga para el lector de pantalla. Por defecto, "Cargando…". */
  loadingLabel?: string;
}
/** Listado con encabezados ordenables y estados de carga, error y vacío. */
export declare function DataTable<TRow = Record<string, unknown>>(props: DataTableProps<TRow>): React.ReactElement;


/** Los números también se aceptan como texto ("45"), que es como llegan escritos literales desde un tablero. */
export interface PaginationProps {
  /** La página actual (desde 1). Con valor, manda el de afuera. */
  page?: number;
  /** La página con la que arranca si no viene `page`. Por defecto, 1. */
  defaultPage?: number;
  /** Por defecto, 20 (el de `usePagination`). */
  pageSize?: number;
  /** Por defecto, 0. */
  totalCount?: number;
  /** Si no viene, `Math.ceil(totalCount / pageSize)`, como el backend. */
  totalPages?: number;
  /** Si no viene, `page > 1`. */
  hasPrevious?: boolean;
  /** Si no viene, `page < totalPages`. */
  hasNext?: boolean;
  onPageChange?: (page: number) => void;
  /** El nombre del `<nav>`. Por defecto, "Paginado". */
  label?: string;
  /** Por defecto, "Página anterior". */
  previousLabel?: string;
  /** Por defecto, "Página siguiente". */
  nextLabel?: string;
  /** Por defecto, "{{from}}–{{to}} de {{total}}". */
  rangeFormat?: string;
  /** Por defecto, "Página {{page}} de {{totalPages}}". */
  pageFormat?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** El pie de un listado paginado: el rango a la izquierda y el paso de página a la derecha. */
export declare function Pagination(props: PaginationProps): React.ReactElement;


export interface EmptyStateProps {
  /** Por defecto, "No hay nada para mostrar". */
  title?: string;
  description?: string;
  /** Un nodo, o un texto que se dibuja como botón outline. */
  action?: React.ReactNode;
  /** El clic de `action` cuando es un texto. */
  onAction?: () => void;
  /** También se muestran, debajo de `action`: para anidar el botón que se quiera. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
/** El estado vacío de un listado o una pantalla: borde punteado, título, descripción y la salida. */
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;


export interface FilterBarChip {
  /** La clave del filtro: la recibe `onRemoveChip`. */
  key: string;
  /** El rótulo del filtro: "Estado", "Rol", "Creado". */
  label: string;
  /** Lo elegido, como se lee: "Activo", "Admin", "Últimos 7 días". */
  value: React.ReactNode;
}

export interface FilterBarProps {
  /** Los filtros frecuentes de la fila: `SegmentedControl`, `FilterSelect`, `MoreFilters`. */
  children?: React.ReactNode;
  /** Lo que se ve de cuánto hay: "9 de 9". */
  total?: React.ReactNode;
  /** Un chip por filtro puesto, en el orden en que se declaran los filtros. */
  chips?: FilterBarChip[];
  onRemoveChip?: (key: string) => void;
  onClear?: () => void;
  /** Por defecto, "Limpiar todo". */
  clearLabel?: string;
  /** El nombre de la cruz de cada chip; `{{name}}` es el rótulo. Por defecto, "Quitar el filtro {{name}}". */
  removeChipLabel?: string;
  /** El texto y nombre accesible del buscador. Por defecto, "Buscar". */
  searchLabel?: string;
  search?: string;
  defaultSearch?: string;
  /** Llega 300 ms después de la última tecla. */
  onSearchChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
}
/** La barra de filtros de un listado: buscador, filtros frecuentes, total y chips de lo puesto. */
export declare function FilterBar(props: FilterBarProps): React.ReactElement;


export interface SegmentedControlOption {
  /** `null` es "Todos": la opción elegida cuando el filtro no está puesto. */
  value: string | number | null;
  label: React.ReactNode;
}

export interface SegmentedControlProps {
  /** Por defecto, Todos, Activos e Inactivos (`null`, `"true"`, `"false"`). */
  options?: SegmentedControlOption[];
  value?: string | number | null;
  /** Por defecto, `null` ("Todos"). */
  defaultValue?: string | number | null;
  onChange?: (value: string | number | null) => void;
  /** El nombre del grupo. Por defecto, "Estado". */
  "aria-label"?: string;
  /** Lo mismo que `aria-label`, para un tablero que pasa el atributo en camelCase. */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** Un filtro de pocas opciones fijas, a la vista y de un clic. */
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;


export interface FilterOption {
  value: string | number;
  /** Por defecto, el valor. */
  label?: React.ReactNode;
  /** Cuántos traería. Con 0 la opción queda deshabilitada; sin conteo no se muestra número. */
  count?: number;
}

export interface FilterSelectProps {
  /** El nombre accesible del disparador. Por defecto, "Filtrar por rol". */
  label?: string;
  /** La opción de "sin filtro". Por defecto, "Cualquier rol". */
  anyLabel?: string;
  options?: FilterOption[];
  /** `null` es "cualquiera". */
  value?: string | number | null;
  defaultValue?: string | number | null;
  onChange?: (value: string | number | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}
/** Un filtro de una opción de una lista, con el conteo de cada una. */
export declare function FilterSelect(props: FilterSelectProps): React.ReactElement;


export interface MoreFiltersOption {
  value: string | number;
  /** Por defecto, el valor. */
  label?: React.ReactNode;
  /** Cuántos traería. Con 0 la opción queda deshabilitada. */
  count?: number;
}

export interface MoreFiltersSection {
  /** La clave del filtro: la recibe `onChange`. */
  key: string;
  /** El rótulo de la sección: "Creado". */
  label: string;
  /** La opción de "sin filtro": "Cualquier fecha". Por defecto, "Todos". */
  anyLabel?: string;
  options?: MoreFiltersOption[];
}

export interface MoreFiltersProps {
  /** Por defecto, "Más filtros". */
  label?: string;
  sections?: MoreFiltersSection[];
  /** El valor de cada sección; nulo o ausente es "sin filtro". */
  values?: Record<string, string | number | null | undefined>;
  defaultValues?: Record<string, string | number | null | undefined>;
  onChange?: (key: string, value: string | number | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}
/** Los filtros que no entran junto al buscador, con un globo que cuenta los puestos. */
export declare function MoreFilters(props: MoreFiltersProps): React.ReactElement;


export interface FilterChipProps {
  /** El rótulo del filtro: "Estado", "Rol", "Creado". */
  label: string;
  /** Lo elegido, como se lee: "Activo", "Admin", "Últimos 7 días". */
  value: React.ReactNode;
  /** Sin `onRemove`, la cruz esconde el chip. */
  onRemove?: () => void;
  /** El nombre de la cruz; `{{name}}` es el rótulo. Por defecto, "Quitar el filtro {{name}}". */
  removeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}
/** Un filtro puesto, con la cruz para sacarlo. */
export declare function FilterChip(props: FilterChipProps): React.ReactElement;


/** Un botón del pie dado como datos, para un tablero que no arma elementos. */
export interface DialogFooterAction {
  label: string;
  /** Variante del botón. Por defecto, "default". */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Cierra el diálogo después del clic (el "Cancelar"). */
  close?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

export interface DialogProps {
  open?: boolean;
  /** Por defecto, cerrado; con `inline`, abierto. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** El título: 18 px, semibold, interlineado 1. */
  title?: React.ReactNode;
  /** La bajada: 14 px en `muted-foreground`. */
  description?: React.ReactNode;
  /** El cuerpo: una columna con 16 px entre campos (14 con `bandedFooter`). */
  children?: React.ReactNode;
  /** Los botones del pie, como nodo o como datos. Van a la derecha, con 8 px entre ellos. */
  footer?: React.ReactNode | DialogFooterAction[];
  /** Ancho máximo en px o con unidad. Por defecto, 512 (480 con `bandedFooter`). */
  width?: number | string;
  /** La cruz arriba a la derecha. Por defecto, true. */
  showClose?: boolean;
  /** El nombre de la cruz para el lector de pantalla. Por defecto, "Cerrar". */
  closeLabel?: string;
  /** Se dibuja en el lugar, sin fondo ni portal, para una ficha o un tablero de estados. */
  inline?: boolean;
  /** La forma de RoleFormDialog: encabezado con 18 px, cuerpo que scrollea y pie en banda. */
  bandedFooter?: boolean;
  /** El botón que lo abre (DialogTrigger): un texto se dibuja como Button; un nodo se usa tal cual. */
  trigger?: React.ReactNode;
  /** Variante del botón que lo abre, cuando `trigger` es un texto. Por defecto, "default". */
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  style?: React.CSSProperties;
}
/** Una tarea breve y contextual encima de la pantalla: título, cuerpo y botonera. */
export declare function Dialog(props: DialogProps): React.ReactElement;


export interface ConfirmDialogProps {
  open?: boolean;
  /** Por defecto, cerrado; con `inline`, abierto. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Qué se va a hacer y sobre qué: "Eliminar a ana@ejemplo.com". */
  title: React.ReactNode;
  /** Qué se pierde. */
  description?: React.ReactNode;
  /** El botón que confirma. Por defecto, "Confirmar". */
  confirmLabel?: string;
  /** Por defecto, "Cancelar". */
  cancelLabel?: string;
  /** El botón que confirma va rojo: lo que confirma no se deshace. */
  destructive?: boolean;
  /** Se llama al confirmar; después el diálogo se cierra solo. */
  onConfirm?: () => void;
  /** Se dibuja en el lugar, sin fondo ni portal. */
  inline?: boolean;
  /** El botón que lo abre: un texto se dibuja como Button; un nodo se usa tal cual. */
  trigger?: React.ReactNode;
  /** Por defecto, "destructive" si la confirmación lo es y "default" si no. */
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  style?: React.CSSProperties;
}
/** La confirmación antes de algo que no se puede deshacer. */
export declare function ConfirmDialog(props: ConfirmDialogProps): React.ReactElement;


export interface ToasterProps {
  /** Siempre desplegada, sin apilar. Por defecto, false (se despliega al pasar el puntero). */
  expand?: boolean;
  /** Cuántos se ven a la vez. Por defecto, 3. */
  visibleToasts?: number;
  /** El tiempo por defecto en ms de los que no son `error`. Por defecto, 4000. */
  duration?: number;
  /** La cruz en todos los avisos. Por defecto, false (la llevan solo los que no se van solos). */
  closeButton?: boolean;
  /** El nombre de la cruz. Por defecto, "Cerrar". */
  closeLabel?: string;
  /** El nombre de la región. Por defecto, "Notificaciones". */
  label?: string;
  /** `absolute` en lugar de `fixed`: la pila queda en la esquina del tablero que la contiene. */
  contained?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
/** La pila de avisos flotantes, abajo a la derecha; muestra lo que se mande con `toast`. */
export declare function Toaster(props: ToasterProps): React.ReactElement;


/** La acción de un aviso: el "Reintentar" del error de red. */
export interface ToastActionObject {
  label: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastProps {
  /** Define el ícono. `message` va sin ícono. Por defecto, "message". */
  type?: "success" | "error" | "info" | "warning" | "message";
  /** El texto del aviso; si falta, se usan los hijos. */
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Una segunda línea, en gris. */
  description?: React.ReactNode;
  /** Un texto es solo el rótulo. */
  action?: string | ToastActionObject;
  /** La cruz sobre la esquina. Por defecto, solo en `error`. */
  closeButton?: boolean;
  /** El nombre de la cruz. Por defecto, "Cerrar". */
  closeLabel?: string;
  /** Se llama al cerrarlo con la cruz o la acción. */
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
/** Un aviso flotante dibujado en el lugar, para una ficha o un tablero de estados. */
export declare function Toast(props: ToastProps): React.ReactElement | null;

export interface ToastOptions {
  description?: React.ReactNode;
  action?: string | ToastActionObject;
  /** En ms. Por defecto, 4000; en `error`, Infinity (se queda hasta cerrarlo). */
  duration?: number;
  /** Por defecto, solo en los que no se van solos. */
  closeButton?: boolean;
  /** Con el mismo id, reemplaza al aviso anterior. */
  id?: string;
}

/** `toast` no es un componente: es la función de sonner, con un método por tipo. */
export interface ToastFunction {
  (message: React.ReactNode, options?: ToastOptions): string;
  message(message: React.ReactNode, options?: ToastOptions): string;
  success(message: React.ReactNode, options?: ToastOptions): string;
  error(message: React.ReactNode, options?: ToastOptions): string;
  info(message: React.ReactNode, options?: ToastOptions): string;
  warning(message: React.ReactNode, options?: ToastOptions): string;
  /** Cierra uno por id, o todos. */
  dismiss(id?: string): void;
}
/** Manda un aviso al `Toaster` montado: `window.AB.toast.success("Eliminamos la cuenta.")`. */
export declare const toast: ToastFunction;


export interface BannerProps {
  /** Por defecto, "warning", el único con tablero. "info" y "danger" son propuesta. */
  tone?: "warning" | "info" | "danger";
  /** Una primera línea en semibold. */
  title?: React.ReactNode;
  /** La condición que sigue vigente. */
  children?: React.ReactNode;
  /** Un nodo, o un texto / `{ label, onClick }` que se dibuja como Button outline chico. Es propuesta. */
  action?: React.ReactNode | string | { label: React.ReactNode; onClick?: () => void };
  className?: string;
  style?: React.CSSProperties;
}
/** La banda de pantalla: una condición que sigue vigente mientras la pantalla está abierta. */
export declare function Banner(props: BannerProps): React.ReactElement;


export type IconName =
  | "home" | "users" | "shield" | "menu" | "chevron-left" | "chevron-right" | "chevron-down" | "refresh"
  | "log-out" | "settings" | "power" | "trash" | "pencil" | "sliders" | "search" | "user" | "check" | "x";

export interface IconProps {
  name: IconName;
  /** En px. Por defecto 16. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}
/** Un ícono del set propio, por nombre. */
export declare function Icon(props: IconProps): React.ReactElement | null;

