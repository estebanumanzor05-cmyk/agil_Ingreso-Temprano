ADR 04 · Despliegue unificado en Render (Flask sirve frontend y API)

<!-- Estado posible: Propuesta, Aceptada, Reemplazada por ADR 00 -->
- Estado: Aceptada · 21 de octubre de 2026

- Contexto
<!-- Qué situación obligó a decidir. Describe las restricciones reales del momento: tiempo disponible, conocimiento del equipo, tecnología que ya existía. Solo hechos, sin juicios. -->
El sistema necesitaba datos que se compartieran entre usuarios. Github Pages no 
funciona para este proyecto por ser un alojamiento estático. Por ello, se requería un servidor 
externo.

- Decisión
<!-- Qué se decidió, en voz activa y en una o dos frases. -->
Desplegar toda la web en Render como un único servicio: un servidor Python que expone la API.
Render se conecta al repositorio de Github y se redespliega con cada push. Por el tiempo, sin CORS, 
sino un solo servicio.

- Consecuencias
<!-- Usa + para lo que se gana y - para lo que se pierde. Las negativas son obligatorias. -->
+ Frontend y API comparten dominio, por lo que no se necesita configurar CORS.
+ Un solo despligue y un solo lugar donde revisar logs y configuración.
- Se debe actualizar el enlace de entrega
- Frontend y Backend se despliegan como una sola unidad, un cambio en la interfaz obliga a
redesplegar todo.
