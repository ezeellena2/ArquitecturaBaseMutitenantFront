import assert from "node:assert/strict";

/** Completa el código cuando sus seis controles accesibles están listos. */
export async function fillOtp(page, code) {
  const boxes = page.getByRole("group", { name: "Código" }).locator("input");
  await boxes.nth(5).waitFor({ state: "visible" });
  assert.equal(await boxes.count(), 6);
  for (let index = 0; index < 6; index++) await boxes.nth(index).fill(code[index]);
}
