ADR 02 · uso-de-github-pages

<!-- Estado posible: Propuesta, Aceptada, Reemplazada por ADR 00 -->
- Estado: Reemplazado · 20 de octubre de 2026

- Contexto
<!-- Qué situación obligó a decidir. Describe las restricciones reales del momento: 
tiempo disponible, conocimiento del equipo, tecnología que ya existía. 
Solo hechos, sin juicios. -->
Github Pages es un alojamiento que los integrantes del equipo controlaban a la perfección, por ende, 
era más práctico el uso de ella. Sin embargo, para la web responsiva es necesario disponer de una 
base de datos, de forma que todos los empleados puedan visualizar la misma información; igualmente, 
aunque recarguen la página, la información será guardada. 
<< Github Pages es un alojamiento estático que no puede ejecutar Python ni guardar 
una base de datos SQL adentro de sus propios servidores. >> 

- Decisión
<!-- Qué se decidió, en voz activa y en una o dos frases. -->
Se cambiará la forma del despliegue o se atribuyiran funciones para que sea realizable por medio de
Github Pages.

- Consecuencias
<!-- Usa + para lo que se gana y - para lo que se pierde. Las negativas son obligatorias. -->
+ Datos actualizados al recargar la página y en sincronía.
- Retraso del proyecto en torno a fecha final del sprint 3.
