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


/* =====================================================================
   ZAPATERÍA: CONSULTA DE PRODUCTOS (HU01 + HU02)
   ===================================================================== */

// Equivale a: SELECT ... FROM productos JOIN tallas_inventario WHERE sku = ?
function buscarProducto(codigo) {
    return PRODUCTOS[codigo] || null;
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
    tarjetaProducto.replaceChildren(
        crear('h2', 'product-title', producto.nombre),
        crear('p', 'product-brand', producto.marca),
        crear('p', 'product-sku', 'SKU: ' + codigo),
        crear('h3', 'stock-title', 'Disponibilidad en Bodega')
    );

    const grid = crear('div', 'stock-grid');
    // Tallas ordenadas de menor a mayor
    [...producto.tallas]
        .sort((a, b) => a.talla - b.talla)
        .forEach(({ talla, cantidad }) => {
            const item = crear('div', 'stock-item ' + claseStock(cantidad));
            item.append(
                crear('span', null, 'Talla ' + talla),
                crear('strong', null, textoPares(cantidad))
            );
            grid.append(item);
        });
    tarjetaProducto.append(grid);
}

function mostrarNoEncontrado(codigo) {
    const contenedor = crear('div', 'not-found');
    contenedor.append(
        crear('div', 'not-found-icon', '!'),
        crear('h2', 'product-title', 'Producto no encontrado')
    );

    if (PASILLOS[codigo]) {
        // Se escaneó la etiqueta de un pasillo en el módulo de zapatería
        contenedor.append(
            crear('p', null, 'Este es el código del Pasillo ' + PASILLOS[codigo] + '. Los pasillos se escanean en el módulo Bodega.')
        );
    } else {
        contenedor.append(
            crear('p', null, 'El código escaneado no está registrado en el inventario.')
        );
    }

    contenedor.append(crear('span', 'codigo-leido', codigo));
    tarjetaProducto.replaceChildren(contenedor);
}

// Se llama cuando la cámara de zapatería lee un código
function procesarCodigoZapateria(textoDecodificado) {
    if (lecturaEnProceso) return;
    lecturaEnProceso = true;

    const codigo = textoDecodificado.trim();
    console.log('Código leído: ', codigo);
    vibrar();

    const producto = buscarProducto(codigo);
    if (producto) {
        mostrarProducto(codigo, producto);
    } else {
        mostrarNoEncontrado(codigo);
    }

    detenerCamara();
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
let zapatosEscaneados = [];   // SKU escaneados en el pasillo abierto
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
        const n = zapatosEscaneados.length;
        textoBodega.textContent = n + (n === 1 ? ' zapato escaneado' : ' zapatos escaneados');
    }

    // El último escaneado aparece primero
    listaBodega.replaceChildren(
        ...[...zapatosEscaneados].reverse().map((sku) => {
            const li = crear('li');
            li.append(crear('span', null, PRODUCTOS[sku].nombre), crear('small', null, sku));
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
    else if (PRODUCTOS[codigo]) {
        if (!pasilloAbierto) {
            mostrarToast('Primero escanea el código del pasillo');
        } else if (zapatosEscaneados.includes(codigo)) {
            mostrarToast('Ya escaneado: ' + PRODUCTOS[codigo].nombre);
        } else {
            zapatosEscaneados.push(codigo);
            vibrar();
            mostrarToast('Agregado: ' + PRODUCTOS[codigo].nombre);
        }
    } else {
        mostrarToast('Código no registrado: ' + codigo);
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

    // INSERT INTO productos_pasillo (sku, pasillo), sin repetir la llave (sku, pasillo)
    zapatosEscaneados.forEach((sku) => {
        const yaExiste = PRODUCTOS_PASILLO.some(
            (r) => r.sku === sku && r.pasillo === pasilloAbierto
        );
        if (!yaExiste) PRODUCTOS_PASILLO.push({ sku, pasillo: pasilloAbierto });
    });

    const n = zapatosEscaneados.length;
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
