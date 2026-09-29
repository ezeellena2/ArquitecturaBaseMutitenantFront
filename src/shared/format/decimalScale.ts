/** Mueve la coma decimal sin introducir un error binario de multiplicación/división. */
export function shiftDecimal(value: number, places: number): number {
  const [mantissa, exponent = "0"] = String(value).split("e");
  return Number(`${mantissa}e${Number(exponent) + places}`);
}
