Inicio del acceso empresarial, dentro de BusinessLayout (ADR 0040; tableros Inicio-Org, Inicio-Miembro, M-Inicio-Org y M-Inicio-Miembro del lienzo vigente).
Leé `docs/features/inicio.md` del back, `docs/architecture/frontend.md` §3 y `docs/rules/accesos-y-permisos.md`.
La API decide qué ve cada persona: el front no deduce permisos; muestra las tarjetas y las filas que vienen.
En el teléfono va la pantalla de app (`components/PhoneHome.tsx`), no la de la compu achicada.
El contenido no obtiene ni muestra datos de otra organización.
