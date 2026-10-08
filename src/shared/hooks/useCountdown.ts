import { useCallback, useEffect, useState } from "react";

/// Cuenta regresiva en segundos, para el reenvío del código.
export function useCountdown(initialSeconds: number) {
  // `initialSeconds` solo importa al montar: el valor inicial ya lo toma `useState`, y para arrancar una
  // cuenta nueva más tarde (por ejemplo, al reenviar el código) quien use el hook llama a `restart`. Un
  // efecto que reflejara `initialSeconds` en el estado en cada cambio dispararía un render extra de más.
  const [countdown, setCountdown] = useState(() => ({ seconds: initialSeconds, deadline: Date.now() + initialSeconds * 1000 }));
  const { seconds } = countdown;
  const restart = useCallback((duration: number) => {
    setCountdown({ seconds: duration, deadline: Date.now() + duration * 1000 });
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    // Los callbacks pueden atrasarse o pausarse: el vencimiento depende del reloj, no de sus vueltas.
    const refresh = () => {
      const now = Date.now();
      setCountdown((current) => ({ ...current, seconds: Math.max(0, Math.ceil((current.deadline - now) / 1000)) }));
    };
    const timer = setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [seconds]);

  return { seconds, isRunning: seconds > 0, restart };
}
