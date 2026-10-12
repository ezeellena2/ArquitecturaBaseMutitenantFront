import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AssistantRetryButton } from "./AssistantRetryButton";

afterEach(() => vi.useRealTimers());

it("respeta RetryAfter y sólo reenvía cuando la persona pulsa Reintentar", async () => {
  vi.useFakeTimers();
  const onRetry = vi.fn();
  await act(async () => { renderWithProviders(<AssistantRetryButton retryAfter={60} pending={false} onRetry={onRetry} />); await vi.advanceTimersByTimeAsync(0); });
  expect(screen.getByRole("button").textContent).toMatch(/1 min/u);
  expect(screen.getByRole("button")).toBeDisabled();
  fireEvent.click(screen.getByRole("button"));
  expect(onRetry).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(60_000); fireEvent.focus(window); });
  expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  expect(onRetry).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
