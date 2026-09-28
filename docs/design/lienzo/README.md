# Lienzo del sistema visual

El conjunto aprobado corresponde a la versión 35: 67 tableros `.dc.html`, el motor `support.js` y los recursos de `ds/`. Esta carpeta es la fuente prevista de cada pantalla y de sus estados; **el tablero manda sobre cualquier descripción textual** de la arquitectura, las fichas o el plan.

Para verlo, serví esta carpeta con un servidor estático y abrí `<Tablero>.dc.html` desde ese servidor. Cada estado se selecciona con el control **Tweak**: el estado inicial está en el atributo `data-props` como `default`.

Antes de programar una pantalla, buscá su tablero y copiá sus estados, contenido y disposición. Una pantalla nueva se dibuja primero y se programa después de que el usuario la elige.
