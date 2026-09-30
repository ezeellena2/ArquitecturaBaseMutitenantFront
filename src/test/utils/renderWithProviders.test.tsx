import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { queryClient as appQueryClient } from "@/shared/api/queryClient";
import { renderWithProviders } from "./renderWithProviders";

describe("renderWithProviders", () => {
  beforeEach(() => {
    appQueryClient.clear();
    localStorage.clear();
  });

  it("aísla también la consulta de arranque en un cliente nuevo por render", async () => {
    const clients: QueryClient[] = [];
    function Probe() {
      const client = useQueryClient();
      useEffect(() => { clients.push(client); }, [client]);
      return null;
    }

    const first = renderWithProviders(<Probe />);
    await waitFor(() => expect(clients[0]?.getQueriesData({ queryKey: ["reference-data"] })
      .some(([, data]) => data !== undefined)).toBe(true));
    first.unmount();

    const second = renderWithProviders(<Probe />);
    await waitFor(() => expect(clients[1]?.getQueriesData({ queryKey: ["reference-data"] })
      .some(([, data]) => data !== undefined)).toBe(true));
    expect(clients[1]).not.toBe(clients[0]);
    second.unmount();
  });
});
