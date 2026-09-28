/* @ds-bundle: {"format":4,"namespace":"AB","components":[{"name":"AppShell"},{"name":"Sidebar"},{"name":"Topbar"},{"name":"Breadcrumbs"},{"name":"UserMenu"},{"name":"Page"},{"name":"AuthLayout"},{"name":"Button"},{"name":"IconButton"},{"name":"RowActions"},{"name":"Badge"},{"name":"StatusDot"},{"name":"Avatar"},{"name":"Spinner"},{"name":"Skeleton"},{"name":"Tooltip"},{"name":"DropdownMenu"},{"name":"MenuItem"},{"name":"MenuCheckboxItem"},{"name":"MenuRadioItem"},{"name":"MenuLabel"},{"name":"MenuSeparator"},{"name":"Label"},{"name":"Input"},{"name":"Textarea"},{"name":"FormField"},{"name":"FormError"},{"name":"SearchInput"},{"name":"Select"},{"name":"MultiSelect"},{"name":"Checkbox"},{"name":"CheckboxField"},{"name":"Switch"},{"name":"Surface"},{"name":"Table"},{"name":"TableHeader"},{"name":"TableBody"},{"name":"TableRow"},{"name":"TableHead"},{"name":"TableCell"},{"name":"DataTable"},{"name":"Pagination"},{"name":"EmptyState"},{"name":"FilterBar"},{"name":"SegmentedControl"},{"name":"FilterSelect"},{"name":"MoreFilters"},{"name":"FilterChip"},{"name":"Dialog"},{"name":"ConfirmDialog"},{"name":"Toaster"},{"name":"Toast"},{"name":"Banner"},{"name":"Icon"}]} */
(function () {
var __ab = (function(exports, react, react_dom) {

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) {
					__defProp(to, key, {
						get: ((k) => from[k]).bind(null, key),
						enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
					});
				}
			}
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));

//#endregion
react = __toESM(react);
react_dom = __toESM(react_dom);

//#region icons.jsx
	const iconPaths = {
		home: [
			"M3.75 10.5 12 3.75l8.25 6.75",
			"M5.25 9v10.5h13.5V9",
			"M9.75 19.5V13.5h4.5v6"
		],
		users: [
			{ circle: [
				9,
				8,
				3
			] },
			"M3.5 19.5a5.5 5.5 0 0 1 11 0",
			"M16 8.25a2.75 2.75 0 1 1 0 5.5",
			"M14.75 14.75c2.7.2 4.75 2.1 5.25 4.75"
		],
		shield: ["M12 3.5 5 6v5.5C5 16 8 19.5 12 20.5c4-1 7-4.5 7-9V6l-7-2.5Z", "m9.25 12 2 2 3.5-4"],
		menu: [
			"M4 6.5h16",
			"M4 12h16",
			"M4 17.5h16"
		],
		"chevron-left": ["M14.5 5.5 8 12l6.5 6.5"],
		"chevron-right": ["m9.5 5.5 6.5 6.5-6.5 6.5"],
		"chevron-down": ["M5.5 8.5 12 15l6.5-6.5"],
		refresh: ["M19.5 12a7.5 7.5 0 1 1-2.2-5.3", "M14 6h4v4"],
		"log-out": [
			"M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9",
			"M14 15.5 19 12l-5-3.5",
			"M19 12H9"
		],
		settings: [
			{ circle: [
				12,
				12,
				3.25
			] },
			"M12 2.75v2",
			"M12 19.25v2",
			"M21.25 12h-2",
			"M4.75 12h-2",
			"m18.55 5.45-1.4 1.4",
			"m6.85 17.15-1.4 1.4",
			"m18.55 18.55-1.4-1.4",
			"m6.85 6.85-1.4-1.4"
		],
		power: ["M12 4v7.5", "M17.7 7.3a8 8 0 1 1-11.4 0"],
		trash: [
			"M4.5 7h15",
			"M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7",
			"m6.8 7 .8 11.1a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4L17.2 7"
		],
		pencil: ["M15.5 5.5 18.5 8.5 9 18H6v-3z", "m13.75 7.25 3 3"],
		sliders: [
			"M4.5 6.5h15",
			"M7.5 12h9",
			"M10.5 17.5h3"
		],
		search: [{ circle: [
			11,
			11,
			6.5
		] }, "m16 16 3.5 3.5"],
		user: [{ circle: [
			12,
			8,
			3.5
		] }, "M5.5 19.5a6.5 6.5 0 0 1 13 0"],
		check: ["M5 12.5 9.5 17 19 7.5"],
		x: ["M6.5 6.5 17.5 17.5", "M17.5 6.5 6.5 17.5"]
	};
	const iconNames = Object.keys(iconPaths);
	function Icon({ name, size, className, style, strokeWidth = 1.75 }) {
		const parts = iconPaths[name];
		if (!parts) return null;
		const dimension = size ?? 16;
		return /* @__PURE__ */ react.createElement("svg", {
			viewBox: "0 0 24 24",
			width: dimension,
			height: dimension,
			fill: "none",
			stroke: "currentColor",
			strokeWidth,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true",
			focusable: "false",
			className,
			style: {
				flexShrink: 0,
				...style
			}
		}, parts.map((part, index) => typeof part === "string" ? /* @__PURE__ */ react.createElement("path", {
			key: index,
			d: part
		}) : /* @__PURE__ */ react.createElement("circle", {
			key: index,
			cx: part.circle[0],
			cy: part.circle[1],
			r: part.circle[2]
		})));
	}
	function renderIcon(icon, size) {
		if (!icon) return null;
		return typeof icon === "string" ? /* @__PURE__ */ react.createElement(Icon, {
			name: icon,
			size
		}) : icon;
	}

//#endregion
//#region utils.jsx
	function cx(...parts) {
		return parts.filter(Boolean).join(" ");
	}
	function useControllable(value, defaultValue, onChange) {
		const [inner, setInner] = react.useState(defaultValue);
		const controlled = value !== void 0;
		return [controlled ? value : inner, react.useCallback((next) => {
			if (!controlled) setInner(next);
			if (onChange) onChange(next);
		}, [controlled, onChange])];
	}
	function useDismiss(ref, open, onClose) {
		react.useEffect(() => {
			if (!open) return;
			function onPointerDown(event) {
				if (ref.current && !ref.current.contains(event.target)) onClose();
			}
			document.addEventListener("mousedown", onPointerDown);
			return () => document.removeEventListener("mousedown", onPointerDown);
		}, [
			ref,
			open,
			onClose
		]);
		return function onKeyDown(event) {
			if (open && event.key === "Escape") {
				event.stopPropagation();
				onClose();
			}
		};
	}
	function focusSibling(event, selector) {
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		const items = Array.from(event.currentTarget.querySelectorAll(selector)).filter((item) => !item.disabled);
		const next = items[(items.indexOf(document.activeElement) + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
		if (next) {
			event.preventDefault();
			next.focus();
		}
	}
	function Portal({ children }) {
		const [host, setHost] = react.useState(null);
		react.useEffect(() => {
			setHost(document.body);
		}, []);
		return host ? react_dom.createPortal(children, host) : null;
	}
	function initialOf(name) {
		return (name ?? "").trim().charAt(0).toUpperCase() || "?";
	}
	function format(template, values) {
		return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(values[key] ?? ""));
	}

//#endregion
//#region actions.jsx
	function buttonIcon(icon, size, iconSize) {
		if (!icon) return null;
		if (typeof icon !== "string") return icon;
		const dimension = iconSize ?? (size === "xs" || size === "icon-xs" ? 12 : 16);
		return /* @__PURE__ */ react.createElement(Icon, {
			name: icon,
			size: dimension,
			style: iconSize ? {
				width: iconSize,
				height: iconSize
			} : void 0
		});
	}
	const Button = react.forwardRef(function Button({ variant = "default", size = "default", icon, iconSize, type = "button", className, children, ...props }, ref) {
		return /* @__PURE__ */ react.createElement("button", {
			ref,
			type,
			"data-slot": "button",
			"data-variant": variant,
			"data-size": size,
			className: cx("ab-btn", `ab-btn--${variant}`, `ab-btn--size-${size}`, className),
			...props
		}, buttonIcon(icon, size, iconSize), children);
	});
	const IconButton = react.forwardRef(function IconButton({ label, icon, iconSize, variant = "ghost", size = "icon", children, ...props }, ref) {
		return /* @__PURE__ */ react.createElement(Button, {
			ref,
			variant,
			size,
			icon,
			iconSize,
			"aria-label": label,
			title: label,
			...props
		}, children);
	});
	function RowActions({ actions = [], openTooltip, className, style }) {
		const visibles = actions.filter((action) => action && !action.hidden);
		if (visibles.length === 0) return null;
		const ordered = [...visibles.filter((action) => !action.destructive), ...visibles.filter((action) => action.destructive)];
		return /* @__PURE__ */ react.createElement("span", {
			className: cx("ab-row-actions", className),
			style
		}, /* @__PURE__ */ react.createElement("span", { className: "ab-row-actions__group" }, ordered.map((action) => {
			const name = action.accessibleName ?? action.label;
			return /* @__PURE__ */ react.createElement("button", {
				key: name,
				type: "button",
				"aria-label": name,
				onClick: action.onSelect,
				className: cx("ab-row-actions__button", action.destructive && "ab-row-actions__button--destructive")
			}, /* @__PURE__ */ react.createElement("span", {
				"aria-hidden": "true",
				className: "ab-row-actions__icon"
			}, renderIcon(action.icon, 18)), /* @__PURE__ */ react.createElement("span", {
				"aria-hidden": "true",
				className: cx("ab-row-actions__tip", openTooltip === action.label && "ab-row-actions__tip--open")
			}, action.label));
		})));
	}
	function Badge({ variant = "default", className, children, ...props }) {
		const role = variant === "role";
		return /* @__PURE__ */ react.createElement("span", {
			"data-slot": "badge",
			"data-variant": role ? "outline" : variant,
			className: cx("ab-badge", role ? "ab-badge--outline ab-badge--role" : `ab-badge--${variant}`, className),
			...props
		}, children);
	}
	function StatusDot({ active = true, label, children, className, style }) {
		const word = label ?? (active ? "Activo" : "Inactivo");
		return /* @__PURE__ */ react.createElement("span", {
			className: cx("ab-status-dot", className),
			style
		}, /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: cx("ab-status-dot__dot", active && "ab-status-dot__dot--active")
		}), /* @__PURE__ */ react.createElement("span", { className: "ab-sr-only" }, word), children !== void 0 && children !== null ? /* @__PURE__ */ react.createElement("span", { className: "ab-status-dot__text" }, children) : null);
	}
	function Avatar({ name, size = 32, className, style }) {
		const dimension = typeof size === "number" ? `${size}px` : size;
		return /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: cx("ab-avatar", className),
			style: size === 32 ? style : {
				width: dimension,
				height: dimension,
				...style
			}
		}, initialOf(name));
	}
	function Spinner({ label = "Cargando…", className, style }) {
		return /* @__PURE__ */ react.createElement("span", {
			role: "status",
			"aria-live": "polite",
			className: cx("ab-spinner", className),
			style
		}, /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: "ab-spinner__circle"
		}), /* @__PURE__ */ react.createElement("span", { className: "ab-sr-only" }, label));
	}
	function toLength$2(value) {
		if (value === void 0 || value === null) return;
		return typeof value === "number" ? `${value}px` : value;
	}
	function Skeleton({ width, height, radius, className, style, ...props }) {
		const own = {};
		if (width !== void 0) own.width = toLength$2(width);
		if (height !== void 0) own.height = toLength$2(height);
		if (radius !== void 0) own.borderRadius = radius === "full" ? "9999px" : toLength$2(radius);
		return /* @__PURE__ */ react.createElement("div", {
			"aria-hidden": "true",
			"data-slot": "skeleton",
			className: cx("ab-skeleton", className),
			style: {
				...own,
				...style
			},
			...props
		});
	}
	const TOOLTIP_SIDES = [
		"top",
		"right",
		"bottom",
		"left"
	];
	function Tooltip({ content, side = "top", open = false, children, className, style }) {
		const id = react.useId();
		const placement = TOOLTIP_SIDES.includes(side) ? side : "top";
		const trigger = react.isValidElement(children) ? react.cloneElement(children, { "aria-describedby": cx(children.props["aria-describedby"], id) }) : children;
		return /* @__PURE__ */ react.createElement("span", {
			className: cx("ab-tooltip", `ab-tooltip--${placement}`, open && "ab-tooltip--open", className),
			style
		}, trigger, /* @__PURE__ */ react.createElement("span", {
			id,
			role: "tooltip",
			className: "ab-tooltip__content"
		}, content, /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: "ab-tooltip__arrow"
		})));
	}

//#endregion
//#region menu.jsx
	const MenuContext = react.createContext(null);
	const ITEM_SELECTOR = "[role^=\"menuitem\"]";
	function DropdownMenu({ label, children, align = "start", minWidth, matchTriggerWidth = false, open: openProp, defaultOpen = false, onOpenChange, block = false, triggerClassName, triggerStyle, triggerAriaLabel, triggerProps, panelClassName, width, className, style }) {
		const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
		const rootRef = react.useRef(null);
		const triggerRef = react.useRef(null);
		const panelRef = react.useRef(null);
		const close = react.useCallback(() => setOpen(false), [setOpen]);
		const closeFromItem = react.useCallback(() => {
			setOpen(false);
			triggerRef.current?.focus();
		}, [setOpen]);
		const onKeyDown = useDismiss(rootRef, open, () => {
			close();
			triggerRef.current?.focus();
		});
		const focusFirst = react.useRef(false);
		react.useEffect(() => {
			if (open && focusFirst.current) {
				focusFirst.current = false;
				(panelRef.current?.querySelector(`${ITEM_SELECTOR}:not([disabled])`))?.focus();
			}
		}, [open]);
		function onTriggerKeyDown(event) {
			if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				focusFirst.current = true;
				setOpen(true);
			}
		}
		const context = react.useMemo(() => ({ close: closeFromItem }), [closeFromItem]);
		return /* @__PURE__ */ react.createElement("span", {
			ref: rootRef,
			className: cx("ab-menu-root", block && "ab-menu-root--block", className),
			style,
			onKeyDown
		}, /* @__PURE__ */ react.createElement("button", {
			ref: triggerRef,
			type: "button",
			"aria-haspopup": "menu",
			"aria-expanded": open,
			"aria-label": triggerAriaLabel,
			onClick: () => setOpen(!open),
			onKeyDown: onTriggerKeyDown,
			className: cx("ab-menu-trigger", triggerClassName),
			style: triggerStyle,
			...triggerProps
		}, label), open ? /* @__PURE__ */ react.createElement(MenuContext.Provider, { value: context }, /* @__PURE__ */ react.createElement("div", {
			ref: panelRef,
			role: "menu",
			className: cx("ab-menu", align === "end" ? "ab-menu--end" : "ab-menu--start", matchTriggerWidth && "ab-menu--match", panelClassName),
			style: minWidth || width ? {
				minWidth,
				width
			} : void 0,
			onKeyDown: (event) => focusSibling(event, `${ITEM_SELECTOR}`)
		}, children)) : null);
	}
	function MenuItem({ children, href, icon, trailing, disabled = false, selected = false, destructive = false, keepOpen = false, onSelect, className }) {
		const menu = react.useContext(MenuContext);
		const content = /* @__PURE__ */ react.createElement(react.Fragment, null, icon ? /* @__PURE__ */ react.createElement("span", { className: "ab-menu-item__icon" }, renderIcon(icon, 16)) : null, /* @__PURE__ */ react.createElement("span", { className: "ab-menu-item__label" }, children), trailing !== void 0 && trailing !== null ? /* @__PURE__ */ react.createElement("span", { className: "ab-menu-item__trailing" }, trailing) : null);
		const classes = cx("ab-menu-item", selected && "ab-menu-item--selected", destructive && "ab-menu-item--destructive", className);
		function select() {
			onSelect?.();
			if (!keepOpen) menu?.close();
		}
		if (href) return /* @__PURE__ */ react.createElement("a", {
			role: "menuitem",
			href,
			className: classes,
			"data-selected": selected || void 0,
			onClick: select
		}, content);
		return /* @__PURE__ */ react.createElement("button", {
			type: "button",
			role: "menuitem",
			disabled,
			"aria-disabled": disabled || void 0,
			"data-selected": selected || void 0,
			className: classes,
			onClick: select
		}, content);
	}
	function MenuCheckboxItem({ children, description, checked = false, onCheckedChange, disabled = false }) {
		return /* @__PURE__ */ react.createElement("button", {
			type: "button",
			role: "menuitemcheckbox",
			"aria-checked": checked,
			disabled,
			className: "ab-menu-item ab-menu-item--inset ab-menu-item--checkbox",
			onClick: () => onCheckedChange?.(!checked)
		}, /* @__PURE__ */ react.createElement("span", {
			className: "ab-menu-item__indicator",
			"aria-hidden": "true"
		}, checked ? /* @__PURE__ */ react.createElement(Icon, {
			name: "check",
			size: 16
		}) : null), /* @__PURE__ */ react.createElement("span", { className: "ab-menu-item__stack" }, /* @__PURE__ */ react.createElement("span", null, children), description ? /* @__PURE__ */ react.createElement("span", { className: "ab-menu-item__description" }, description) : null));
	}
	function MenuRadioItem({ children, checked = false, onSelect, disabled = false, keepOpen = false }) {
		const menu = react.useContext(MenuContext);
		return /* @__PURE__ */ react.createElement("button", {
			type: "button",
			role: "menuitemradio",
			"aria-checked": checked,
			disabled,
			className: "ab-menu-item ab-menu-item--inset ab-menu-item--radio",
			onClick: () => {
				onSelect?.();
				if (!keepOpen) menu?.close();
			}
		}, /* @__PURE__ */ react.createElement("span", {
			className: "ab-menu-item__indicator",
			"aria-hidden": "true"
		}, checked ? /* @__PURE__ */ react.createElement("span", { className: "ab-menu-item__dot" }) : null), /* @__PURE__ */ react.createElement("span", null, children));
	}
	function MenuLabel({ children, caps = false }) {
		return /* @__PURE__ */ react.createElement("div", { className: cx("ab-menu-label", caps && "ab-menu-label--caps") }, children);
	}
	function MenuSeparator() {
		return /* @__PURE__ */ react.createElement("div", {
			role: "separator",
			className: "ab-menu-separator"
		});
	}

//#endregion
//#region layout.jsx
	const DEFAULT_NAVIGATION = [{
		label: "General",
		items: [{
			label: "Inicio",
			icon: "home",
			href: "/"
		}]
	}, {
		label: "Administración",
		items: [{
			label: "Gestión de usuarios",
			icon: "users",
			children: [{
				label: "Usuarios",
				icon: "users",
				href: "/usuarios",
				permission: "users.read"
			}, {
				label: "Roles y permisos",
				icon: "shield",
				href: "/roles",
				permission: "roles.read"
			}]
		}, {
			label: "Configuración",
			icon: "settings",
			href: "/configuracion",
			permission: "settings.manage"
		}]
	}];
	const DEFAULT_ACTIVE = "/usuarios";
	const DEFAULT_USER = {
		name: "Ana Pérez",
		email: "ana@ejemplo.com"
	};
	const DEFAULT_LANGUAGES = [{
		value: "es",
		label: "Español"
	}, {
		value: "en",
		label: "Inglés"
	}];
	const PROFILE_HREF = "/perfil";
	const EXTRA_LABELS = { [PROFILE_HREF]: "Mi perfil" };
	function isBranch(item) {
		return Array.isArray(item?.children);
	}
	function flatLinks(navigation) {
		return navigation.flatMap((group) => (group.items ?? []).flatMap((item) => isBranch(item) ? item.children : [item]));
	}
	function isChildOf(pathname, href) {
		return href !== "/" && pathname.startsWith(`${href}/`);
	}
	function branchOf(navigation, pathname) {
		return navigation.flatMap((group) => group.items ?? []).filter(isBranch).find((branch) => branch.children.some((child) => child.href === pathname || isChildOf(pathname, child.href)));
	}
	function isActiveLink(href, pathname) {
		return href === "/" ? pathname === "/" : pathname === href || isChildOf(pathname, href);
	}
	function normalizePermissions(permissions) {
		if (permissions === void 0 || permissions === null) return null;
		return typeof permissions === "string" ? permissions.split(/[,\s]+/).map((permission) => permission.trim()).filter(Boolean) : permissions;
	}
	function resolveUser(user, userName, userEmail) {
		if (user === null) return null;
		if (userName !== void 0 || userEmail !== void 0) return {
			name: userName,
			email: userEmail ?? ""
		};
		return user ?? DEFAULT_USER;
	}
	function displayNameOf(person) {
		return person.name || person.email;
	}
	function toLength$1(value) {
		if (typeof value === "number" || typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) return `${String(value).trim()}px`;
		return value;
	}
	function visibleItems(items, canSee, iconsOnly) {
		return items.flatMap((item) => {
			if (!isBranch(item)) return canSee(item) ? [item] : [];
			const children = item.children.filter(canSee);
			if (children.length === 0) return [];
			return iconsOnly ? children : [{
				...item,
				children
			}];
		});
	}
	function dependsOnPermissions(item) {
		return isBranch(item) ? item.children.every((child) => Boolean(child.permission)) : Boolean(item.permission);
	}
	function SidebarLink({ item, collapsed, showIcon = true, active, onSelect }) {
		const link = /* @__PURE__ */ react.createElement("a", {
			href: item.href,
			"aria-current": active ? "page" : void 0,
			className: cx("ab-sidebar__link", active && "ab-sidebar__link--active", collapsed && "ab-sidebar__link--icon"),
			onClick: (event) => {
				event.preventDefault();
				onSelect(item.href);
			}
		}, showIcon ? renderIcon(item.icon, 20) : null, collapsed ? /* @__PURE__ */ react.createElement("span", { className: "ab-sr-only" }, item.label) : /* @__PURE__ */ react.createElement("span", { className: "ab-sidebar__link-label" }, item.label));
		if (!collapsed) return link;
		return /* @__PURE__ */ react.createElement(Tooltip, {
			content: item.label,
			side: "right"
		}, link);
	}
	function SidebarBranch({ branch, open, onToggle, pathname, onSelect }) {
		const listId = react.useId();
		return /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement("button", {
			type: "button",
			"aria-expanded": open,
			"aria-controls": listId,
			onClick: onToggle,
			className: "ab-sidebar__branch"
		}, renderIcon(branch.icon, 20), /* @__PURE__ */ react.createElement("span", { className: "ab-sidebar__branch-label" }, branch.label), /* @__PURE__ */ react.createElement(Icon, {
			name: "chevron-down",
			size: 16,
			className: cx("ab-sidebar__chevron", !open && "ab-sidebar__chevron--closed")
		})), open ? /* @__PURE__ */ react.createElement("ul", {
			id: listId,
			className: "ab-sidebar__children"
		}, branch.children.map((child) => /* @__PURE__ */ react.createElement("li", { key: child.href }, /* @__PURE__ */ react.createElement(SidebarLink, {
			item: child,
			collapsed: false,
			showIcon: false,
			active: isActiveLink(child.href, pathname),
			onSelect
		})))) : null);
	}
	function Sidebar({ navigation = DEFAULT_NAVIGATION, active, defaultActive = DEFAULT_ACTIVE, onNavigate, collapsed, defaultCollapsed = false, onCollapsedChange, user, userName, userEmail, permissions, loading = false, loadError = false, onRetry, navigationLabel = "Navegación principal", collapseLabel = "Contraer menú", expandLabel = "Expandir menú", loadErrorLabel = "No pudimos cargar tu menú.", retryLabel = "Reintentar", retryLoadLabel = "Reintentar cargar el menú", className, style }) {
		const [pathname, setPathname] = useControllable(active, defaultActive, onNavigate);
		const [iconsOnly, setCollapsed] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
		const granted = normalizePermissions(permissions);
		const person = loading || loadError ? null : resolveUser(user, userName, userEmail);
		const activeBranchKey = branchOf(navigation, pathname)?.label;
		const [openBranchKeys, setOpenBranchKeys] = react.useState(() => activeBranchKey ? [activeBranchKey] : []);
		const [lastActiveBranchKey, setLastActiveBranchKey] = react.useState(activeBranchKey);
		if (activeBranchKey !== lastActiveBranchKey) {
			setLastActiveBranchKey(activeBranchKey);
			if (activeBranchKey && !openBranchKeys.includes(activeBranchKey)) setOpenBranchKeys([...openBranchKeys, activeBranchKey]);
		}
		function toggleBranch(key) {
			setOpenBranchKeys((previous) => previous.includes(key) ? previous.filter((open) => open !== key) : [...previous, key]);
		}
		const canSee = (link) => loading || !link.permission || !loadError && (granted === null || granted.includes(link.permission));
		return /* @__PURE__ */ react.createElement("aside", {
			className: cx("ab-sidebar", iconsOnly && "ab-sidebar--collapsed", className),
			style
		}, /* @__PURE__ */ react.createElement("div", { className: "ab-sidebar__head" }, /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: "ab-sidebar__brand"
		})), /* @__PURE__ */ react.createElement(IconButton, {
			label: iconsOnly ? expandLabel : collapseLabel,
			icon: "chevron-left",
			iconSize: 14,
			className: "ab-sidebar__toggle",
			onClick: () => setCollapsed(!iconsOnly)
		}), /* @__PURE__ */ react.createElement("nav", {
			"aria-label": navigationLabel,
			className: "ab-sidebar__nav"
		}, loadError ? /* @__PURE__ */ react.createElement("div", { className: cx("ab-sidebar__error", iconsOnly && "ab-sidebar__error--center") }, /* @__PURE__ */ react.createElement("p", { className: iconsOnly ? "ab-sr-only" : "ab-sidebar__error-text" }, loadErrorLabel), iconsOnly ? /* @__PURE__ */ react.createElement(IconButton, {
			label: retryLoadLabel,
			icon: "refresh",
			size: "icon-sm",
			onClick: onRetry
		}) : /* @__PURE__ */ react.createElement("button", {
			type: "button",
			className: "ab-btn ab-btn--outline ab-btn--size-sm",
			onClick: onRetry
		}, retryLabel)) : null, navigation.map((group, index) => {
			const items = visibleItems(group.items ?? [], canSee, iconsOnly);
			if (items.length === 0) return null;
			return /* @__PURE__ */ react.createElement("div", {
				key: group.label ?? index,
				className: cx("ab-sidebar__group", index > 0 && "ab-sidebar__group--spaced")
			}, index > 0 && !iconsOnly ? /* @__PURE__ */ react.createElement("p", { className: "ab-sidebar__group-label" }, group.label) : null, index > 0 && iconsOnly ? /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement("span", { className: "ab-sr-only" }, group.label), /* @__PURE__ */ react.createElement("div", {
				"aria-hidden": "true",
				className: "ab-sidebar__divider"
			})) : null, /* @__PURE__ */ react.createElement("ul", { className: "ab-sidebar__list" }, items.map((item) => /* @__PURE__ */ react.createElement("li", { key: isBranch(item) ? item.label : item.href }, loading && dependsOnPermissions(item) ? /* @__PURE__ */ react.createElement(Skeleton, {
				radius: "var(--radius-control)",
				width: iconsOnly ? 40 : void 0,
				height: iconsOnly ? 40 : 36
			}) : isBranch(item) ? /* @__PURE__ */ react.createElement(SidebarBranch, {
				branch: item,
				open: openBranchKeys.includes(item.label),
				onToggle: () => toggleBranch(item.label),
				pathname,
				onSelect: setPathname
			}) : /* @__PURE__ */ react.createElement(SidebarLink, {
				item,
				collapsed: iconsOnly,
				active: isActiveLink(item.href, pathname),
				onSelect: setPathname
			})))));
		})), person || loading ? /* @__PURE__ */ react.createElement("div", { className: "ab-sidebar__footer" }, /* @__PURE__ */ react.createElement("div", { className: "ab-sidebar__user" }, person ? /* @__PURE__ */ react.createElement(Avatar, { name: displayNameOf(person) }) : /* @__PURE__ */ react.createElement(Skeleton, {
			width: 32,
			height: 32,
			radius: "full",
			className: "ab-sidebar__avatar-skeleton"
		}), iconsOnly ? null : /* @__PURE__ */ react.createElement("div", { className: "ab-sidebar__identity" }, person ? /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement("p", { className: "ab-sidebar__name" }, displayNameOf(person)), /* @__PURE__ */ react.createElement("p", { className: "ab-sidebar__email" }, person.email)) : /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement("div", { className: "ab-sidebar__line ab-sidebar__line--name" }, /* @__PURE__ */ react.createElement(Skeleton, {
			width: 96,
			height: 14
		})), /* @__PURE__ */ react.createElement("div", { className: "ab-sidebar__line ab-sidebar__line--email" }, /* @__PURE__ */ react.createElement(Skeleton, {
			width: 128,
			height: 12
		})))))) : null);
	}
	function crumbsFrom(navigation, pathname, leaf, homeLabel) {
		const links = flatLinks(navigation);
		const activeLabel = pathname === "/" ? void 0 : links.find((link) => link.href === pathname)?.label ?? EXTRA_LABELS[pathname];
		const parent = activeLabel ? void 0 : links.find((link) => isChildOf(pathname, link.href));
		if (!activeLabel && !parent) return [{
			label: homeLabel,
			current: true
		}];
		const crumbs = [{
			label: homeLabel,
			href: "/"
		}];
		const branch = branchOf(navigation, pathname);
		if (branch) crumbs.push({ label: branch.label });
		if (parent) crumbs.push({
			label: parent.label,
			href: parent.href
		});
		const currentLabel = activeLabel ?? leaf;
		if (currentLabel) crumbs.push({
			label: currentLabel,
			current: true
		});
		return crumbs;
	}
	function Breadcrumbs({ items, navigation = DEFAULT_NAVIGATION, active, defaultActive = DEFAULT_ACTIVE, leaf, onNavigate, homeLabel, label = "Migas de pan", className, style }) {
		const [pathname, setPathname] = useControllable(active, defaultActive, onNavigate);
		const home = homeLabel ?? flatLinks(navigation).find((link) => link.href === "/")?.label ?? "Inicio";
		const crumbs = items ? items.map((item, index) => ({
			...item,
			current: item.current ?? index === items.length - 1
		})) : crumbsFrom(navigation, pathname, leaf, home);
		return /* @__PURE__ */ react.createElement("nav", {
			"aria-label": label,
			className: cx("ab-breadcrumbs", className),
			style
		}, /* @__PURE__ */ react.createElement("ol", { className: "ab-breadcrumbs__list" }, crumbs.map((crumb, index) => /* @__PURE__ */ react.createElement(react.Fragment, { key: index }, index > 0 ? /* @__PURE__ */ react.createElement("li", {
			"aria-hidden": "true",
			className: "ab-breadcrumbs__separator"
		}, "/") : null, crumb.current ? /* @__PURE__ */ react.createElement("li", {
			"aria-current": "page",
			className: "ab-breadcrumbs__item ab-breadcrumbs__item--current"
		}, crumb.label) : crumb.href !== void 0 ? /* @__PURE__ */ react.createElement("li", { className: "ab-breadcrumbs__item" }, /* @__PURE__ */ react.createElement("a", {
			href: crumb.href,
			className: "ab-breadcrumbs__link",
			onClick: (event) => {
				event.preventDefault();
				setPathname(crumb.href);
			}
		}, crumb.label)) : /* @__PURE__ */ react.createElement("li", { className: "ab-breadcrumbs__item ab-breadcrumbs__item--muted" }, crumb.label)))));
	}
	function UserMenu({ user, userName, userEmail, loading = false, language, defaultLanguage = "es", onLanguageChange, languages = DEFAULT_LANGUAGES, onProfile, onSignOut, open, defaultOpen = false, onOpenChange, triggerLabel = "Menú de {{name}}", profileLabel = "Mi perfil", languageLabel = "Idioma", signOutLabel = "Cerrar sesión", className, style }) {
		const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
		const [current, setLanguage] = useControllable(language, defaultLanguage, onLanguageChange);
		const person = loading ? null : resolveUser(user, userName, userEmail);
		if (!person) return loading ? /* @__PURE__ */ react.createElement(Skeleton, {
			width: 32,
			height: 32,
			radius: "full",
			className: cx("ab-user-menu__skeleton", className),
			style
		}) : null;
		const displayName = displayNameOf(person);
		return /* @__PURE__ */ react.createElement(DropdownMenu, {
			align: "end",
			open: isOpen,
			onOpenChange: setOpen,
			className: cx("ab-user-menu", className),
			style,
			triggerClassName: "ab-user-menu__trigger",
			label: /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement(Avatar, { name: displayName }), /* @__PURE__ */ react.createElement("span", { className: "ab-sr-only" }, format(triggerLabel, { name: displayName })), /* @__PURE__ */ react.createElement(Icon, {
				name: "chevron-down",
				size: 16,
				className: "ab-user-menu__chevron"
			}))
		}, /* @__PURE__ */ react.createElement("div", { className: "ab-menu-label ab-user-menu__identity" }, /* @__PURE__ */ react.createElement("p", { className: "ab-user-menu__name" }, displayName), /* @__PURE__ */ react.createElement("p", { className: "ab-user-menu__email" }, person.email)), /* @__PURE__ */ react.createElement(MenuSeparator, null), /* @__PURE__ */ react.createElement(MenuItem, { onSelect: onProfile }, profileLabel), /* @__PURE__ */ react.createElement(MenuSeparator, null), /* @__PURE__ */ react.createElement("div", { className: "ab-menu-label ab-user-menu__section" }, languageLabel), /* @__PURE__ */ react.createElement("div", { role: "group" }, languages.map((option) => /* @__PURE__ */ react.createElement(MenuRadioItem, {
			key: option.value,
			checked: current === option.value,
			onSelect: () => {
				setLanguage(option.value);
				setOpen(false);
			}
		}, option.label))), /* @__PURE__ */ react.createElement(MenuSeparator, null), /* @__PURE__ */ react.createElement(MenuItem, {
			icon: "log-out",
			onSelect: onSignOut
		}, signOutLabel));
	}
	function Topbar({ breadcrumbs, navigation = DEFAULT_NAVIGATION, active, defaultActive = DEFAULT_ACTIVE, leaf, onNavigate, sidebarExpanded, defaultSidebarExpanded = true, onToggleSidebar, toggleLabel = "Menú de navegación", user, userName, userEmail, loading = false, language, defaultLanguage, onLanguageChange, onProfile, onSignOut, userMenuOpen, defaultUserMenuOpen, onUserMenuOpenChange, className, style }) {
		const [expanded, setExpanded] = useControllable(sidebarExpanded, defaultSidebarExpanded);
		return /* @__PURE__ */ react.createElement("header", {
			className: cx("ab-topbar", className),
			style
		}, /* @__PURE__ */ react.createElement("div", { className: "ab-topbar__start" }, /* @__PURE__ */ react.createElement(IconButton, {
			label: toggleLabel,
			icon: "menu",
			iconSize: 20,
			"aria-expanded": expanded,
			onClick: () => {
				setExpanded(!expanded);
				onToggleSidebar?.();
			}
		}), /* @__PURE__ */ react.createElement(Breadcrumbs, {
			items: breadcrumbs,
			navigation,
			active,
			defaultActive,
			leaf,
			onNavigate
		})), /* @__PURE__ */ react.createElement(UserMenu, {
			user,
			userName,
			userEmail,
			loading,
			language,
			defaultLanguage,
			onLanguageChange,
			onProfile,
			onSignOut,
			open: userMenuOpen,
			defaultOpen: defaultUserMenuOpen,
			onOpenChange: onUserMenuOpenChange
		}));
	}
	function AppShell({ navigation = DEFAULT_NAVIGATION, active, defaultActive = DEFAULT_ACTIVE, onNavigate, collapsed, defaultCollapsed = false, onCollapsedChange, user, userName, userEmail, permissions, loading = false, loadError = false, onRetry, breadcrumbs, leaf, language, defaultLanguage, onLanguageChange, onProfile, onSignOut, userMenuOpen, defaultUserMenuOpen, onUserMenuOpenChange, height = "100%", children, className, style }) {
		const [pathname, setPathname] = useControllable(active, defaultActive, onNavigate);
		const [isCollapsed, setCollapsed] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
		const person = loadError ? null : resolveUser(user, userName, userEmail);
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-root", "ab-app-shell", className),
			style: {
				height: toLength$1(height),
				...style
			}
		}, /* @__PURE__ */ react.createElement(Sidebar, {
			navigation,
			active: pathname,
			onNavigate: setPathname,
			collapsed: isCollapsed,
			onCollapsedChange: setCollapsed,
			user: person,
			permissions,
			loading,
			loadError,
			onRetry
		}), /* @__PURE__ */ react.createElement("div", { className: "ab-app-shell__column" }, /* @__PURE__ */ react.createElement(Topbar, {
			breadcrumbs,
			navigation,
			active: pathname,
			leaf,
			onNavigate: setPathname,
			sidebarExpanded: !isCollapsed,
			onToggleSidebar: () => setCollapsed(!isCollapsed),
			user: person,
			loading,
			language,
			defaultLanguage,
			onLanguageChange,
			onProfile: () => {
				setPathname(PROFILE_HREF);
				onProfile?.();
			},
			onSignOut,
			userMenuOpen,
			defaultUserMenuOpen,
			onUserMenuOpenChange
		}), /* @__PURE__ */ react.createElement("main", { className: "ab-app-shell__main" }, children)));
	}
	function Page({ icon, title, backTo, backHref, backLabel, status, actions, actionLabel, onAction, onNavigate, children, className, style }) {
		const back = backTo ? {
			href: backTo.href ?? backTo.to,
			label: backTo.label
		} : backHref !== void 0 || backLabel !== void 0 ? {
			href: backHref ?? "#",
			label: backLabel
		} : null;
		const primary = actions ?? (actionLabel ? /* @__PURE__ */ react.createElement("button", {
			type: "button",
			className: "ab-btn ab-btn--default ab-btn--size-default",
			onClick: onAction
		}, actionLabel) : null);
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-page", className),
			style
		}, /* @__PURE__ */ react.createElement("header", { className: "ab-page__band" }, /* @__PURE__ */ react.createElement("span", { className: "ab-page__heading" }, back ? /* @__PURE__ */ react.createElement("a", {
			href: back.href,
			"aria-label": back.label,
			title: back.label,
			className: "ab-page__back",
			onClick: (event) => {
				event.preventDefault();
				onNavigate?.(back.href);
			}
		}, /* @__PURE__ */ react.createElement(Icon, {
			name: "chevron-left",
			size: 16
		})) : icon ? /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: "ab-page__icon"
		}, renderIcon(icon, 16)) : null, /* @__PURE__ */ react.createElement("h1", { className: "ab-page__title" }, title), status ? /* @__PURE__ */ react.createElement("span", { className: "ab-page__status" }, status) : null), primary ? /* @__PURE__ */ react.createElement("span", { className: "ab-page__actions" }, primary) : null), /* @__PURE__ */ react.createElement("div", { className: "ab-page__body" }, children));
	}
	function AuthLayout({ language, defaultLanguage = "es", onLanguageChange, languages = DEFAULT_LANGUAGES, languageLabel = "Idioma", minHeight = "100%", children, className, style }) {
		const [current, setLanguage] = useControllable(language, defaultLanguage, onLanguageChange);
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-root", "ab-auth-layout", className),
			style: {
				minHeight: toLength$1(minHeight),
				...style
			}
		}, /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: "ab-auth-layout__brand"
		}), /* @__PURE__ */ react.createElement("div", { className: "ab-auth-layout__card" }, children), /* @__PURE__ */ react.createElement("div", { className: "ab-auth-layout__languages" }, /* @__PURE__ */ react.createElement("span", null, languageLabel, ":"), languages.map((option) => /* @__PURE__ */ react.createElement("button", {
			key: option.value,
			type: "button",
			"aria-pressed": current === option.value,
			onClick: () => setLanguage(option.value),
			className: cx("ab-auth-layout__language", current === option.value && "ab-auth-layout__language--current")
		}, option.label))));
	}

//#endregion
//#region forms.jsx
	function toList(value) {
		if (Array.isArray(value)) return value;
		if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
		return [];
	}
	function normalizeOptions$1(options) {
		return toList(options).map((option) => typeof option === "string" ? {
			value: option,
			label: option
		} : option);
	}
	const FieldContext = react.createContext(null);
	function useFieldProps(props) {
		const field = react.useContext(FieldContext);
		if (!field) return props;
		return {
			...props,
			id: props.id ?? field.id,
			"aria-invalid": props["aria-invalid"] ?? field.invalid,
			"aria-describedby": props["aria-describedby"] ?? field.describedBy
		};
	}
	const NATIVE_CONTROLS = /* @__PURE__ */ new Set([
		"input",
		"textarea",
		"select",
		"button"
	]);
	function Label({ className, children, ...props }) {
		return /* @__PURE__ */ react.createElement("label", {
			"data-slot": "label",
			className: cx("ab-label", className),
			...props
		}, children);
	}
	const Input = react.forwardRef(function Input(rawProps, ref) {
		const { className, type, ...props } = useFieldProps(rawProps);
		return /* @__PURE__ */ react.createElement("input", {
			ref,
			type,
			"data-slot": "input",
			className: cx("ab-input", className),
			...props
		});
	});
	Input.displayName = "Input";
	const Textarea = react.forwardRef(function Textarea(rawProps, ref) {
		const { className, ...props } = useFieldProps(rawProps);
		return /* @__PURE__ */ react.createElement("textarea", {
			ref,
			"data-slot": "textarea",
			className: cx("ab-textarea", className),
			...props
		});
	});
	Textarea.displayName = "Textarea";
	function FormField({ label, htmlFor, hint, error, required = false, children, className, style }) {
		const generatedId = react.useId();
		const items = react.Children.toArray(children);
		const controlIndex = items.findIndex((item) => react.isValidElement(item));
		const control = controlIndex >= 0 ? items[controlIndex] : null;
		const controlId = htmlFor ?? control?.props?.id ?? generatedId;
		const messageId = `${controlId}-message`;
		const message = error || hint;
		const field = react.useMemo(() => ({
			id: controlId,
			invalid: error ? true : void 0,
			describedBy: message ? messageId : void 0
		}), [
			controlId,
			error,
			message,
			messageId
		]);
		return /* @__PURE__ */ react.createElement(FieldContext.Provider, { value: field }, /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-field", className),
			style
		}, /* @__PURE__ */ react.createElement(Label, { htmlFor: controlId }, label, required ? /* @__PURE__ */ react.createElement("span", { "aria-hidden": "true" }, " *") : null), items.map((item, index) => {
			if (index === controlIndex && NATIVE_CONTROLS.has(item.type)) return react.cloneElement(item, {
				id: controlId,
				"aria-invalid": error ? true : void 0,
				"aria-describedby": message ? messageId : void 0
			});
			return typeof item === "string" && item.trim() === "" ? null : item;
		}), message ? /* @__PURE__ */ react.createElement("p", {
			id: messageId,
			role: error ? "alert" : void 0,
			className: cx("ab-field__message", error && "ab-field__message--error")
		}, message) : null));
	}
	function FormError({ children, className }) {
		if (children === void 0 || children === null || children === false || children === "") return null;
		return /* @__PURE__ */ react.createElement("p", {
			role: "alert",
			className: cx("ab-form-error", className)
		}, children);
	}
	function SearchInput({ value, defaultValue = "", onChange, delay = 300, label, id, className, style }) {
		const [inner, setInner] = react.useState(defaultValue);
		const controlled = value !== void 0;
		const current = controlled ? value : inner;
		const [draft, setDraft] = react.useState(current);
		const [previousValue, setPreviousValue] = react.useState(current);
		const onChangeRef = react.useRef(onChange);
		react.useEffect(() => {
			onChangeRef.current = onChange;
		}, [onChange]);
		if (current !== previousValue) {
			setPreviousValue(current);
			setDraft(current);
		}
		react.useEffect(() => {
			if (draft === current) return;
			const timer = setTimeout(() => {
				if (!controlled) setInner(draft);
				onChangeRef.current?.(draft);
			}, delay);
			return () => clearTimeout(timer);
		}, [
			draft,
			delay,
			current,
			controlled
		]);
		const text = label ?? "Buscar";
		return /* @__PURE__ */ react.createElement(Input, {
			type: "search",
			id,
			className,
			style,
			value: draft,
			onChange: (event) => setDraft(event.target.value),
			"aria-label": text,
			placeholder: text
		});
	}
	function NativeSelect({ options, value, onChange, placeholder, id, disabled, ariaLabel, ariaInvalid, ariaDescribedBy, className, style }) {
		const current = value ?? (placeholder ? "" : options[0]?.value ?? "");
		return /* @__PURE__ */ react.createElement("select", {
			id,
			className: cx("ab-input", "ab-select--native", className),
			style,
			value: current,
			disabled,
			"aria-label": ariaLabel,
			"aria-invalid": ariaInvalid,
			"aria-describedby": ariaDescribedBy,
			onChange: (event) => onChange(event.target.value)
		}, placeholder ? /* @__PURE__ */ react.createElement("option", {
			value: "",
			disabled: true
		}, placeholder) : null, options.map((option) => /* @__PURE__ */ react.createElement("option", {
			key: option.value,
			value: option.value
		}, option.label)));
	}
	function ListSelect({ options, value, onChange, placeholder, id, disabled, size, block, open: openProp, defaultOpen, onOpenChange, ariaLabel, ariaInvalid, ariaDescribedBy, className, style }) {
		const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
		const [active, setActive] = react.useState(void 0);
		const rootRef = react.useRef(null);
		const triggerRef = react.useRef(null);
		const listRef = react.useRef(null);
		const focusOnOpen = react.useRef(false);
		const listId = `${react.useId()}-listbox`;
		const selected = options.find((option) => option.value === value);
		const highlighted = active === void 0 ? selected?.value : active;
		const close = react.useCallback(() => setOpen(false), [setOpen]);
		const onKeyDown = useDismiss(rootRef, open, () => {
			close();
			triggerRef.current?.focus();
		});
		react.useEffect(() => {
			if (open && focusOnOpen.current) {
				focusOnOpen.current = false;
				(listRef.current?.querySelector("[role=\"option\"][aria-selected=\"true\"]") ?? listRef.current?.querySelector("[role=\"option\"]"))?.focus();
			}
		}, [open]);
		function openList() {
			setActive(void 0);
			focusOnOpen.current = true;
			setOpen(true);
		}
		function onTriggerKeyDown(event) {
			if (!open && [
				"ArrowDown",
				"ArrowUp",
				"Enter",
				" "
			].includes(event.key)) {
				event.preventDefault();
				openList();
			}
		}
		function onListKeyDown(event) {
			if (event.key === "Tab") {
				event.preventDefault();
				return;
			}
			if (![
				"ArrowDown",
				"ArrowUp",
				"Home",
				"End"
			].includes(event.key)) return;
			event.preventDefault();
			const items = Array.from(event.currentTarget.querySelectorAll("[role=\"option\"]")).filter((item) => !item.disabled);
			let candidates = event.key === "ArrowUp" || event.key === "End" ? items.reverse() : items;
			if (event.key === "ArrowDown" || event.key === "ArrowUp") candidates = candidates.slice(candidates.indexOf(document.activeElement) + 1);
			candidates[0]?.focus();
		}
		function choose(optionValue) {
			if (optionValue !== value) onChange(optionValue);
			close();
			triggerRef.current?.focus();
		}
		return /* @__PURE__ */ react.createElement("span", {
			ref: rootRef,
			className: cx("ab-select", block && "ab-select--block", className),
			style,
			onKeyDown
		}, /* @__PURE__ */ react.createElement("button", {
			ref: triggerRef,
			type: "button",
			role: "combobox",
			id,
			"aria-controls": listId,
			"aria-expanded": open,
			"aria-autocomplete": "none",
			"aria-label": ariaLabel,
			"aria-invalid": ariaInvalid,
			"aria-describedby": ariaDescribedBy,
			disabled,
			"data-slot": "select-trigger",
			"data-size": size,
			"data-placeholder": selected ? void 0 : "",
			className: cx("ab-select__trigger", size === "sm" && "ab-select__trigger--sm", !selected && "ab-select__trigger--placeholder"),
			onClick: () => open ? close() : openList(),
			onKeyDown: onTriggerKeyDown
		}, /* @__PURE__ */ react.createElement("span", { className: "ab-select__value" }, selected ? selected.label : placeholder), /* @__PURE__ */ react.createElement(Icon, {
			name: "chevron-down",
			size: 16,
			className: "ab-select__chevron"
		})), open ? /* @__PURE__ */ react.createElement("div", {
			ref: listRef,
			id: listId,
			role: "listbox",
			tabIndex: -1,
			className: "ab-menu ab-menu--start ab-select__content",
			onKeyDown: onListKeyDown
		}, options.map((option) => {
			const isSelected = option.value === value;
			return /* @__PURE__ */ react.createElement("button", {
				key: option.value,
				type: "button",
				role: "option",
				"aria-selected": isSelected,
				disabled: option.disabled,
				"data-highlighted": option.value === highlighted ? "" : void 0,
				className: cx("ab-menu-item", "ab-select__item", option.value === highlighted && "ab-select__item--highlighted"),
				onMouseMove: (event) => {
					if (document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
				},
				onMouseLeave: (event) => {
					if (document.activeElement === event.currentTarget) {
						listRef.current?.focus({ preventScroll: true });
						setActive(null);
					}
				},
				onFocus: () => setActive(option.value),
				onClick: () => choose(option.value)
			}, /* @__PURE__ */ react.createElement("span", {
				className: "ab-select__indicator",
				"aria-hidden": "true"
			}, isSelected ? /* @__PURE__ */ react.createElement(Icon, {
				name: "check",
				size: 16
			}) : null), /* @__PURE__ */ react.createElement("span", { className: "ab-select__item-text" }, option.label));
		})) : null);
	}
	function Select(rawProps) {
		const { options, value: valueProp, defaultValue, onChange, placeholder, id, disabled = false, size = "default", native = false, block = false, open, defaultOpen = false, onOpenChange, "aria-label": ariaLabel, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, className, style } = useFieldProps(rawProps);
		const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
		const shared = {
			options: normalizeOptions$1(options),
			value,
			onChange: setValue,
			placeholder,
			id,
			disabled,
			ariaLabel,
			ariaInvalid,
			ariaDescribedBy,
			className,
			style
		};
		if (native) return /* @__PURE__ */ react.createElement(NativeSelect, shared);
		return /* @__PURE__ */ react.createElement(ListSelect, {
			...shared,
			size,
			block,
			open,
			defaultOpen,
			onOpenChange
		});
	}
	function MultiSelect(rawProps) {
		const { options, value: valueProp, defaultValue = [], onChange, placeholder = "Sin roles", id, open, defaultOpen = false, onOpenChange, "aria-label": ariaLabel, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, className, style } = useFieldProps(rawProps);
		const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
		const current = toList(value);
		const list = normalizeOptions$1(options);
		const picked = list.filter((option) => current.includes(option.value));
		function toggle(optionValue, checked) {
			setValue(checked ? [...current, optionValue] : current.filter((item) => item !== optionValue));
		}
		return /* @__PURE__ */ react.createElement(DropdownMenu, {
			block: true,
			matchTriggerWidth: true,
			minWidth: 192,
			open,
			defaultOpen,
			onOpenChange,
			className: cx("ab-multiselect", className),
			style,
			triggerClassName: cx("ab-multiselect__trigger", picked.length === 0 && "ab-multiselect__trigger--empty"),
			triggerAriaLabel: ariaLabel,
			triggerProps: {
				id,
				"aria-invalid": ariaInvalid,
				"aria-describedby": ariaDescribedBy
			},
			label: [/* @__PURE__ */ react.createElement("span", {
				key: "value",
				className: "ab-multiselect__value"
			}, picked.length > 0 ? picked.map((option) => option.label).join(", ") : placeholder), /* @__PURE__ */ react.createElement(Icon, {
				key: "chevron",
				name: "chevron-down",
				size: 14,
				className: "ab-multiselect__chevron"
			})]
		}, list.map((option) => /* @__PURE__ */ react.createElement(MenuCheckboxItem, {
			key: option.value,
			checked: current.includes(option.value),
			description: option.description,
			onCheckedChange: (checked) => toggle(option.value, checked)
		}, option.label)));
	}
	function Checkbox(rawProps) {
		const { checked: checkedProp, defaultChecked = false, onCheckedChange, id, disabled = false, className, style, onClick, onKeyDown, ...props } = useFieldProps(rawProps);
		const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange);
		const isChecked = checked === true;
		return /* @__PURE__ */ react.createElement("button", {
			type: "button",
			role: "checkbox",
			id,
			"aria-checked": isChecked,
			"data-state": isChecked ? "checked" : "unchecked",
			"data-slot": "checkbox",
			disabled,
			className: cx("ab-checkbox", className),
			style,
			...props,
			onKeyDown: (event) => {
				onKeyDown?.(event);
				if (event.key === "Enter") event.preventDefault();
			},
			onClick: (event) => {
				onClick?.(event);
				if (!event.defaultPrevented) setChecked(!isChecked);
			}
		}, isChecked ? /* @__PURE__ */ react.createElement("span", {
			"data-slot": "checkbox-indicator",
			className: "ab-checkbox__indicator"
		}, /* @__PURE__ */ react.createElement(Icon, {
			name: "check",
			size: 14
		})) : null);
	}
	function CheckboxField({ label, checked: checkedProp, defaultChecked = false, onCheckedChange, description, disabled = false, className, style }) {
		const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange);
		const id = react.useId();
		const descriptionId = `${id}-description`;
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-checkbox-field", className),
			style
		}, /* @__PURE__ */ react.createElement(Checkbox, {
			id,
			checked: checked === true,
			disabled,
			"aria-describedby": description ? descriptionId : void 0,
			onCheckedChange: setChecked,
			className: "ab-checkbox-field__control"
		}), /* @__PURE__ */ react.createElement("div", { className: "ab-checkbox-field__text" }, /* @__PURE__ */ react.createElement(Label, {
			htmlFor: id,
			className: "ab-checkbox-field__label"
		}, label), description ? /* @__PURE__ */ react.createElement("p", {
			id: descriptionId,
			className: "ab-checkbox-field__description"
		}, description) : null));
	}
	function Switch(rawProps) {
		const { checked: checkedProp, defaultChecked = false, onCheckedChange, id, disabled = false, size = "default", className, style, onClick, ...props } = useFieldProps(rawProps);
		const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange);
		const isChecked = checked === true;
		const state = isChecked ? "checked" : "unchecked";
		return /* @__PURE__ */ react.createElement("button", {
			type: "button",
			role: "switch",
			id,
			"aria-checked": isChecked,
			"data-state": state,
			"data-size": size,
			"data-slot": "switch",
			disabled,
			className: cx("ab-switch", size === "sm" && "ab-switch--sm", className),
			style,
			...props,
			onClick: (event) => {
				onClick?.(event);
				if (!event.defaultPrevented) setChecked(!isChecked);
			}
		}, /* @__PURE__ */ react.createElement("span", {
			"data-slot": "switch-thumb",
			"data-state": state,
			className: "ab-switch__thumb"
		}));
	}

//#endregion
//#region lists.jsx
	function Surface({ children, className, style }) {
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-surface", className),
			style
		}, children);
	}
	function Table({ children, className, style, ...props }) {
		return /* @__PURE__ */ react.createElement("div", {
			"data-slot": "table-container",
			className: "ab-table-container"
		}, /* @__PURE__ */ react.createElement("table", {
			"data-slot": "table",
			className: cx("ab-table", className),
			style,
			...props
		}, children));
	}
	function TableHeader({ children, className, style, ...props }) {
		return /* @__PURE__ */ react.createElement("thead", {
			"data-slot": "table-header",
			className: cx("ab-table-header", className),
			style,
			...props
		}, /* @__PURE__ */ react.createElement("tr", {
			"data-slot": "table-row",
			className: "ab-table-row ab-table-row--header"
		}, children));
	}
	function TableBody({ children, className, style, ...props }) {
		return /* @__PURE__ */ react.createElement("tbody", {
			"data-slot": "table-body",
			className: cx("ab-table-body", className),
			style,
			...props
		}, children);
	}
	function TableRow({ children, selected = false, dataState, className, style, ...props }) {
		return /* @__PURE__ */ react.createElement("tr", {
			"data-slot": "table-row",
			"data-state": selected ? "selected" : dataState,
			className: cx("ab-table-row", className),
			style,
			...props
		}, children);
	}
	function TableHead({ children, align = "left", sortable = false, sort, onSort, className, style, ...props }) {
		return /* @__PURE__ */ react.createElement("th", {
			"data-slot": "table-head",
			scope: "col",
			"aria-sort": sort ?? "none",
			className: cx("ab-table-head", align === "right" && "ab-table-head--right", className),
			style,
			...props
		}, sortable ? /* @__PURE__ */ react.createElement(Button, {
			variant: "ghost",
			size: "sm",
			onClick: onSort,
			className: "ab-table-head__sort"
		}, children) : children);
	}
	function TableCell({ children, align = "left", numeric = false, className, style, ...props }) {
		return /* @__PURE__ */ react.createElement("td", {
			"data-slot": "table-cell",
			className: cx("ab-table-cell", align === "right" && "ab-table-cell--right", numeric && "ab-table-cell--numeric", className),
			style,
			...props
		}, children);
	}
	function renderAction(action, onAction) {
		if (action === void 0 || action === null || action === false || action === "") return null;
		if (typeof action === "string") return /* @__PURE__ */ react.createElement(Button, {
			variant: "outline",
			onClick: onAction
		}, action);
		return action;
	}
	function EmptyState({ title = "No hay nada para mostrar", description, action, onAction, children, className, style }) {
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-empty-state", className),
			style
		}, /* @__PURE__ */ react.createElement("h3", { className: "ab-empty-state__title" }, title), description ? /* @__PURE__ */ react.createElement("p", { className: "ab-empty-state__description" }, description) : null, renderAction(action, onAction), children);
	}
	function ariaSort(columnId, sort) {
		if (sort === columnId) return "ascending";
		return sort === `-${columnId}` ? "descending" : "none";
	}
	function defaultRowKey(row, index) {
		return row && row.id !== void 0 && row.id !== null ? String(row.id) : String(index);
	}
	function DataTable({ columns: columnsProp, rows: rowsProp, rowKey = defaultRowKey, isLoading = false, error, errorDescription, onRetry, retryLabel = "Reintentar", emptyTitle, emptyDescription, emptyAction, onEmptyAction, sort: sortProp, defaultSort, onSortChange, loadingLabel = "Cargando…" }) {
		const [innerSort, setInnerSort] = react.useState(defaultSort);
		const controlled = sortProp !== void 0;
		const sort = controlled ? sortProp : innerSort;
		const canSort = !controlled || Boolean(onSortChange);
		const columns = columnsProp ?? [];
		const rows = rowsProp ?? [];
		const keyOf = typeof rowKey === "function" ? rowKey : typeof rowKey === "string" ? (row) => String(row[rowKey]) : defaultRowKey;
		function toggleSort(field) {
			if (!controlled) setInnerSort(sort === field ? `-${field}` : field);
			if (onSortChange) onSortChange(field);
		}
		if (error) return /* @__PURE__ */ react.createElement(EmptyState, {
			title: error,
			description: errorDescription,
			action: retryLabel || void 0,
			onAction: onRetry
		});
		if (isLoading) return /* @__PURE__ */ react.createElement("div", { className: "ab-data-table__loading" }, /* @__PURE__ */ react.createElement(Spinner, { label: loadingLabel }));
		if (rows.length === 0) return /* @__PURE__ */ react.createElement(EmptyState, {
			title: emptyTitle ?? "No hay nada para mostrar",
			description: emptyDescription,
			action: emptyAction,
			onAction: onEmptyAction
		});
		return /* @__PURE__ */ react.createElement(Table, null, /* @__PURE__ */ react.createElement(TableHeader, null, columns.map((column) => /* @__PURE__ */ react.createElement(TableHead, {
			key: column.id,
			align: column.align,
			sortable: Boolean(column.sortable) && canSort,
			sort: ariaSort(column.id, sort),
			onSort: () => toggleSort(column.id)
		}, column.header))), /* @__PURE__ */ react.createElement(TableBody, null, rows.map((row, index) => /* @__PURE__ */ react.createElement(TableRow, { key: keyOf(row, index) }, columns.map((column) => /* @__PURE__ */ react.createElement(TableCell, {
			key: column.id,
			align: column.align,
			numeric: Boolean(column.numeric)
		}, column.cell ? column.cell(row) : row[column.id]))))));
	}
	function toNumber(value, fallback) {
		if (value === void 0 || value === null || value === "") return fallback;
		const number = Number(value);
		return Number.isNaN(number) ? fallback : number;
	}
	function Pagination({ page: pageProp, defaultPage = 1, pageSize = 20, totalCount = 0, totalPages: totalPagesProp, hasPrevious: hasPreviousProp, hasNext: hasNextProp, onPageChange, label = "Paginado", previousLabel = "Página anterior", nextLabel = "Página siguiente", rangeFormat = "{{from}}–{{to}} de {{total}}", pageFormat = "Página {{page}} de {{totalPages}}", className, style }) {
		const [current, setPage] = useControllable(pageProp === void 0 ? void 0 : toNumber(pageProp, 1), toNumber(defaultPage, 1), onPageChange);
		const page = toNumber(current, 1);
		const size = toNumber(pageSize, 20);
		const total = toNumber(totalCount, 0);
		const totalPages = toNumber(totalPagesProp, size > 0 ? Math.ceil(total / size) : 0);
		const hasPrevious = hasPreviousProp ?? page > 1;
		const hasNext = hasNextProp ?? page < totalPages;
		const from = total === 0 ? 0 : (page - 1) * size + 1;
		const to = Math.min(page * size, total);
		return /* @__PURE__ */ react.createElement("nav", {
			className: cx("ab-pagination", className),
			style,
			"aria-label": label
		}, /* @__PURE__ */ react.createElement("p", { className: "ab-pagination__range" }, format(rangeFormat, {
			from,
			to,
			total
		})), /* @__PURE__ */ react.createElement("div", { className: "ab-pagination__pager" }, /* @__PURE__ */ react.createElement(IconButton, {
			label: previousLabel,
			icon: "chevron-left",
			size: "icon-sm",
			disabled: !hasPrevious,
			onClick: () => setPage(page - 1)
		}), /* @__PURE__ */ react.createElement("span", { className: "ab-pagination__page" }, format(pageFormat, {
			page,
			totalPages
		})), /* @__PURE__ */ react.createElement(IconButton, {
			label: nextLabel,
			icon: "chevron-right",
			size: "icon-sm",
			disabled: !hasNext,
			onClick: () => setPage(page + 1)
		})));
	}

//#endregion
//#region filters.jsx
	function isSame(left, right) {
		const a = left ?? null;
		const b = right ?? null;
		if (a === null || b === null) return a === b;
		return String(a) === String(b);
	}
	function hasValue(value) {
		return value !== void 0 && value !== null;
	}
	function OptionRow({ label, count, selected, onSelect }) {
		return /* @__PURE__ */ react.createElement(MenuItem, {
			disabled: count === 0,
			selected,
			trailing: hasValue(count) ? count : void 0,
			onSelect,
			className: "ab-filter-option"
		}, label);
	}
	function normalizeOptions(options) {
		return (Array.isArray(options) ? options : []).map((option) => typeof option === "object" && option !== null ? {
			...option,
			label: option.label ?? String(option.value)
		} : {
			value: option,
			label: String(option)
		});
	}
	function FilterChip({ label, value, onRemove, removeLabel = "Quitar el filtro {{name}}", className, style }) {
		const [removed, setRemoved] = react.useState(false);
		if (removed) return null;
		const name = format(removeLabel, { name: typeof label === "string" || typeof label === "number" ? label : "" });
		return /* @__PURE__ */ react.createElement("span", {
			className: cx("ab-filter-chip", className),
			style
		}, /* @__PURE__ */ react.createElement("span", null, /* @__PURE__ */ react.createElement("span", { className: "ab-filter-chip__label" }, label, ":"), " ", /* @__PURE__ */ react.createElement("strong", { className: "ab-filter-chip__value" }, value)), /* @__PURE__ */ react.createElement("button", {
			type: "button",
			"aria-label": name,
			className: "ab-filter-chip__remove",
			onClick: () => {
				if (onRemove) onRemove();
				else setRemoved(true);
			}
		}, /* @__PURE__ */ react.createElement("span", {
			"aria-hidden": "true",
			className: "ab-filter-chip__x"
		}, "×")));
	}
	function FilterBar({ children, total, chips, onRemoveChip, onClear, clearLabel = "Limpiar todo", removeChipLabel, searchLabel = "Buscar", search, defaultSearch = "", onSearchChange, className, style }) {
		const [innerSearch, setInnerSearch] = react.useState(defaultSearch);
		const searchValue = search !== void 0 ? search : innerSearch;
		const [hidden, setHidden] = react.useState([]);
		const ownsChips = onRemoveChip === void 0 && onClear === void 0;
		const list = Array.isArray(chips) ? chips : [];
		const visible = ownsChips ? list.filter((chip) => !hidden.includes(chip.key)) : list;
		function changeSearch(next) {
			if (search === void 0) setInnerSearch(next);
			onSearchChange?.(next);
		}
		function removeChip(key) {
			if (ownsChips) setHidden((current) => [...current, key]);
			onRemoveChip?.(key);
		}
		function clear() {
			if (ownsChips) setHidden(list.map((chip) => chip.key));
			if (search === void 0) setInnerSearch("");
			onClear?.();
		}
		return /* @__PURE__ */ react.createElement("div", {
			className: cx("ab-filter-bar", className),
			style
		}, /* @__PURE__ */ react.createElement("div", { className: "ab-filter-bar__row" }, /* @__PURE__ */ react.createElement("div", { className: "ab-filter-bar__search" }, /* @__PURE__ */ react.createElement(SearchInput, {
			label: searchLabel,
			value: searchValue,
			onChange: changeSearch
		})), children, hasValue(total) ? /* @__PURE__ */ react.createElement("span", { className: "ab-filter-bar__total" }, total) : null), visible.length > 0 ? /* @__PURE__ */ react.createElement("div", { className: "ab-filter-bar__chips" }, visible.map((chip) => /* @__PURE__ */ react.createElement(FilterChip, {
			key: chip.key,
			label: chip.label,
			value: chip.value,
			removeLabel: removeChipLabel,
			onRemove: () => removeChip(chip.key)
		})), /* @__PURE__ */ react.createElement(Button, {
			variant: "link",
			size: "sm",
			onClick: clear,
			className: "ab-filter-bar__clear"
		}, clearLabel)) : null);
	}
	const STATUS_OPTIONS = [
		{
			value: null,
			label: "Todos"
		},
		{
			value: "true",
			label: "Activos"
		},
		{
			value: "false",
			label: "Inactivos"
		}
	];
	function SegmentedControl({ options = STATUS_OPTIONS, value: valueProp, defaultValue = null, onChange, "aria-label": ariaLabelAttribute, ariaLabel, className, style }) {
		const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
		const list = normalizeOptions(options);
		return /* @__PURE__ */ react.createElement("div", {
			role: "group",
			"aria-label": ariaLabelAttribute ?? ariaLabel ?? "Estado",
			className: cx("ab-segmented", className),
			style
		}, list.map((option, index) => {
			const pressed = isSame(option.value, value);
			return /* @__PURE__ */ react.createElement("button", {
				key: typeof option.label === "string" ? option.label : index,
				type: "button",
				"aria-pressed": pressed,
				className: "ab-segmented__option",
				onClick: () => setValue(option.value ?? null)
			}, option.label);
		}));
	}
	function FilterSelect({ label = "Filtrar por rol", anyLabel = "Cualquier rol", options, value: valueProp, defaultValue = null, onChange, open, defaultOpen = false, onOpenChange, className, style }) {
		const [value, setValue] = useControllable(valueProp, defaultValue, onChange);
		const list = normalizeOptions(options);
		const filled = hasValue(value);
		const picked = filled ? list.find((option) => isSame(option.value, value)) : void 0;
		const text = filled ? picked ? picked.label : String(value) : anyLabel;
		return /* @__PURE__ */ react.createElement(DropdownMenu, {
			align: "start",
			minWidth: 192,
			open,
			defaultOpen,
			onOpenChange,
			className,
			style,
			triggerClassName: cx("ab-filter-control", filled && "ab-filter-control--filled"),
			triggerAriaLabel: label,
			label: /* @__PURE__ */ react.createElement(react.Fragment, null, text, /* @__PURE__ */ react.createElement(Icon, {
				name: "chevron-down",
				size: 14
			}))
		}, /* @__PURE__ */ react.createElement(OptionRow, {
			label: anyLabel,
			selected: !filled,
			onSelect: () => setValue(null)
		}), list.map((option) => /* @__PURE__ */ react.createElement(OptionRow, {
			key: String(option.value),
			label: option.label,
			count: option.count,
			selected: isSame(option.value, value),
			onSelect: () => setValue(option.value)
		})));
	}
	function MoreFilters({ label = "Más filtros", sections, values: valuesProp, defaultValues, onChange, open, defaultOpen = false, onOpenChange, className, style }) {
		const [inner, setInner] = react.useState(defaultValues ?? {});
		const values = valuesProp ?? inner;
		const list = Array.isArray(sections) ? sections : [];
		const applied = list.filter((section) => hasValue(values[section.key])).length;
		function choose(key, next) {
			if (valuesProp === void 0) setInner((current) => ({
				...current,
				[key]: next
			}));
			onChange?.(key, next);
		}
		return /* @__PURE__ */ react.createElement(DropdownMenu, {
			align: "start",
			minWidth: 224,
			open,
			defaultOpen,
			onOpenChange,
			className,
			style,
			triggerClassName: "ab-filter-control ab-filter-control--filled",
			label: /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement(Icon, {
				name: "sliders",
				size: 16
			}), label, applied > 0 ? /* @__PURE__ */ react.createElement("span", { className: "ab-filter-count" }, applied) : null)
		}, list.map((section, index) => {
			const current = values[section.key];
			return /* @__PURE__ */ react.createElement(react.Fragment, { key: section.key }, index > 0 ? /* @__PURE__ */ react.createElement(MenuSeparator, null) : null, /* @__PURE__ */ react.createElement(MenuLabel, { caps: true }, section.label), /* @__PURE__ */ react.createElement(OptionRow, {
				label: section.anyLabel ?? "Todos",
				selected: !hasValue(current),
				onSelect: () => choose(section.key, null)
			}), normalizeOptions(section.options).map((option) => /* @__PURE__ */ react.createElement(OptionRow, {
				key: String(option.value),
				label: option.label,
				count: option.count,
				selected: isSame(option.value, current),
				onSelect: () => choose(section.key, option.value)
			})));
		}));
	}

//#endregion
//#region overlays.jsx
	const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]):not([type=\"hidden\"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
	function focusablesIn(node) {
		return node ? Array.from(node.querySelectorAll(FOCUSABLE)) : [];
	}
	function hasContent(children) {
		return react.Children.toArray(children).some((child) => !(typeof child === "string" && child.trim() === ""));
	}
	function toLength(value) {
		return typeof value === "number" ? `${value}px` : value;
	}
	function StrokeIcon({ parts, size, strokeWidth = 2, linejoin = "round" }) {
		return /* @__PURE__ */ react.createElement("svg", {
			viewBox: "0 0 24 24",
			width: size,
			height: size,
			fill: "none",
			stroke: "currentColor",
			strokeWidth,
			strokeLinecap: "round",
			strokeLinejoin: linejoin,
			"aria-hidden": "true",
			focusable: "false"
		}, parts.map((part, index) => typeof part === "string" ? /* @__PURE__ */ react.createElement("path", {
			key: index,
			d: part
		}) : /* @__PURE__ */ react.createElement("circle", {
			key: index,
			cx: part.circle[0],
			cy: part.circle[1],
			r: part.circle[2]
		})));
	}
	function renderTrigger(trigger, variant, open, onOpen) {
		if (trigger === void 0 || trigger === null || trigger === false) return null;
		if (react.isValidElement(trigger)) return react.cloneElement(trigger, {
			"aria-haspopup": "dialog",
			"aria-expanded": open,
			onClick: (event) => {
				trigger.props.onClick?.(event);
				onOpen();
			}
		});
		return /* @__PURE__ */ react.createElement(Button, {
			variant,
			"aria-haspopup": "dialog",
			"aria-expanded": open,
			onClick: onOpen
		}, trigger);
	}
	function renderFooter(footer, close) {
		if (!Array.isArray(footer) || !footer.every((item) => item && typeof item === "object" && "label" in item)) return footer;
		return footer.map((item, index) => /* @__PURE__ */ react.createElement(Button, {
			key: `${item.label}-${index}`,
			variant: item.variant ?? "default",
			type: item.type ?? "button",
			disabled: item.disabled,
			onClick: (event) => {
				item.onClick?.(event);
				if (item.close) close();
			}
		}, item.label));
	}
	function DialogContent({ inline, title, description, children, footer, width, showClose, closeLabel, bandedFooter, onClose, className, style }) {
		const ref = react.useRef(null);
		const titleId = react.useId();
		const descriptionId = react.useId();
		react.useEffect(() => {
			if (inline) return;
			const previous = document.activeElement;
			const node = ref.current;
			(focusablesIn(node)[0] ?? node)?.focus();
			return () => {
				if (previous && typeof previous.focus === "function" && document.contains(previous)) previous.focus();
			};
		}, [inline]);
		function onKeyDown(event) {
			if (event.key === "Escape") {
				event.stopPropagation();
				onClose();
				return;
			}
			if (event.key === "Tab" && !inline) {
				const items = focusablesIn(ref.current);
				if (items.length === 0) {
					event.preventDefault();
					return;
				}
				const first = items[0];
				const last = items[items.length - 1];
				const active = document.activeElement;
				if (event.shiftKey && (active === first || active === ref.current)) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && active === last) {
					event.preventDefault();
					first.focus();
				}
			}
		}
		const own = width !== void 0 && width !== null ? { "--ab-dialog-width": toLength(width) } : null;
		const body = hasContent(children);
		const actions = renderFooter(footer, onClose);
		return /* @__PURE__ */ react.createElement("div", {
			ref,
			role: "dialog",
			"aria-modal": inline ? void 0 : "true",
			"aria-labelledby": title ? titleId : void 0,
			"aria-describedby": description ? descriptionId : void 0,
			tabIndex: -1,
			"data-slot": "dialog-content",
			className: cx("ab-dialog", inline ? "ab-dialog--inline" : "ab-dialog--modal", bandedFooter && "ab-dialog--banded", className),
			style: own || style ? {
				...own,
				...style
			} : void 0,
			onKeyDown
		}, title || description ? /* @__PURE__ */ react.createElement("div", {
			"data-slot": "dialog-header",
			className: "ab-dialog__header"
		}, title ? /* @__PURE__ */ react.createElement("h2", {
			id: titleId,
			"data-slot": "dialog-title",
			className: "ab-dialog__title"
		}, title) : null, description ? /* @__PURE__ */ react.createElement("p", {
			id: descriptionId,
			"data-slot": "dialog-description",
			className: "ab-dialog__description"
		}, description) : null) : null, body ? /* @__PURE__ */ react.createElement("div", { className: "ab-dialog__body" }, children) : null, actions !== void 0 && actions !== null && actions !== false ? /* @__PURE__ */ react.createElement("div", {
			"data-slot": "dialog-footer",
			className: "ab-dialog__footer"
		}, actions) : null, showClose ? /* @__PURE__ */ react.createElement("button", {
			type: "button",
			"data-slot": "dialog-close",
			className: "ab-dialog__close",
			onClick: onClose
		}, /* @__PURE__ */ react.createElement(Icon, {
			name: "x",
			size: 16
		}), /* @__PURE__ */ react.createElement("span", { className: "ab-sr-only" }, closeLabel)) : null);
	}
	function Dialog({ open: openProp, defaultOpen, onOpenChange, title, description, children, footer, width, showClose = true, closeLabel = "Cerrar", inline = false, bandedFooter = false, trigger, triggerVariant = "default", className, style }) {
		const [open, setOpen] = useControllable(openProp, defaultOpen ?? inline, onOpenChange);
		const close = react.useCallback(() => setOpen(false), [setOpen]);
		const opener = renderTrigger(trigger, triggerVariant, open, () => setOpen(true));
		const content = open ? /* @__PURE__ */ react.createElement(DialogContent, {
			inline,
			title,
			description,
			footer,
			width,
			showClose,
			closeLabel,
			bandedFooter,
			onClose: close,
			className,
			style
		}, children) : null;
		if (inline) return /* @__PURE__ */ react.createElement(react.Fragment, null, opener, content);
		return /* @__PURE__ */ react.createElement(react.Fragment, null, opener, open ? /* @__PURE__ */ react.createElement(Portal, null, /* @__PURE__ */ react.createElement("div", {
			"data-slot": "dialog-overlay",
			className: "ab-dialog-overlay",
			onMouseDown: close
		}), content) : null);
	}
	function ConfirmDialog({ open: openProp, defaultOpen, onOpenChange, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", destructive = false, onConfirm, inline = false, trigger, triggerVariant, className, style }) {
		const [open, setOpen] = useControllable(openProp, defaultOpen ?? inline, onOpenChange);
		return /* @__PURE__ */ react.createElement(Dialog, {
			open,
			onOpenChange: setOpen,
			title,
			description,
			inline,
			trigger,
			triggerVariant: triggerVariant ?? (destructive ? "destructive" : "default"),
			className,
			style,
			footer: /* @__PURE__ */ react.createElement(react.Fragment, null, /* @__PURE__ */ react.createElement(Button, {
				variant: "outline",
				onClick: () => setOpen(false)
			}, cancelLabel), /* @__PURE__ */ react.createElement(Button, {
				variant: destructive ? "destructive" : "default",
				onClick: () => {
					onConfirm?.();
					setOpen(false);
				}
			}, confirmLabel))
		});
	}
	const TOAST_LIFETIME = 4e3;
	const TIME_BEFORE_UNMOUNT = 200;
	const TOAST_GAP = 14;
	const VISIBLE_TOASTS = 3;
	const TOAST_TYPES = [
		"success",
		"error",
		"info",
		"warning",
		"message"
	];
	const TOAST_ICONS = {
		success: [{ circle: [
			12,
			12,
			10
		] }, "m16 9-5.5 5.5L8 12"],
		info: [
			{ circle: [
				12,
				12,
				10
			] },
			"M12 16v-4",
			"M12 8h.01"
		],
		warning: [
			"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
			"M12 9v4",
			"M12 17h.01"
		],
		error: [
			"m15 9-6 6",
			"M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",
			"m9 9 6 6"
		]
	};
	function ToastCloseIcon() {
		return /* @__PURE__ */ react.createElement("svg", {
			viewBox: "0 0 24 24",
			width: "12",
			height: "12",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.5",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true",
			focusable: "false"
		}, /* @__PURE__ */ react.createElement("line", {
			x1: "18",
			y1: "6",
			x2: "6",
			y2: "18"
		}), /* @__PURE__ */ react.createElement("line", {
			x1: "6",
			y1: "6",
			x2: "18",
			y2: "18"
		}));
	}
	function normalizeAction(action) {
		if (action === void 0 || action === null || action === false || action === "") return null;
		return typeof action === "string" ? { label: action } : action;
	}
	function ToastParts({ type, title, description, action, closeButton, closeLabel, onDismiss }) {
		const icon = TOAST_ICONS[type];
		const button = normalizeAction(action);
		return /* @__PURE__ */ react.createElement(react.Fragment, null, closeButton ? /* @__PURE__ */ react.createElement("button", {
			type: "button",
			"aria-label": closeLabel,
			className: "ab-toast__close",
			onClick: onDismiss
		}, /* @__PURE__ */ react.createElement(ToastCloseIcon, null)) : null, icon ? /* @__PURE__ */ react.createElement("div", { className: "ab-toast__icon" }, /* @__PURE__ */ react.createElement(StrokeIcon, {
			parts: icon,
			size: 16
		})) : null, /* @__PURE__ */ react.createElement("div", { className: "ab-toast__content" }, /* @__PURE__ */ react.createElement("div", { className: "ab-toast__title" }, title), description ? /* @__PURE__ */ react.createElement("div", { className: "ab-toast__description" }, description) : null), button ? /* @__PURE__ */ react.createElement("button", {
			type: "button",
			className: "ab-toast__button",
			onClick: (event) => {
				button.onClick?.(event);
				if (!event.defaultPrevented) onDismiss?.();
			}
		}, button.label) : null);
	}
	function Toast({ type = "message", title, children, description, action, closeButton, closeLabel = "Cerrar", onClose, className, style }) {
		const [dismissed, setDismissed] = react.useState(false);
		const kind = TOAST_TYPES.includes(type) ? type : "message";
		if (dismissed) return null;
		return /* @__PURE__ */ react.createElement("div", {
			"data-type": kind,
			className: cx("ab-toast", className),
			style
		}, /* @__PURE__ */ react.createElement(ToastParts, {
			type: kind,
			title: title ?? children,
			description,
			action,
			closeButton: closeButton ?? kind === "error",
			closeLabel,
			onDismiss: () => {
				setDismissed(true);
				onClose?.();
			}
		}));
	}
	let toastCounter = 0;
	let toastItems = [];
	const toastListeners = /* @__PURE__ */ new Set();
	function publishToasts(next) {
		toastItems = next;
		toastListeners.forEach((listener) => listener());
	}
	function subscribeToasts(listener) {
		toastListeners.add(listener);
		return () => toastListeners.delete(listener);
	}
	function readToasts() {
		return toastItems;
	}
	function createToast(type, title, options) {
		const settings = options ?? {};
		const id = settings.id ?? `ab-toast-${++toastCounter}`;
		const duration = settings.duration ?? (type === "error" ? Infinity : void 0);
		const item = {
			id,
			type,
			title,
			description: settings.description,
			action: settings.action,
			duration,
			closeButton: settings.closeButton ?? (duration === Infinity ? true : void 0),
			removed: false
		};
		publishToasts(toastItems.some((current) => current.id === id) ? toastItems.map((current) => current.id === id ? item : current) : [...toastItems, item]);
		return id;
	}
	function dismissToast(id) {
		const targets = toastItems.filter((item) => (id === void 0 || item.id === id) && !item.removed);
		if (targets.length === 0) return;
		const ids = new Set(targets.map((item) => item.id));
		publishToasts(toastItems.map((item) => ids.has(item.id) ? {
			...item,
			removed: true
		} : item));
		setTimeout(() => {
			publishToasts(toastItems.filter((item) => !(ids.has(item.id) && item.removed)));
		}, TIME_BEFORE_UNMOUNT);
	}
	function toast(message, options) {
		return createToast("message", message, options);
	}
	toast.message = (message, options) => createToast("message", message, options);
	toast.success = (message, options) => createToast("success", message, options);
	toast.error = (message, options) => createToast("error", message, options);
	toast.info = (message, options) => createToast("info", message, options);
	toast.warning = (message, options) => createToast("warning", message, options);
	toast.dismiss = (id) => dismissToast(id);
	function ToasterItem({ item, index, total, expanded, paused, offset, height, visibleToasts, duration, closeButton, closeLabel, onHeight }) {
		const ref = react.useRef(null);
		const [mounted, setMounted] = react.useState(false);
		const remaining = react.useRef(item.duration ?? duration ?? TOAST_LIFETIME);
		react.useLayoutEffect(() => {
			const node = ref.current;
			if (!node) return;
			const previous = node.style.height;
			node.style.height = "auto";
			onHeight(item.id, node.getBoundingClientRect().height);
			node.style.height = previous;
		}, [
			item.id,
			item.title,
			item.description,
			onHeight
		]);
		react.useEffect(() => () => onHeight(item.id, void 0), [item.id, onHeight]);
		react.useEffect(() => {
			const frame = requestAnimationFrame(() => setMounted(true));
			return () => cancelAnimationFrame(frame);
		}, []);
		react.useEffect(() => {
			if (item.removed || paused || !Number.isFinite(remaining.current)) return;
			const started = Date.now();
			const timer = setTimeout(() => dismissToast(item.id), Math.max(0, remaining.current));
			return () => {
				clearTimeout(timer);
				remaining.current -= Date.now() - started;
			};
		}, [
			item.id,
			item.removed,
			paused
		]);
		return /* @__PURE__ */ react.createElement("li", {
			ref,
			tabIndex: 0,
			"data-type": item.type,
			"data-mounted": mounted,
			"data-removed": item.removed,
			"data-visible": index + 1 <= visibleToasts,
			"data-front": index === 0,
			"data-expanded": expanded,
			className: "ab-toast ab-toast--stacked",
			style: {
				"--index": index,
				"--toasts-before": index,
				"--z-index": total - index,
				"--offset": `${offset}px`,
				"--initial-height": `${height}px`
			}
		}, /* @__PURE__ */ react.createElement(ToastParts, {
			type: item.type,
			title: item.title,
			description: item.description,
			action: item.action,
			closeButton: item.closeButton ?? closeButton,
			closeLabel,
			onDismiss: () => dismissToast(item.id)
		}));
	}
	function Toaster({ expand = false, visibleToasts = VISIBLE_TOASTS, duration, closeButton = false, closeLabel = "Cerrar", label = "Notificaciones", contained = false, className, style }) {
		const items = react.useSyncExternalStore(subscribeToasts, readToasts, readToasts);
		const [hovered, setHovered] = react.useState(false);
		const [heights, setHeights] = react.useState({});
		const [seenItems, setSeenItems] = react.useState(items);
		const onHeight = react.useCallback((id, height) => {
			setHeights((current) => {
				if (current[id] === height) return current;
				const next = { ...current };
				if (height === void 0) delete next[id];
				else next[id] = height;
				return next;
			});
		}, []);
		if (seenItems !== items) {
			setSeenItems(items);
			if (items.length <= 1 && hovered) setHovered(false);
		}
		const ordered = items.slice().reverse();
		const expanded = expand || hovered;
		let accumulated = 0;
		let before = 0;
		const offsets = ordered.map((item) => {
			if (item.removed) return accumulated + before * TOAST_GAP;
			const value = accumulated + before * TOAST_GAP;
			accumulated += heights[item.id] ?? 0;
			before += 1;
			return value;
		});
		const front = ordered.find((item) => !item.removed) ?? ordered[0];
		return /* @__PURE__ */ react.createElement("section", {
			"aria-label": label,
			tabIndex: -1,
			"aria-live": "polite",
			"aria-relevant": "additions text",
			"aria-atomic": "false"
		}, ordered.length > 0 ? /* @__PURE__ */ react.createElement("ol", {
			tabIndex: -1,
			className: cx("ab-toaster", contained && "ab-toaster--contained", className),
			style: {
				"--front-toast-height": `${front && heights[front.id] || 0}px`,
				...style
			},
			onMouseEnter: () => setHovered(true),
			onMouseMove: () => setHovered(true),
			onMouseLeave: () => setHovered(false),
			onKeyDown: (event) => {
				if (event.key === "Escape") setHovered(false);
			}
		}, ordered.map((item, index) => /* @__PURE__ */ react.createElement(ToasterItem, {
			key: item.id,
			item,
			index,
			total: ordered.length,
			expanded,
			paused: hovered,
			offset: offsets[index],
			height: heights[item.id] ?? 0,
			visibleToasts,
			duration,
			closeButton,
			closeLabel,
			onHeight
		}))) : null);
	}
	const BANNER_TONES = [
		"warning",
		"info",
		"danger"
	];
	const BANNER_ICONS = {
		warning: {
			parts: [
				"M12 3.5 21 19H3L12 3.5Z",
				"M12 10v3.5",
				"M12 16.4v.2"
			],
			linejoin: "miter"
		},
		info: {
			parts: [
				{ circle: [
					12,
					12,
					8.5
				] },
				"M12 11v5",
				"M12 7.9v.2"
			],
			linejoin: "round"
		},
		danger: {
			parts: [
				{ circle: [
					12,
					12,
					8.5
				] },
				"M12 7.5v5",
				"M12 16v.2"
			],
			linejoin: "round"
		}
	};
	function Banner({ tone = "warning", title, children, action, className, style }) {
		const variant = BANNER_TONES.includes(tone) ? tone : "warning";
		const icon = BANNER_ICONS[variant];
		const button = react.isValidElement(action) ? action : normalizeAction(action);
		return /* @__PURE__ */ react.createElement("div", {
			role: "status",
			className: cx("ab-banner", `ab-banner--${variant}`, title && "ab-banner--titled", className),
			style
		}, /* @__PURE__ */ react.createElement("span", {
			className: "ab-banner__icon",
			"aria-hidden": "true"
		}, /* @__PURE__ */ react.createElement(StrokeIcon, {
			parts: icon.parts,
			size: 18,
			linejoin: icon.linejoin
		})), /* @__PURE__ */ react.createElement("div", { className: "ab-banner__body" }, title ? /* @__PURE__ */ react.createElement("p", { className: "ab-banner__title" }, title) : null, hasContent(children) ? /* @__PURE__ */ react.createElement("div", { className: "ab-banner__text" }, children) : null), button ? /* @__PURE__ */ react.createElement("div", { className: "ab-banner__action" }, react.isValidElement(button) ? button : /* @__PURE__ */ react.createElement(Button, {
			variant: "outline",
			size: "sm",
			onClick: button.onClick
		}, button.label)) : null);
	}

//#endregion
exports.AppShell = AppShell;
exports.AuthLayout = AuthLayout;
exports.Avatar = Avatar;
exports.Badge = Badge;
exports.Banner = Banner;
exports.Breadcrumbs = Breadcrumbs;
exports.Button = Button;
exports.Checkbox = Checkbox;
exports.CheckboxField = CheckboxField;
exports.ConfirmDialog = ConfirmDialog;
exports.DataTable = DataTable;
exports.Dialog = Dialog;
exports.DropdownMenu = DropdownMenu;
exports.EmptyState = EmptyState;
exports.FilterBar = FilterBar;
exports.FilterChip = FilterChip;
exports.FilterSelect = FilterSelect;
exports.FormError = FormError;
exports.FormField = FormField;
exports.Icon = Icon;
exports.IconButton = IconButton;
exports.Input = Input;
exports.Label = Label;
exports.MenuCheckboxItem = MenuCheckboxItem;
exports.MenuItem = MenuItem;
exports.MenuLabel = MenuLabel;
exports.MenuRadioItem = MenuRadioItem;
exports.MenuSeparator = MenuSeparator;
exports.MoreFilters = MoreFilters;
exports.MultiSelect = MultiSelect;
exports.Page = Page;
exports.Pagination = Pagination;
exports.RowActions = RowActions;
exports.SearchInput = SearchInput;
exports.SegmentedControl = SegmentedControl;
exports.Select = Select;
exports.Sidebar = Sidebar;
exports.Skeleton = Skeleton;
exports.Spinner = Spinner;
exports.StatusDot = StatusDot;
exports.Surface = Surface;
exports.Switch = Switch;
exports.Table = Table;
exports.TableBody = TableBody;
exports.TableCell = TableCell;
exports.TableHead = TableHead;
exports.TableHeader = TableHeader;
exports.TableRow = TableRow;
exports.Textarea = Textarea;
exports.Toast = Toast;
exports.Toaster = Toaster;
exports.Tooltip = Tooltip;
exports.Topbar = Topbar;
exports.UserMenu = UserMenu;
exports.iconNames = iconNames;
exports.toast = toast;
return exports;
})({}, React, ReactDOM);
window.AB = Object.assign(window.AB || {}, __ab);
})();
