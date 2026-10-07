import assert from "node:assert/strict";
import { test } from "node:test";
import { pickupCode } from "./test-e2e-real-mail.mjs";

function message(body, html = "") {
  return `To: own@example.test\r\nContent-Type: multipart/alternative; boundary=mail\r\n\r\n--mail\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}\r\n--mail\r\nContent-Type: text/html\r\n\r\n${html}\r\n--mail--\r\n`;
}

test("una invitación con seis dígitos en su organización no es un código", () => {
  assert.equal(pickupCode(message("Te invitaron a Invitada A9 ab123456\r\n\r\nEmpresa: Empresa ab123456")), null);
});

test("una invitación con seis dígitos en el token no es un código", () => {
  assert.equal(pickupCode(message("Ver la invitación: https://localhost:5174/invitacion#abc123456xyz")), null);
});

test("toma el párrafo del código y no los números del texto", () => {
  assert.equal(pickupCode(message("Tu código de acceso\r\n\r\nUsá este código para ingresar a App123456:\r\n\r\n001234\r\n\r\nVence en 10 minutos.")), "001234");
});

test("el código debe tener exactamente seis dígitos en su propio párrafo", () => {
  for (const body of ["12345", "1234567", "Referencia: 123456", "123456abc"]) {
    assert.equal(pickupCode(message(body)), null);
  }
});

test("lee el código en español o inglés y con saltos LF", () => {
  assert.equal(pickupCode(message("Your access code\n\n654321\n\nIt expires in 10 minutes.")), "654321");
});

test("no toma seis dígitos del HTML ni de los headers", () => {
  assert.equal(pickupCode(message("Te invitaron a una organización", "<p>123456</p>").replace("To: own", "Subject: 123456\r\nTo: own")), null);
});
