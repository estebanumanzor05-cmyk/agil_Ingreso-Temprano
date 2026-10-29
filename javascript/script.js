/*REFERENCIAS DE LISTAS Y VARIABLES*/
const vistaMenu = document.getElementById('vista-menu');
const vistaEscaner = document.getElementById('vista-escaner');
const vistaResultados = document.getElementById('vista-resultados');
const vistaEscanerBodega = document.getElementById('vista-escaner-bodega');
const toast = document.getElementById('notificacion-toast');
const tarjetaProducto = document.getElementById('tarjeta-producto');
const textoEscaner = document.getElementById('texto-escaner');
const textoBodega = document.getElementById('texto-bodega');
const pasilloActual = document.getElementById('pasillo-actual');
const listaBodega = document.getElementById('lista-bodega');
// Talla seleccionada para registrar la venta
let ventaActual = { sku: null, talla: null };
let ventaEnCurso = false;

// Un lector de cámara para cada módulo (ver escaner.js)
const escanerZapateria = new EscanerCodigos(document.getElementById('reader'));
const escanerBodega = new EscanerCodigos(document.getElementById('reader-bodega'));
// Evita que una misma lectura se procese varias veces mientras la cámara se apaga
let lecturaEnProceso = false;

/*CAMBIOS DE PANTALLAS*/
function mostrarVista(vistaVisible) {
    vistaMenu.classList.add('hidden');
    vistaEscaner.classList.add('hidden');
    vistaResultados.classList.add('hidden');
    vistaEscanerBodega.classList.add('hidden');
    document.getElementById('vista-admin').classList.add('hidden');

    vistaVisible.classList.remove('hidden');
    document.body.classList.toggle('modo-bodega', vistaVisible === vistaEscanerBodega);
}

let temporizadorToast = null;
function mostrarToast(mensaje, duracion = 1500) {
    clearTimeout(temporizadorToast);
    toast.querySelector('span').innerText = mensaje;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('show'), 10);

    temporizadorToast = setTimeout(() => {
        toast.classList.remove('show');
        temporizadorToast = setTimeout(() => toast.classList.add('hidden'), 300);
    }, duracion);
}

function vibrar() {
    if (navigator.vibrate) navigator.vibrate(100); // aviso táctil en el celular
}

// Crea un elemento con clase y texto. Se usa textContent para no
// interpretar como HTML lo que venga del código de barra.
function crear(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

// Equivale a: SELECT ... FROM productos JOIN tallas_inventario WHERE sku = ?
function buscarProducto(codigo) {
    // Solo consulta: si no existe devuelve null y NO crea nada
    if (!existeCodigo(codigo)) return null;
    return PRODUCTOS[parsearCodigo(codigo).sku];
}

// Rangos de color de la pantalla: 0 rojo, 1-2 naranja, 3-4 amarillo, 5+ verde
function claseStock(cantidad) {
    if (cantidad <= 0) return 'stock-0';
    if (cantidad <= 2) return 'stock-1-2';
    if (cantidad <= 4) return 'stock-3-4';
    return 'stock-5';
}

function textoPares(cantidad) {
    return cantidad === 1 ? '1 par' : cantidad + ' pares';
}

function mostrarProducto(codigo, producto) {
    tarjetaProducto.replaceChildren();

    // 1. El código puede ser de variante (SKU-talla): la tarjeta muestra el modelo
    const sku = parsearCodigo(codigo).sku;
    const ubicacion = pasilloDeModelo(sku);

    tarjetaProducto.append(
        crear('h2', 'product-title', producto.nombre),
        crear('p', 'product-brand', producto.marca),
        crear('p', 'product-sku', 'SKU: ' + sku)
    );

    // 3. HISTORIA DE USUARIO SPRINT 2: Mostrar ubicación en bodega
    const badgeUbicacion = crear('div', 'location-badge');
    badgeUbicacion.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span></span>
    `;
    const textoUbicacion = badgeUbicacion.querySelector('span');
    if (ubicacion === 'Sin asignar') {
        // El producto existe en el inventario, pero nadie lo ha registrado en un pasillo
        badgeUbicacion.classList.add('sin-pasillo');
        textoUbicacion.textContent = 'Este producto no ha sido registrado en ningún pasillo';
    } else {
        textoUbicacion.append('Ubicación: ', crear('strong', null, 'Pasillo ' + ubicacion));
    }
    tarjetaProducto.append(badgeUbicacion);

    // 4. Grid de disponibilidad: solo tallas con existencias
    const datosCodigo = parsearCodigo(codigo);
    ventaActual = { sku, talla: datosCodigo.talla };

    tarjetaProducto.append(crear('h3', 'stock-title', 'Disponibilidad en Bodega'));

    const tallasConStock = producto.tallas
        .filter((t) => t.cantidad > 0)
        .sort((a, b) => a.talla - b.talla);

    if (tallasConStock.length === 0) {
        tarjetaProducto.append(crear('p', 'admin-vacio', 'Sin existencias registradas de este modelo.'));
    }

    const grid = crear('div', 'stock-grid');
    tallasConStock.forEach(({ talla, cantidad }) => {
        const item = crear('div', 'stock-item ' + claseStock(cantidad));
        if (talla === ventaActual.talla) item.classList.add('seleccionada');
        item.append(
            crear('span', null, 'Talla ' + talla),
            crear('strong', null, textoPares(cantidad))
        );
        item.addEventListener('click', () => {
            ventaActual.talla = talla;
            grid.querySelectorAll('.stock-item').forEach((el) => el.classList.remove('seleccionada'));
            item.classList.add('seleccionada');
            actualizarBotonVenta();
        });
        grid.append(item);
    });
    tarjetaProducto.append(grid);

    const btnVender = crear('button', 'btn-venta');
    btnVender.id = 'btn-registrar-venta';
    btnVender.type = 'button';
    btnVender.addEventListener('click', registrarVenta);
    tarjetaProducto.append(btnVender);
    actualizarBotonVenta();
}

function actualizarBotonVenta() {
    const btn = document.getElementById('btn-registrar-venta');
    if (!btn) return;
    const fila = PRODUCTOS[ventaActual.sku] &&
        PRODUCTOS[ventaActual.sku].tallas.find((t) => t.talla === ventaActual.talla);

    if (ventaActual.talla === null || !fila) {
        btn.textContent = 'Toca la talla vendida';
        btn.disabled = true;
    } else if (fila.cantidad <= 0) {
        btn.textContent = 'Talla ' + ventaActual.talla + ' agotada';
        btn.disabled = true;
    } else {
        btn.textContent = 'Registrar venta · Talla ' + ventaActual.talla + ' (−1 par)';
        btn.disabled = false;
    }
}

// Resta 1 par: primero trae el inventario más reciente del servidor
async function registrarVenta() {
    if (ventaEnCurso) return;
    ventaEnCurso = true;
    const { sku, talla } = ventaActual;

    try {
        await restaurarDatos(); // otro empleado pudo vender mientras tanto

        const fila = PRODUCTOS[sku] && PRODUCTOS[sku].tallas.find((t) => t.talla === talla);
        if (!fila) {
            mostrarToast('El producto o la talla ya no existe', 2500);
            return;
        }
        if (fila.cantidad <= 0) {
            mostrarToast('Talla ' + talla + ' agotada: no se puede vender', 2500);
            mostrarProducto(sku, PRODUCTOS[sku]); // sin talla seleccionada
            return;
        }

        const resultado = adminCambiarCantidad(sku, talla, -1); // Math.max(0, cantidad - 1) + persistirDatos()
        vibrar();
        reproducirBeep();
        const quedan = PRODUCTOS[sku].tallas.find((t) => t.talla === talla).cantidad;
        mostrarToast(quedan > 0
            ? 'Venta registrada · ' + resultado.mensaje
            : 'Venta registrada · Talla ' + talla + ' agotada');
        // Si aún quedan pares, la talla sigue seleccionada; si no, desaparece del grid
        mostrarProducto(quedan > 0 ? sku + '-' + talla : sku, PRODUCTOS[sku]);
    } finally {
        ventaEnCurso = false;
    }
}


function mostrarNoEncontrado(codigo) {
    const contenedor = crear('div', 'not-found');
    contenedor.append(crear('div', 'not-found-icon', '!'));

    if (PASILLOS[codigo]) {
        // Se escaneó la etiqueta de un pasillo en el módulo de zapatería
        contenedor.append(
            crear('h2', 'product-title', 'Código de pasillo'),
            crear('p', null, 'Este es el código del Pasillo ' + PASILLOS[codigo] + '. Los pasillos se escanean en el módulo Bodega.')
        );
    } else if (parsearCodigo(codigo)) {
        // Tiene el formato de ADOC (SKU o SKU-talla) pero no está en el inventario
        contenedor.append(
            crear('h2', 'product-title', 'Producto no encontrado'),
            crear('p', null, 'El código escaneado no está registrado en el inventario.'),
            crear('span', 'codigo-leido', codigo)
        );
    } else {
        // Código de otra tienda o etiqueta: no se muestra su contenido
        contenedor.append(
            crear('h2', 'product-title', 'Código no válido'),
            crear('p', null, 'Este código de barras no pertenece al inventario de ADOC y no se puede usar.')
        );
    }

    tarjetaProducto.replaceChildren(contenedor);
}

// Se llama cuando la cámara de zapatería lee un código
async function procesarCodigoZapateria(textoDecodificado) {
    if (lecturaEnProceso) return;
    lecturaEnProceso = true;

    const codigo = textoDecodificado.trim();
    console.log('Código leído: ', codigo);
    vibrar();
    detenerCamara();

    await restaurarDatos(); // inventario actualizado antes de consultar

    const producto = buscarProducto(codigo);
    if (producto) {
        mostrarProducto(codigo, producto);
    } else {
        mostrarNoEncontrado(codigo);
    }

    mostrarVista(vistaResultados);
    window.scrollTo(0, 0);
}


/* =====================================================================
   BODEGA: REGISTRO DE ZAPATOS POR PASILLO
   1. Se escanea el código de un pasillo (PASILLO-A ... PASILLO-D) y
      queda "abierto".
   2. Cada zapato que se escanee se agrega a ese pasillo.
   3. "Guardar" registra los zapatos en PRODUCTOS_PASILLO
      (equivale a INSERT INTO productos_pasillo).
   ===================================================================== */

let pasilloAbierto = null;    // letra del pasillo abierto (A, B, C o D)
let zapatosEscaneados = [];   // { codigo, cantidad } escaneados en el pasillo abierto

// Total de pares escaneados en la sesión (suma de cantidades)
function totalEscaneados() {
    return zapatosEscaneados.reduce((suma, z) => suma + z.cantidad, 0);
}
let ultimoCodigoBodega = '';
let horaUltimoCodigo = 0;

function reiniciarBodega() {
    pasilloAbierto = null;
    zapatosEscaneados = [];
    ultimoCodigoBodega = '';
    horaUltimoCodigo = 0;
    actualizarPantallaBodega();
}

function actualizarPantallaBodega() {
    pasilloActual.textContent = pasilloAbierto || '—';
    pasilloActual.parentElement.classList.toggle('abierto', pasilloAbierto !== null);

    if (!pasilloAbierto) {
        textoBodega.textContent = 'Escanea el código del pasillo';
    } else if (zapatosEscaneados.length === 0) {
        textoBodega.textContent = 'Ahora escanea los zapatos del pasillo';
    } else {
        const n = totalEscaneados();
        textoBodega.textContent = n + (n === 1 ? ' zapato escaneado' : ' zapatos escaneados');
    }

    // El último escaneado aparece primero
    listaBodega.replaceChildren(
        ...[...zapatosEscaneados].reverse().map(({ codigo }) => {
            const li = crear('li');
            li.append(crear('span', null, nombreDeCodigo(codigo)), crear('small', null, codigo));
            return li;
        })
    );
}

function procesarCodigoBodega(textoDecodificado) {
    const codigo = textoDecodificado.trim();

    // La cámara lee el mismo código varias veces por segundo; se ignora
    // si es el mismo que se leyó hace menos de 2 segundos
    if (codigo === ultimoCodigoBodega && Date.now() - horaUltimoCodigo < 2000) return;
    ultimoCodigoBodega = codigo;
    horaUltimoCodigo = Date.now();
    console.log('Código leído (bodega): ', codigo);

    // ¿Es el código de un pasillo?
    if (PASILLOS[codigo]) {
        const letra = PASILLOS[codigo];
        if (letra === pasilloAbierto) {
            mostrarToast('El Pasillo ' + letra + ' ya está abierto');
        } else if (zapatosEscaneados.length > 0) {
            mostrarToast('Guarda el Pasillo ' + pasilloAbierto + ' antes de abrir otro');
        } else {
            pasilloAbierto = letra;
            vibrar();
            mostrarToast('Pasillo ' + letra + ' abierto');
        }
    }
    // ¿Es el código de un zapato?
    else if (esCodigoDeVariante(codigo)) {
        if (!pasilloAbierto) {
            mostrarToast('Primero escanea el código del pasillo');
        } else {
            // Buscamos si el zapato ya fue escaneado en esta sesión
            const zapatoExistente = zapatosEscaneados.find(z => z.codigo === codigo);

            if (zapatoExistente) {
                // Si ya existe, sumamos 1 a la cantidad
                zapatoExistente.cantidad += 1;
                mostrarToast(`+1 agregado (${zapatoExistente.cantidad} en total)`);
            } else {
                // Si es nuevo, lo agregamos como objeto con cantidad inicial de 1
                zapatosEscaneados.push({ codigo, cantidad: 1 });
                mostrarToast('Agregado: ' + nombreDeCodigo(codigo));
            }
            vibrar();
            reproducirBeep(); // Emite el sonido de caja registradora
        }
    } else {
        // No es pasillo ni zapato con talla: no se muestra el contenido del código
        mostrarToast(parsearCodigo(codigo)
            ? 'Escanea el código de la talla, no el del modelo'
            : 'Código no válido: no pertenece a ADOC');
    }

    actualizarPantallaBodega();
}

function guardarPasillo() {
    if (!pasilloAbierto) {
        mostrarToast('Primero escanea el código del pasillo');
        return;
    }
    if (zapatosEscaneados.length === 0) {
        mostrarToast('Escanea al menos un zapato del Pasillo ' + pasilloAbierto);
        return;
    }

    // Por cada variante escaneada: suma al inventario (o la crea) y la asocia al pasillo
    zapatosEscaneados.forEach(({ codigo, cantidad }) => {
        registrarEntrada(codigo, cantidad);
        asignarPasillo(codigo, pasilloAbierto);
    });

    const n = totalEscaneados();
    persistirDatos(); // guarda el inventario actualizado (admin.js)
    console.log('Pasillo ' + pasilloAbierto + ' guardado:', zapatosEscaneados);
    mostrarToast('Pasillo ' + pasilloAbierto + ' guardado (' + n + (n === 1 ? ' zapato)' : ' zapatos)'));

    reiniciarBodega();
    detenerCamara();
    setTimeout(() => mostrarVista(vistaMenu), 1000);
}


/* =====================================================================
   FUNCIONES DE CÁMARA
   ===================================================================== */

function iniciarCamara(escaner, alLeer, elementoTexto) {
    escaner.iniciar(alLeer).catch((error) => {
        console.warn('Error de cámara: ', error);
        elementoTexto.textContent = mensajeErrorCamara(error);
    });
}

function detenerCamara() {
    escanerZapateria.detener();
    escanerBodega.detener();
    console.log('Cámara apagada.');
}

function mensajeErrorCamara(error) {
    switch (error.name) {
        case 'InsecureContextError':
            return 'La cámara solo funciona si la página se abre con https:// o desde localhost.';
        case 'NotAllowedError':
        case 'SecurityError':
            return 'No se dio permiso para usar la cámara. Actívalo en la configuración del navegador.';
        case 'NotFoundError':
        case 'OverconstrainedError':
            return 'No se encontró ninguna cámara en este dispositivo.';
        default:
            return 'No se pudo abrir la cámara. Cierra otras apps que la estén usando e inténtalo de nuevo.';
    }
}

function abrirEscanerZapateria() {
    lecturaEnProceso = false;
    textoEscaner.textContent = 'Apunta al código de barras del zapato';
    mostrarVista(vistaEscaner);
    iniciarCamara(escanerZapateria, procesarCodigoZapateria, textoEscaner);
}


/*EVENTOS DE BOTONES - ZAPATERÍA*/
document.getElementById('btn-zapateria').addEventListener('click', abrirEscanerZapateria);
document.getElementById('btn-nuevo-escaner').addEventListener('click', abrirEscanerZapateria);

document.getElementById('btn-cancelar-escaner').addEventListener('click', () => {
    detenerCamara();
    mostrarVista(vistaMenu);
});

document.getElementById('btn-inicio').addEventListener('click', () => {
    detenerCamara();
    mostrarVista(vistaMenu);
});

/*EVENTOS DE BOTONES - BODEGA*/
document.getElementById('btn-bodega').addEventListener('click', () => {
    reiniciarBodega();
    mostrarVista(vistaEscanerBodega);
    iniciarCamara(escanerBodega, procesarCodigoBodega, textoBodega);
});

document.getElementById('btn-cancelar-bodega').addEventListener('click', () => {
    detenerCamara();
    reiniciarBodega();
    mostrarVista(vistaMenu);
});

document.getElementById('btn-guardar-bodega').addEventListener('click', guardarPasillo);

/*BEEP*/
function reproducirBeep() {
    // Usamos Web Audio API nativa del navegador
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = audioCtx.createOscillator();
    const ganancia = audioCtx.createGain();

    oscilador.connect(ganancia);
    ganancia.connect(audioCtx.destination);

    // Configuración del sonido (Tono agudo y corto)
    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz

    // Volumen (Baja rápidamente para hacer el efecto "beep")
    ganancia.gain.setValueAtTime(1, audioCtx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    oscilador.start(audioCtx.currentTime);
    oscilador.stop(audioCtx.currentTime + 0.1);
}
