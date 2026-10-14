import type { WhatsAppSignupConfigResponse } from "../../api/types";

/// El alta embebida de Meta (Embedded Signup v4), aislada del resto de la pantalla para poder probarla con un `FB`
/// simulado: la pantalla nunca toca el SDK ni el oyente de `message`.

/** Lo que terminó pasando en la ventana de Meta. */
export type SignupOutcome =
  /** Llegaron el `code` de `FB.login` y los ids del evento: hay que mandarlos ya, el `code` vive 30 s. */
  | { kind: "finished"; code: string; phoneNumberId: string | null; wabaId: string; coexistence: boolean }
  /** La persona cerró o abandonó la ventana (`CANCEL` con `current_step`, o la ventana cerrada sin `code`). */
  | { kind: "cancelled"; step: string | null }
  /** Meta informó un error (`ERROR` con `error_id`, o el error que la persona reportó desde la ventana). */
  | { kind: "error"; errorCode: string | null };

interface FacebookLoginResponse {
  authResponse?: { code?: string | null } | null;
}

interface FacebookLoginOptions {
  config_id: string;
  response_type: "code";
  override_default_response_type: true;
  extras: Readonly<Record<string, unknown>>;
}

/** Lo único que se usa del SDK de Facebook. */
export interface FacebookSdk {
  init(options: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }): void;
  login(callback: (response: FacebookLoginResponse) => void, options: FacebookLoginOptions): void;
}

type FacebookWindow = Window & { FB?: FacebookSdk; fbAsyncInit?: () => void };

// El SDK solo abre la ventana: su idioma lo pone la cuenta de Facebook de quien conecta.
const sdkUrl = "https://connect.facebook.net/en_US/sdk.js";
// Coexistencia (número de la app WhatsApp Business): la ventana de Meta ofrece conectar ese número y, si se elige, termina
// con FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING. Los tableros no piden elegirlo antes de abrirla.
const coexistenceFeature = "whatsapp_business_app_onboarding";

let loading: Promise<FacebookSdk> | null = null;
let initialized: string | null = null;

const facebookWindow = (): FacebookWindow => window;

function initialize(sdk: FacebookSdk, config: WhatsAppSignupConfigResponse): FacebookSdk {
  const key = `${config.appId}|${config.sdkVersion}`;
  if (initialized !== key) {
    sdk.init({ appId: config.appId, autoLogAppEvents: true, xfbml: false, version: config.sdkVersion });
    initialized = key;
  }
  return sdk;
}

/** El SDK ya cargado, para abrir la ventana sin esperar (el navegador la deja abrir solo cerca del toque). */
export function loadedFacebookSdk(config: WhatsAppSignupConfigResponse, target: FacebookWindow = facebookWindow()): FacebookSdk | null {
  return target.FB ? initialize(target.FB, config) : null;
}

/** Carga el SDK una sola vez y solo cuando alguien va a conectar: la pantalla no lo pide al abrirse. */
export function loadFacebookSdk(config: WhatsAppSignupConfigResponse, target: FacebookWindow = facebookWindow()): Promise<FacebookSdk> {
  const loaded = loadedFacebookSdk(config, target);
  if (loaded) return Promise.resolve(loaded);
  loading ??= new Promise<FacebookSdk>((resolve, reject) => {
    const script = target.document.createElement("script");
    target.fbAsyncInit = () => { if (target.FB) resolve(target.FB); else reject(new Error("El SDK de Facebook no se inició.")); };
    script.src = sdkUrl;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("No se pudo cargar el SDK de Facebook."));
    };
    target.document.body.appendChild(script);
  });
  return loading.then((sdk) => initialize(sdk, config));
}

/** Los mensajes del alta llegan del marco de Facebook: cualquier otro origen se ignora. */
function isFacebookOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === "https:" && (hostname === "facebook.com" || hostname.endsWith(".facebook.com"));
  } catch {
    return false;
  }
}

interface SignupMessage {
  type?: unknown;
  event?: unknown;
  data?: Record<string, unknown>;
}

function parseMessage(data: unknown): SignupMessage | null {
  let value: unknown = data;
  if (typeof data === "string") {
    try { value = JSON.parse(data); } catch { return null; }
  }
  return typeof value === "object" && value !== null ? value as SignupMessage : null;
}

const text = (value: unknown): string | null => typeof value === "string" && value.length > 0 ? value
  : typeof value === "number" ? String(value) : null;

export interface SignupSession {
  /** «Cancelar» de «Ventana de Meta abierta»: lo que llegue después se ignora. */
  cancel(): void;
  /** «Volver a la ventana». */
  focus(): void;
}

/**
 * Abre la ventana de Meta con `FB.login` y escucha `WA_EMBEDDED_SIGNUP`. Avisa una sola vez: terminado (con el `code`
 * y los ids), cancelado o con error. Cerrar en la última pantalla no es cancelar: el evento FINISH ya llegó y el `code`
 * llega con la respuesta de `FB.login`.
 */
export function startEmbeddedSignup(sdk: FacebookSdk, config: WhatsAppSignupConfigResponse, onOutcome: (outcome: SignupOutcome) => void,
  target: FacebookWindow = facebookWindow()): SignupSession {
  let settled = false;
  let code: string | null = null;
  let finish: { phoneNumberId: string | null; wabaId: string; coexistence: boolean } | null = null;
  let popup: Window | null = null;

  const settle = (outcome: SignupOutcome) => {
    if (settled) return;
    settled = true;
    target.removeEventListener("message", listen);
    onOutcome(outcome);
  };
  const complete = () => { if (code && finish) settle({ kind: "finished", code, ...finish }); };

  function listen(event: MessageEvent) {
    if (!isFacebookOrigin(event.origin)) return;
    const message = parseMessage(event.data);
    if (!message || message.type !== "WA_EMBEDDED_SIGNUP" || typeof message.event !== "string") return;
    const data = message.data ?? {};
    const wabaId = text(data.waba_id);
    const phoneNumberId = text(data.phone_number_id);
    if (message.event === "FINISH") {
      if (wabaId && phoneNumberId) { finish = { phoneNumberId, wabaId, coexistence: false }; complete(); }
      else settle({ kind: "error", errorCode: null });
    } else if (message.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
      // Meta puede no mandar el id del número en la coexistencia: el back lo resuelve con la cuenta.
      if (wabaId) { finish = { phoneNumberId, wabaId, coexistence: true }; complete(); }
      else settle({ kind: "error", errorCode: null });
    } else if (message.event.startsWith("FINISH")) {
      // Terminó sin un número para atender (solo la cuenta, o solo el acceso): no se conectó nada.
      settle({ kind: "cancelled", step: null });
    } else if (message.event === "CANCEL") {
      const reported = text(data.error_code) ?? text(data.error_id);
      settle(reported || text(data.error_message) ? { kind: "error", errorCode: reported } : { kind: "cancelled", step: text(data.current_step) });
    } else if (message.event === "ERROR") {
      settle({ kind: "error", errorCode: text(data.error_id) ?? text(data.error_code) });
    }
  }

  target.addEventListener("message", listen);
  // `FB.login` abre la ventana en el momento: se toma su referencia para «Volver a la ventana».
  const open = target.open;
  target.open = (...args: Parameters<Window["open"]>) => {
    popup = open.apply(target, args);
    return popup;
  };
  try {
    sdk.login((response) => {
      const received = text(response.authResponse?.code);
      if (received) { code = received; complete(); return; }
      // Sin `code`: la ventana se cerró. Si ya había terminado, Meta no dio con qué conectar.
      settle(finish ? { kind: "error", errorCode: null } : { kind: "cancelled", step: null });
    }, {
      config_id: config.configId,
      response_type: "code",
      override_default_response_type: true,
      extras: { setup: {}, featureType: coexistenceFeature },
    });
  } finally {
    target.open = open;
  }

  return {
    cancel: () => {
      settled = true;
      target.removeEventListener("message", listen);
    },
    focus: () => { popup?.focus(); },
  };
}
