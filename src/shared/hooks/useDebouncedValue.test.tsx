import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

afterEach(() => vi.useRealTimers());

describe("useDebouncedValue", () => {
  it("aplica el valor de búsqueda tras 300 ms y cancela valores intermedios", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value), {
      initialProps: { value: "" },
    });

    rerender({ value: "a" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: "ana" });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ana");
  });

  it("limpia el temporizador al desmontar", () => {
    vi.useFakeTimers();
    const { rerender, unmount } = renderHook(({ value }: { value: string }) => useDebouncedValue(value), {
      initialProps: { value: "" },
    });

    rerender({ value: "ana" });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
