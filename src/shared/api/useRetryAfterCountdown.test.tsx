import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { ApiError } from "./ApiError";
import { useRetryAfterCountdown } from "./useRetryAfterCountdown";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

afterEach(() => vi.useRealTimers());

function Wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe("useRetryAfterCountdown", () => {
  it("traduce retryAfterSeconds a una cuenta regresiva del botón sin reintentar solo", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRetryAfterCountdown(), { wrapper: Wrapper });
    const onRetry = vi.fn();
    act(() => result.current.startFromError(new ApiError(429, { code: "Http.TooManyRequests", retryAfter: 42 })));

    expect(result.current.isRunning).toBe(true);
    expect(result.current.label).toBe("Reintentá en 0:42");
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.label).toBe("Reintentá en 0:41");
    for (let index = 0; index < 41; index++) act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.label).toBeNull();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("ignora errores que no sean 429 con Retry-After", () => {
    const { result } = renderHook(() => useRetryAfterCountdown(), { wrapper: Wrapper });
    act(() => result.current.startFromError(new ApiError(409, { code: "General.ConcurrencyConflict" })));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.label).toBeNull();
  });

  it("deshabilita el botón que originó el 429 hasta que venza el tiempo, sin enviarlo de nuevo", () => {
    vi.useFakeTimers();
    const send = vi.fn();
    function RetryButton() {
      const { isRunning, label, startFromError } = useRetryAfterCountdown();
      return (
        <button
          type="button"
          disabled={isRunning}
          onClick={() => {
            send();
            startFromError(new ApiError(429, { code: "Http.TooManyRequests", retryAfter: 2 }));
          }}
        >
          {label ?? "Enviar"}
        </button>
      );
    }
    render(<I18nextProvider i18n={i18n}><RetryButton /></I18nextProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(send).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Reintentá en 0:02" })).toBeDisabled();

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: "Enviar" })).toBeEnabled();
    expect(send).toHaveBeenCalledOnce();
  });
});
