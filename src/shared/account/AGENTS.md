Lo de la cuenta que usan varias áreas (ADR 0033): el alta y el cambio de un método de ingreso y
el aviso de método propio. Mi cuenta y el Inicio-Personal los usan desde acá, porque las features no se importan
entre sí. Leé [pantallas y UI](../../../docs/rules/pantallas-y-ui.md) y [formularios](../../../docs/rules/formularios.md).
Copiá [AddLoginMethodDialog.tsx](AddLoginMethodDialog.tsx).

Corrección E8 B2 (2026-10-10), posterior a Cuenta-Verificar/M-Cuenta-Verificar: el vencimiento del código
lo decide la API (`Auth.LoginCode.Expired`, en la franja con su texto). El diálogo no promete diez minutos
ni bloquea OTP o Verificar por el reloj local. Sólo cuenta la espera de reenvío recibida en
`resendAfterSeconds` y el `Retry-After`; al terminar la espera, el reenvío sigue siendo manual.
