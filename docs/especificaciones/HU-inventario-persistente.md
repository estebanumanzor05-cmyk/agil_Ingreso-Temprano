# Especificación · HU Inventario persistente y sincronizado

Formato de la sesión 24 (Agilismo con IA I): contexto, historia, criterios
verificables, fuera de alcance, qué no se toca, nivel de delegación y cómo
se verifica.

## 1. Contexto

- Sistema: página web en HTML/CSS/JavaScript (`index.html`, `javascript/`)
  servida por Flask (`app.py`) en Render (ADR 04).
- Hoy la base es un archivo SQLite (`inventario.db`) dentro del servidor de
  Render. El plan gratuito borra ese disco cada vez que el servicio se
  reinicia o se duerme, y al volver se recrea desde `mock_data_sprint1.sql`,
  que trae 49 tallas con existencias. Por eso:
  - al abrir el enlace ya aparece calzado registrado;
  - lo que se registra se pierde cuando Render reinicia el servicio.
- Hoy cada guardado manda el inventario completo y el servidor borra todo y
  lo vuelve a escribir. Si dos personas guardan casi a la vez, la última
  borra lo de la otra.
- `datos.js` sigue siendo la fuente del **catálogo de nombres**
  (`CATALOGO_MODELOS`, arreglo de Guzmán): no se puede vaciar.

## 2. Historia de usuario

> Como empleado de ADOC, quiero que el inventario quede guardado aunque se
> recargue la página o se vuelva a entrar al enlace, y que sea el mismo en
> todos los dispositivos, para que lo registrado un día siga ahí al día
> siguiente y cualquier compañero vea los mismos datos.

## 3. Criterios de aceptación

Todos se pueden comprobar con una acción y un resultado esperado.

1. **Arranca vacío.** Con una base nueva, al abrir el enlace no hay calzado
   registrado: Administrador no muestra modelos y escanear un zapato en
   Zapatería indica que no tiene existencias.
2. **Se guarda al recargar.** Si se registran 2 pares en Bodega y se recarga
   la página, siguen apareciendo los 2 pares.
3. **Sobrevive al reinicio del servidor.** Si Render reinicia o redespliega
   el servicio, el inventario registrado sigue igual.
4. **Se comparte entre dispositivos.** Lo que un dispositivo registra
   aparece en otro al abrir cualquier módulo o al escanear.
5. **No se pisan los cambios.** Si dos dispositivos registran pares de la
   misma talla, el total es la suma de ambos, no solo el último guardado.
6. **La venta no baja de cero.** Si dos dispositivos venden el último par
   de una talla, la cantidad queda en 0, nunca negativa.
7. **Los nombres se conservan.** Con el inventario vacío, registrar en
   Bodega un modelo del catálogo guarda su nombre y marca reales, no
   «Producto nuevo» ni «Sin definir».

## 4. Fuera de alcance

- Usuarios, contraseñas o permisos por rol.
- Historial de movimientos (quién vendió o registró qué y cuándo).
- Actualización en tiempo real sin acción del usuario (la página se
  actualiza al abrir un módulo, al escanear, al vender, al guardar y al
  volver a la pestaña).
- Cambiar el diseño de las pantallas.

## 5. Qué no se toca

- `javascript/escaner.js`: la cámara y la lectura de códigos.
- **Registrar venta (−1 par)** de Rodrigo en `script.js`: `registrarVenta`,
  `actualizarBotonVenta` y la selección de talla.
- **Catálogo de nombres** de Guzmán en `datos.js`: `CATALOGO_MODELOS`,
  `nombreDeCodigo` y `registrarEntrada`. Si se tocan, vuelve el error de
  «nombre sin definir».
- El formato del código `SKU-talla` y las 49 etiquetas impresas.
- Las operaciones del Administrador (`adminAgregarProducto`,
  `adminCambiarCantidad`, etc.): solo cambia cómo se envían al servidor.
- Los mensajes de «Código no válido» y «sin pasillo».

## 6. Nivel de delegación

**C para la decisión, B para el código.** Cambiar dónde viven los datos es
una decisión de arquitectura y del modelo de datos: la toma el equipo y
queda en el ADR 06. Las consultas a la base se revisan línea por línea en
el pull request.

## 7. Cómo se verifica antes de integrar

- Pruebas automáticas en `tests/test_api.py` (corren en el CI): base nueva
  vacía, guardado que sobrevive a un reinicio, cambios de dos dispositivos
  que se suman, venta que no baja de cero, nombres del catálogo.
- Prueba manual con dos celulares sobre el enlace de Render: registrar en
  uno, abrir Zapatería en el otro, recargar ambos.
- Revisión del pull request por otro integrante, que pueda explicar el
  cambio sin abrir el asistente.
