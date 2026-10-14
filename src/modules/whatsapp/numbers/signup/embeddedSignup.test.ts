import { afterEach, describe, expect, it, vi } from "vitest";
import { loadFacebookSdk, startEmbeddedSignup, type FacebookSdk, type SignupOutcome } from "./embeddedSignup";

const config = { appId: "1105469744", configId: "cfg-42", sdkVersion: "v26.0" };
type Login = Parameters<FacebookSdk["login"]>;

function fakeSdk() {
  const calls: Login[] = [];
  const sdk: FacebookSdk = { init: vi.fn(), login: (callback, options) => { calls.push([callback, options]); } };
  return { sdk, calls, respond: (code: string | null) => calls[0][0]({ authResponse: code ? { code } : null }) };
}

const post = (data: object, origin = "https://www.facebook.com") =>
  window.dispatchEvent(new MessageEvent("message", { origin, data: JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", ...data }) }));

function start() {
  const fake = fakeSdk();
  const outcomes: SignupOutcome[] = [];
  const session = startEmbeddedSignup(fake.sdk, config, (outcome) => outcomes.push(outcome));
  return { ...fake, outcomes, session };
}

afterEach(() => { Reflect.deleteProperty(window, "FB"); document.querySelectorAll("script").forEach((script) => script.remove()); });

describe("alta embebida de Meta", () => {
  it("abre FB.login con la configuración de la API y la opción de la app WhatsApp Business", () => {
    const { calls } = start();
    expect(calls[0][1]).toEqual({ config_id: "cfg-42", response_type: "code", override_default_response_type: true,
      extras: { setup: {}, featureType: "whatsapp_business_app_onboarding" } });
  });

  it("FINISH y el code: termina con los ids, una sola vez", () => {
    const { outcomes, respond } = start();
    post({ event: "FINISH", data: { phone_number_id: "106540352242922", waba_id: "524126980791429" } });
    expect(outcomes).toEqual([]);
    respond("AQBx-code");
    respond("otro");
    expect(outcomes).toEqual([{ kind: "finished", code: "AQBx-code", phoneNumberId: "106540352242922", wabaId: "524126980791429", coexistence: false }]);
  });

  it("la coexistencia termina sin el id del número y lo marca", () => {
    const { outcomes, respond } = start();
    respond("code-app");
    post({ event: "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING", data: { waba_id: "777" } });
    expect(outcomes).toEqual([{ kind: "finished", code: "code-app", phoneNumberId: null, wabaId: "777", coexistence: true }]);
  });

  it("ignora mensajes que no vienen de Facebook", () => {
    const { outcomes } = start();
    post({ event: "CANCEL", data: { current_step: "PHONE_NUMBER" } }, "https://facebook.com.ejemplo.com");
    post({ event: "CANCEL", data: { current_step: "PHONE_NUMBER" } }, "http://www.facebook.com");
    expect(outcomes).toEqual([]);
  });

  it("CANCEL con el paso es cancelar; cerrar la ventana sin code, también", () => {
    const first = start();
    post({ event: "CANCEL", data: { current_step: "PHONE_NUMBER_SETUP" } });
    expect(first.outcomes).toEqual([{ kind: "cancelled", step: "PHONE_NUMBER_SETUP" }]);
    first.respond(null);
    expect(first.outcomes).toHaveLength(1);

    const second = start();
    second.respond(null);
    expect(second.outcomes).toEqual([{ kind: "cancelled", step: null }]);
  });

  it("ERROR con error_id, o el error que reportó la persona, es un error de Meta", () => {
    const first = start();
    post({ event: "ERROR", data: { error_message: "Algo falló", error_id: "524126" } });
    expect(first.outcomes).toEqual([{ kind: "error", errorCode: "524126" }]);

    const second = start();
    post({ event: "CANCEL", data: { error_message: "No pude", error_code: 100, session_id: "s" } });
    expect(second.outcomes).toEqual([{ kind: "error", errorCode: "100" }]);
  });

  it("después de cancelar no avisa nada", () => {
    const { outcomes, session, respond } = start();
    session.cancel();
    post({ event: "FINISH", data: { phone_number_id: "1", waba_id: "2" } });
    respond("code");
    expect(outcomes).toEqual([]);
  });

  it("el SDK se pide recién al conectar, una sola vez, y se inicia con la versión de la API", async () => {
    expect(document.querySelectorAll("script[src*='connect.facebook.net']")).toHaveLength(0);
    const loading = loadFacebookSdk(config);
    void loadFacebookSdk(config);
    const scripts = document.querySelectorAll<HTMLScriptElement>("script[src*='connect.facebook.net']");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe("https://connect.facebook.net/en_US/sdk.js");
    const { sdk } = fakeSdk();
    Object.assign(window, { FB: sdk });
    (window as Window & { fbAsyncInit?: () => void }).fbAsyncInit?.();
    await expect(loading).resolves.toBe(sdk);
    expect(sdk.init).toHaveBeenCalledWith({ appId: "1105469744", autoLogAppEvents: true, xfbml: false, version: "v26.0" });
  });
});
