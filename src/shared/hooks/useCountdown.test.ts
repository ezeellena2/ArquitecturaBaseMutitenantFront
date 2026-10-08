import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

afterEach(() => vi.useRealTimers());

describe("useCountdown", () => {
  it("vence por el tiempo transcurrido aunque el callback llegue después de una suspensión", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown(60));
    act(() => vi.setSystemTime(Date.now() + 61_000));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it.each(["focus", "visibilitychange"])("recalcula al retomar la pestaña con %s", (event) => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown(300));
    act(() => vi.setSystemTime(Date.now() + 301_000));
    act(() => (event === "focus" ? window : document).dispatchEvent(new Event(event)));
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it("restart fija un vencimiento nuevo y cambiar initialSeconds no lo reinicia", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ initial }) => useCountdown(initial), { initialProps: { initial: 60 } });
    act(() => result.current.restart(10));
    act(() => vi.setSystemTime(Date.now() + 4000));
    act(() => window.dispatchEvent(new Event("focus")));
    expect(result.current.seconds).toBe(6);
    rerender({ initial: 200 });
    expect(result.current.seconds).toBe(6);
    act(() => result.current.restart(0));
    expect(result.current.isRunning).toBe(false);
  });
});
