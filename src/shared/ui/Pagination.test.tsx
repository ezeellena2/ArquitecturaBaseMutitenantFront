import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { Pagination } from "./Pagination";

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({
    formatInteger: (value: number) => value === 1234 ? "1.234" : String(value),
  }),
}));

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

function renderPagination(overrides: Partial<Parameters<typeof Pagination>[0]> = {}) {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(<Pagination
    page={1}
    pageSize={10}
    totalCount={1234}
    totalPages={124}
    hasPrevious={false}
    hasNext
    onPageChange={onPageChange}
    onPageSizeChange={onPageSizeChange}
    {...overrides}
  />);
  return { onPageChange, onPageSizeChange };
}

describe("Pagination", () => {
  it("muestra 1–10 de 1.234 y Página 1 de 124 con el formato compartido", async () => {
    await changeCulture("es-AR");
    const { onPageChange } = renderPagination();

    expect(screen.getByRole("navigation", { name: "Paginado" })).toBeInTheDocument();
    expect(screen.getByText("1–10 de 1.234")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 124")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("ofrece 10, 20, 50 y 100 por página y avisa el tamaño elegido", async () => {
    await changeCulture("es-AR");
    const { onPageSizeChange } = renderPagination();

    screen.getByRole("combobox", { name: "Filas por página" }).focus();
    await userEvent.keyboard("{Enter}");
    for (const size of [10, 20, 50, 100]) {
      expect(screen.getByRole("option", { name: `${size} por página` })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole("option", { name: "50 por página" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("deshabilita los extremos y muestra cero resultados", async () => {
    await changeCulture("es-AR");
    renderPagination({ totalCount: 0, totalPages: 0, hasNext: false });

    expect(screen.getByText("0–0 de 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
  });

  it("usa el texto traducido en inglés", async () => {
    await changeCulture("en-US");
    renderPagination({ totalCount: 25, totalPages: 3 });

    expect(screen.getByText("1–10 of 25")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeInTheDocument();
    await changeCulture("es-AR");
  });
});
