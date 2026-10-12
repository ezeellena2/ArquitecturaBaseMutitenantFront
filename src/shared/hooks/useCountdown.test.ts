import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./useCountdown";

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("useCountdown", () => {
  it("cambiar la fecha de la compu no habilita el reenvío antes de tiempo", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    const { result } = renderHook(() => useCountdown(60));
    vi.spyOn(Date, "now").mockReturnValue(0);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(59);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(result.current.isRunning).toBe(true);
  });
  it("vence por el tiempo transcurrido aunque el callback llegue después de una suspensión", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    const { result } = renderHook(() => useCountdown(60));
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + 61_000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it.each(["focus", "visibilitychange"])("recalcula al retomar la pestaña con %s", (event) => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    const { result } = renderHook(() => useCountdown(300));
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + 301_000);
    act(() => (event === "focus" ? window : document).dispatchEvent(new Event(event)));
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it("restart fija un vencimiento nuevo y cambiar initialSeconds no lo reinicia", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    const { result, rerender } = renderHook(({ initial }) => useCountdown(initial), { initialProps: { initial: 60 } });
    act(() => result.current.restart(10));
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + 4000);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(result.current.seconds).toBe(6);
    rerender({ initial: 200 });
    expect(result.current.seconds).toBe(6);
    act(() => result.current.restart(0));
    expect(result.current.isRunning).toBe(false);
  });
});
