import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AssistantRetryButton } from "./AssistantRetryButton";

afterEach(() => vi.useRealTimers());

it("respeta RetryAfter y sólo reenvía cuando la persona pulsa Reintentar", async () => {
  const onRetry = vi.fn();
  renderWithProviders(<AssistantRetryButton retryAfter={60} pending={false} onRetry={onRetry} />);
  await waitFor(() => expect(screen.getByRole("button").textContent).toMatch(/1 min/u));
  expect(screen.getByRole("button")).toBeDisabled();
  fireEvent.click(screen.getByRole("button"));
  expect(onRetry).not.toHaveBeenCalled();
  vi.useFakeTimers();
  act(() => { vi.advanceTimersByTime(60_000); fireEvent.focus(window); });
  expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  expect(onRetry).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
