ADR 06 · Inventario persistente en PostgreSQL de Render

<!-- Estado posible: Propuesta, Aceptada, Reemplazada por ADR 00 -->
- Estado: Propuesta · 30 de octubre de 2026
  (Reemplaza la decisión de usar SQLite en el disco de Render, si se aceptó el ADR 05)

- Contexto
<!-- Qué situación obligó a decidir. Describe las restricciones reales del momento: tiempo disponible, conocimiento del equipo, tecnología que ya existía. Solo hechos, sin juicios. -->
La base era un archivo SQLite dentro del servidor de Render. El plan gratuito borra
ese disco cada vez que el servicio se reinicia o se duerme, y la base se volvía a
crear desde mock_data_sprint1.sql con 49 tallas de prueba. Por eso el inventario
nunca arrancaba vacío y lo registrado se perdía. Además, cada guardado mandaba el
inventario completo y el servidor lo reemplazaba, así que dos dispositivos que
guardaban casi a la vez se borraban los cambios.
La HU «Inventario persistente y sincronizado» pide lo contrario.

- Decisión
<!-- Qué se decidió, en voz activa y en una o dos frases. -->
Guardamos el inventario en una base PostgreSQL de Render, conectada con la variable
DATABASE_URL; sin esa variable (computadora y pruebas) se sigue usando SQLite. La base
arranca vacía, y la página manda solo los cambios (por ejemplo «talla 40: +2») para
que el servidor los sume a lo que ya tiene.

- Consecuencias
<!-- Usa + para lo que se gana y - para lo que se pierde. Las negativas son obligatorias. -->
+ El inventario sobrevive a recargas, reinicios y redespliegues.
+ Todos los dispositivos ven los mismos datos y los registros simultáneos se suman.
+ La venta nunca deja una cantidad negativa, aunque dos personas vendan el último par.
- Hay que crear la base en Render y configurar DATABASE_URL a mano.
- La base gratuita de Render vence 30 días después de crearla (creada el 30/10, dura
  hasta fines de noviembre, después de la Feria del 5/11). Si el proyecto sigue,
  hay que pasarla a un plan pagado o migrarla.
- Una pantalla abierta no se actualiza sola: se actualiza al abrir un módulo, al
  escanear, al vender, al guardar o al volver a la pestaña.
- mock_data_sprint1.sql ya no se carga; queda solo como referencia del modelo.
