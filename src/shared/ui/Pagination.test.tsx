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
    const previous = screen.getByRole("button", { name: "Página anterior" });
    expect(previous).toBeDisabled();
    expect(previous).toHaveClass("size-8");
    // Tableros Empresas y Empresa (.pag): las cifras con su ancho de siempre, y las flechas en el gris claro de los íconos
    // (.ico-btn, --t3), al 40 % cuando no se pueden tocar.
    expect(screen.getByText("Página 1 de 124")).not.toHaveClass("tabular-nums");
    expect(screen.getByText("1–10 de 1.234")).not.toHaveClass("tabular-nums");
    expect(previous).toHaveClass("text-[var(--t3)]", "disabled:opacity-40");
    // Tableros Empresas y Usuarios: el pie en letra de 12, y el tamaño de página en una píldora de 28 con letra de 12,
    // también en la compu grande.
    expect(screen.getByRole("navigation", { name: "Paginado" })).toHaveClass("text-[12px]");
    expect(screen.getByRole("combobox", { name: "Filas por página" })).toHaveClass("h-7", "text-[12px]");
    expect(screen.getByRole("combobox", { name: "Filas por página" })).not.toHaveClass("lg:h-8", "lg:text-[13px]");

    // Las flechas del tablero (.pag), con trazo 2; y la del tamaño de página, la chica de los desplegables.
    expect(previous.querySelector("svg")).toHaveAttribute("stroke-width", "2");
    expect(previous.querySelector("path")).toHaveAttribute("d", "M14.5 5.5 8 12l6.5 6.5");
    expect(screen.getByRole("combobox", { name: "Filas por página" }).querySelector("path")).toHaveAttribute("d", "m7 10 5 5 5-5");

    await userEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole("button", { name: "Página siguiente" })).not.toHaveClass("min-h-11");
  });

  // Tablero Roles («Ningún rol coincide con los filtros»): sin filas, «0 de 0» y «Página 1 de 1», nunca «de 0».
  it("sin filas dice «Página 1 de 1»", async () => {
    await changeCulture("es-AR");
    renderPagination({ totalCount: 0, totalPages: 0, hasNext: false });

    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.queryByText("Página 1 de 0")).not.toBeInTheDocument();
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

    expect(screen.getByText("0 de 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página siguiente" })).toBeDisabled();
  });

  // Tablero Empresa, pestaña Roles: con una sola fila en la página, «1 de 1» y no «1–1 de 1».
  it("con una sola fila en la página dice «1 de 1»", async () => {
    await changeCulture("es-AR");
    renderPagination({ totalCount: 1, totalPages: 1, hasNext: false });

    expect(screen.getByText("1 de 1")).toBeInTheDocument();
    expect(screen.queryByText("1–1 de 1")).not.toBeInTheDocument();
  });

  it("usa el texto traducido en inglés", async () => {
    await changeCulture("en-US");
    renderPagination({ totalCount: 25, totalPages: 3 });

    expect(screen.getByText("1–10 of 25")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Rows per page" })).toBeInTheDocument();
    await changeCulture("es-AR");
  });

  it("en inglés, con una sola fila en la página dice «11 of 11»", async () => {
    await changeCulture("en-US");
    renderPagination({ page: 2, totalCount: 11, totalPages: 2, hasPrevious: true, hasNext: false });

    expect(screen.getByText("11 of 11")).toBeInTheDocument();
    await changeCulture("es-AR");
  });
});
