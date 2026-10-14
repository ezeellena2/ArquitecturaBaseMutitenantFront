import { useEffect, useRef, useState } from "react";
import type { WhatsAppSignupConfigResponse } from "../../api/types";
import { loadedFacebookSdk, loadFacebookSdk, startEmbeddedSignup, type FacebookSdk, type SignupOutcome, type SignupSession } from "./embeddedSignup";

/// La ventana de Meta para la pantalla: si está abierta («Ventana de Meta abierta»), abrirla, volver a ella y
/// cancelar. Al cancelar o salir de la pantalla, lo que llegue de Meta se ignora.
export function useEmbeddedSignup() {
  const session = useRef<SignupSession | null>(null);
  const attempt = useRef(0);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => () => { attempt.current += 1; session.current?.cancel(); session.current = null; }, []);

  function open(current: number, sdk: FacebookSdk, config: WhatsAppSignupConfigResponse, onOutcome: (outcome: SignupOutcome) => void) {
    if (attempt.current !== current) return;
    session.current = startEmbeddedSignup(sdk, config, (outcome) => {
      if (attempt.current !== current) return;
      session.current = null;
      setWaiting(false);
      onOutcome(outcome);
    });
  }

  function cancel() {
    attempt.current += 1;
    session.current?.cancel();
    session.current = null;
    setWaiting(false);
  }

  return {
    waiting,
    /** Empieza a cargar el SDK al tocar «Conectar número», para que «Seguir en Meta» abra la ventana enseguida. */
    prepare: (config: WhatsAppSignupConfigResponse) => { void loadFacebookSdk(config).catch(() => undefined); },
    start: (config: WhatsAppSignupConfigResponse, onOutcome: (outcome: SignupOutcome) => void) => {
      cancel();
      const current = attempt.current;
      setWaiting(true);
      const loaded = loadedFacebookSdk(config);
      if (loaded) { open(current, loaded, config, onOutcome); return; }
      loadFacebookSdk(config).then((sdk) => open(current, sdk, config, onOutcome), () => {
        if (attempt.current !== current) return;
        setWaiting(false);
        onOutcome({ kind: "error", errorCode: null });
      });
    },
    cancel,
    focus: () => session.current?.focus(),
  };
}
