/* =====================================================================
   MÓDULO ADMINISTRADOR
   HU: "Como administrador, quiero actualizar cantidades y tallas
   disponibles" (agregar/borrar productos y tallas, subir/bajar cantidades).

   - Trabaja sobre los mismos objetos de datos.js (PRODUCTOS, PRODUCTOS_PASILLO),
     así la zapatería y la bodega ven los cambios de inmediato.
   - Mientras no exista backend, los cambios se guardan en localStorage
     para que no se pierdan al recargar la página. También los guarda
     el módulo Bodega (persistirDatos() se llama desde script.js).
   - Una talla con 0 pares no se muestra en ninguna pantalla: reaparece
     sola cuando se vuelve a registrar un par de esa talla.
   - Debe cargarse DESPUÉS de datos.js y script.js.
   ===================================================================== */

const CLAVE_LOCAL = 'adoc_inventario_v1';

/* PERSISTENCIA (Servidor SQL + respaldo en localStorage) */
// Promesa del último guardado: las lecturas esperan a que termine
let persistenciaPendiente = Promise.resolve();

async function guardarEnServidor() {
    const payload = {
        productos: PRODUCTOS,
        productosPasillo: PRODUCTOS_PASILLO
    };
    try {
        localStorage.setItem(CLAVE_LOCAL, JSON.stringify(payload));
        await fetch('/api/inventario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.warn('No se pudo sincronizar con el servidor: ', error);
    }
}

function persistirDatos() {
    persistenciaPendiente = guardarEnServidor();
    return persistenciaPendiente;
}

async function restaurarDatos() {
    await persistenciaPendiente; // espera a que termine cualquier guardado en curso
    try {
        const respuesta = await fetch('/api/inventario');
        if (!respuesta.ok) throw new Error('Error al consultar API');
        const guardado = await respuesta.json();

        if (!guardado || typeof guardado.productos !== 'object' || !Array.isArray(guardado.productosPasillo)) return;

        // Se actualizan los objetos globales con los datos de la base de datos SQL
        Object.keys(PRODUCTOS).forEach((sku) => delete PRODUCTOS[sku]);
        Object.assign(PRODUCTOS, guardado.productos);
        PRODUCTOS_PASILLO.length = 0;
        PRODUCTOS_PASILLO.push(...guardado.productosPasillo);

        if (typeof renderAdmin === 'function') renderAdmin();
    } catch (error) {
        console.warn('Usando datos locales mientras responde el servidor: ', error);
    }
}

restaurarDatos();
// Sincronización
document.getElementById('btn-zapateria').addEventListener('click', restaurarDatos);
document.getElementById('btn-bodega').addEventListener('click', restaurarDatos);
document.getElementById('btn-admin').addEventListener('click', restaurarDatos);

/* ---------------------------------------------------------------------
   OPERACIONES SOBRE LOS DATOS
   Todas devuelven { ok: true|false, mensaje } y no tocan el HTML.
   --------------------------------------------------------------------- */
function esEnteroTexto(valor) {
    return String(valor).trim() !== '' && Number.isInteger(Number(valor));
}

function validarTalla(valor) {
    if (!esEnteroTexto(valor)) return 'La talla debe ser un número entero.';
    const t = Number(valor);
    if (t < 1 || t > 99) return 'La talla debe estar entre 1 y 99.';
    return null;
}

function validarCantidad(valor) {
    if (!esEnteroTexto(valor)) return 'La cantidad debe ser un número entero.';
    if (Number(valor) < 0) return 'La cantidad no puede ser negativa.';
    return null;
}

// Pasillo(s) actuales de un modelo: primera letra encontrada o null
function pasilloPrincipal(sku) {
    const fila = PRODUCTOS_PASILLO.find((r) => r.codigo_barra.startsWith(sku + '-'));
    return fila ? fila.pasillo : null;
}

function adminAgregarProducto({ sku, nombre, marca, pasillo, talla, cantidad }) {
    sku = String(sku).trim();
    nombre = String(nombre).trim();
    marca = String(marca).trim();

    if (!/^\d{13}$/.test(sku)) return { ok: false, mensaje: 'El SKU debe tener exactamente 13 dígitos.' };
    if (PRODUCTOS[sku]) return { ok: false, mensaje: 'Ya existe un producto con ese SKU.' };
    if (!nombre) return { ok: false, mensaje: 'Escribe el nombre del producto.' };
    if (!marca) return { ok: false, mensaje: 'Escribe la marca.' };
    if (!Object.values(PASILLOS).includes(pasillo)) return { ok: false, mensaje: 'Elige un pasillo válido.' };

    const errorTalla = validarTalla(talla);
    if (errorTalla) return { ok: false, mensaje: errorTalla };
    const errorCantidad = validarCantidad(cantidad);
    if (errorCantidad) return { ok: false, mensaje: errorCantidad };
    if (Number(cantidad) < 1) return { ok: false, mensaje: 'La cantidad inicial debe ser al menos 1.' };

    PRODUCTOS[sku] = { nombre, marca, tallas: [{ talla: Number(talla), cantidad: Number(cantidad) }] };
    asignarPasillo(sku + '-' + Number(talla), pasillo);
    persistirDatos();
    return { ok: true, mensaje: 'Producto agregado: ' + nombre };
}

function adminEliminarProducto(sku) {
    if (!PRODUCTOS[sku]) return { ok: false, mensaje: 'El producto no existe.' };
    const nombre = PRODUCTOS[sku].nombre;
    delete PRODUCTOS[sku];

    // Quita también sus ubicaciones (equivale a DELETE en productos_pasillo)
    for (let i = PRODUCTOS_PASILLO.length - 1; i >= 0; i--) {
        if (PRODUCTOS_PASILLO[i].codigo_barra.startsWith(sku + '-')) PRODUCTOS_PASILLO.splice(i, 1);
    }
    persistirDatos();
    return { ok: true, mensaje: 'Producto eliminado: ' + nombre };
}

function adminAgregarTalla(sku, talla, cantidad) {
    const producto = PRODUCTOS[sku];
    if (!producto) return { ok: false, mensaje: 'El producto no existe.' };

    const errorTalla = validarTalla(talla);
    if (errorTalla) return { ok: false, mensaje: errorTalla };
    const errorCantidad = validarCantidad(cantidad);
    if (errorCantidad) return { ok: false, mensaje: errorCantidad };

    talla = Number(talla);
    cantidad = Number(cantidad);
    if (cantidad < 1) return { ok: false, mensaje: 'La cantidad debe ser al menos 1.' };

    const existente = producto.tallas.find((t) => t.talla === talla);
    if (existente) {
        if (existente.cantidad > 0) {
            return { ok: false, mensaje: 'La talla ' + talla + ' ya existe: usa + o − para cambiar la cantidad.' };
        }
        existente.cantidad = cantidad; // la talla estaba agotada: vuelve a aparecer
        persistirDatos();
        return { ok: true, mensaje: 'Talla ' + talla + ' agregada' };
    }

    producto.tallas.push({ talla, cantidad });
    const pasillo = pasilloPrincipal(sku);
    if (pasillo) asignarPasillo(sku + '-' + talla, pasillo);
    persistirDatos();
    return { ok: true, mensaje: 'Talla ' + talla + ' agregada' };
}

function adminEliminarTalla(sku, talla) {
    const producto = PRODUCTOS[sku];
    if (!producto) return { ok: false, mensaje: 'El producto no existe.' };

    const antes = producto.tallas.length;
    producto.tallas = producto.tallas.filter((t) => t.talla !== talla);
    if (producto.tallas.length === antes) return { ok: false, mensaje: 'La talla no existe.' };

    const codigo = sku + '-' + talla;
    for (let i = PRODUCTOS_PASILLO.length - 1; i >= 0; i--) {
        if (PRODUCTOS_PASILLO[i].codigo_barra === codigo) PRODUCTOS_PASILLO.splice(i, 1);
    }
    persistirDatos();
    return { ok: true, mensaje: 'Talla ' + talla + ' eliminada' };
}

// Pone una cantidad exacta (nunca menor que 0)
function adminFijarCantidad(sku, talla, cantidad) {
    const fila = PRODUCTOS[sku] && PRODUCTOS[sku].tallas.find((t) => t.talla === talla);
    if (!fila) return { ok: false, mensaje: 'La talla no existe.' };
    const error = validarCantidad(cantidad);
    if (error) return { ok: false, mensaje: error };

    fila.cantidad = Number(cantidad);
    persistirDatos();
    return { ok: true, mensaje: 'Talla ' + talla + ': ' + textoPares(fila.cantidad) };
}

// Suma o resta (delta = +1 / -1). No baja de 0.
function adminCambiarCantidad(sku, talla, delta) {
    const fila = PRODUCTOS[sku] && PRODUCTOS[sku].tallas.find((t) => t.talla === talla);
    if (!fila) return { ok: false, mensaje: 'La talla no existe.' };
    return adminFijarCantidad(sku, talla, Math.max(0, fila.cantidad + delta));
}

/* ---------------------------------------------------------------------
   PANTALLA DE ADMINISTRADOR
   --------------------------------------------------------------------- */
const adminLista = document.getElementById('admin-lista');
const adminResumen = document.getElementById('admin-resumen');
const adminBuscar = document.getElementById('admin-buscar');
const adminNuevo = document.getElementById('admin-nuevo');
const formNuevoProducto = document.getElementById('form-nuevo-producto');
const vistaAdmin = document.getElementById('vista-admin');

// Modelos desplegados, para que no se cierren al refrescar la lista
const adminAbiertos = new Set();

function adminAviso(resultado) {
    mostrarToast(resultado.mensaje, resultado.ok ? 1500 : 2800);
    return resultado.ok;
}

function boton(clase, texto, titulo, alClick) {
    const b = crear('button', clase, texto);
    b.type = 'button';
    if (titulo) b.title = titulo;
    b.addEventListener('click', alClick);
    return b;
}

function crearFilaTalla(sku, { talla, cantidad }) {
    const fila = crear('div', 'admin-talla ' + claseStock(cantidad));

    const entrada = document.createElement('input');
    entrada.type = 'number';
    entrada.min = '0';
    entrada.step = '1';
    entrada.inputMode = 'numeric';
    entrada.value = cantidad;
    entrada.className = 'admin-cantidad';
    entrada.setAttribute('aria-label', 'Cantidad talla ' + talla);
    entrada.addEventListener('change', () => {
        adminAviso(adminFijarCantidad(sku, talla, entrada.value));
        renderAdmin();
    });

    const restar = boton('admin-mas-menos', '−', 'Restar un par', () => {
        adminAviso(adminCambiarCantidad(sku, talla, -1));
        renderAdmin();
    });
    restar.disabled = cantidad <= 0;

    const sumar = boton('admin-mas-menos', '+', 'Sumar un par', () => {
        adminAviso(adminCambiarCantidad(sku, talla, +1));
        renderAdmin();
    });

    const borrar = boton('admin-borrar-talla', '✕', 'Eliminar talla', () => {
        if (!confirm('¿Eliminar la talla ' + talla + ' de ' + PRODUCTOS[sku].nombre + '?')) return;
        adminAviso(adminEliminarTalla(sku, talla));
        renderAdmin();
    });

    fila.append(crear('span', 'admin-talla-nombre', 'Talla ' + talla), restar, entrada, sumar, borrar);
    return fila;
}

function crearFormTalla(sku) {
    const form = crear('form', 'admin-form-talla');
    form.autocomplete = 'off';

    const talla = document.createElement('input');
    talla.type = 'number';
    talla.min = '1';
    talla.max = '99';
    talla.inputMode = 'numeric';
    talla.placeholder = 'Talla';
    talla.required = true;
    talla.className = 'admin-input';

    const cantidad = document.createElement('input');
    cantidad.type = 'number';
    cantidad.min = '1';
    cantidad.inputMode = 'numeric';
    cantidad.placeholder = 'Cantidad';
    cantidad.value = '1';
    cantidad.required = true;
    cantidad.className = 'admin-input';

    const enviar = crear('button', 'admin-btn-agregar', 'Agregar talla');
    enviar.type = 'submit';

    form.append(talla, cantidad, enviar);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminAviso(adminAgregarTalla(sku, talla.value, cantidad.value))) {
            adminAbiertos.add(sku);
            renderAdmin();
        }
    });
    return form;
}

function crearTarjetaAdmin(sku) {
    const producto = PRODUCTOS[sku];
    const total = producto.tallas.reduce((suma, t) => suma + t.cantidad, 0);

    const detalle = crear('details', 'admin-producto');
    detalle.open = adminAbiertos.has(sku);
    detalle.addEventListener('toggle', () => {
        if (detalle.open) adminAbiertos.add(sku);
        else adminAbiertos.delete(sku);
    });

    const resumen = crear('summary');
    resumen.append(
        crear('span', 'admin-producto-nombre', producto.nombre),
        crear('small', 'admin-producto-info',
            producto.marca + ' · Pasillo ' + pasilloDeModelo(sku) + ' · ' + textoPares(total))
    );
    detalle.append(resumen);

    const cuerpo = crear('div', 'admin-producto-cuerpo');
    cuerpo.append(crear('p', 'product-sku', 'SKU: ' + sku));

    // Solo se listan las tallas con existencias
    const tallasConStock = producto.tallas.filter((t) => t.cantidad > 0);
    if (tallasConStock.length === 0) {
        cuerpo.append(crear('p', 'admin-vacio', 'Este modelo no tiene tallas con existencias. Agrega una abajo.'));
    }
    tallasConStock
        .sort((a, b) => a.talla - b.talla)
        .forEach((t) => cuerpo.append(crearFilaTalla(sku, t)));

    cuerpo.append(crearFormTalla(sku));

    cuerpo.append(boton('admin-borrar-producto', 'Eliminar producto', null, () => {
        if (!confirm('¿Eliminar "' + producto.nombre + '" y todas sus tallas? Esta acción no se puede deshacer.')) return;
        adminAbiertos.delete(sku);
        adminAviso(adminEliminarProducto(sku));
        renderAdmin();
    }));

    detalle.append(cuerpo);
    return detalle;
}

function renderAdmin() {
    const filtro = adminBuscar.value.trim().toLowerCase();
    const todos = Object.keys(PRODUCTOS);
    const visibles = todos
        .filter((sku) => {
            const p = PRODUCTOS[sku];
            return !filtro || sku.includes(filtro)
                || p.nombre.toLowerCase().includes(filtro)
                || p.marca.toLowerCase().includes(filtro);
        })
        .sort((a, b) => PRODUCTOS[a].nombre.localeCompare(PRODUCTOS[b].nombre));

    const pares = todos.reduce((s, sku) => s + PRODUCTOS[sku].tallas.reduce((x, t) => x + t.cantidad, 0), 0);
    adminResumen.textContent = todos.length + (todos.length === 1 ? ' modelo' : ' modelos') + ' · ' + textoPares(pares) + ' en total';

    if (visibles.length === 0) {
        adminLista.replaceChildren(crear('p', 'admin-vacio', todos.length ? 'Sin resultados para la búsqueda.' : 'No hay productos. Agrega el primero.'));
        return;
    }
    adminLista.replaceChildren(...visibles.map(crearTarjetaAdmin));
}

function abrirAdmin() {
    adminBuscar.value = '';
    mostrarVista(vistaAdmin);
    renderAdmin();
    window.scrollTo(0, 0);
}

/* EVENTOS */
document.getElementById('btn-admin').addEventListener('click', abrirAdmin);
document.getElementById('btn-admin-inicio').addEventListener('click', () => mostrarVista(vistaMenu));
adminBuscar.addEventListener('input', renderAdmin);

formNuevoProducto.addEventListener('submit', (e) => {
    e.preventDefault();
    const campo = (nombre) => formNuevoProducto.elements[nombre].value;
    const resultado = adminAgregarProducto({
        sku: campo('sku'),
        nombre: campo('nombre'),
        marca: campo('marca'),
        pasillo: campo('pasillo'),
        talla: campo('talla'),
        cantidad: campo('cantidad')
    });
    if (adminAviso(resultado)) {
        adminAbiertos.add(String(campo('sku')).trim());
        formNuevoProducto.reset();
        adminNuevo.open = false;
        adminBuscar.value = '';
        renderAdmin();
    }
});
