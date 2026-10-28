/* =====================================================================
   DATOS DE PRUEBA - SPRINT 1
   Copia de mock_data_for_sprint1.sql en formato JavaScript.
   Mientras no exista el backend, la app consulta estos objetos en lugar
   de la base de datos. Si cambia el SQL, hay que actualizar este archivo.
   ===================================================================== */

/* Tablas productos + tallas_inventario, agrupadas por SKU (HU01, HU02).
   La llave es el SKU como TEXTO, igual que lo devuelve el lector. */
const PRODUCTOS = {
    "7891011121314": {
        nombre: "Zapato Oxford Clásico",
        marca: "Flexi",
        tallas: [{ talla: 39, cantidad: 2 }, { talla: 40, cantidad: 0 }, { talla: 41, cantidad: 5 }, { talla: 42, cantidad: 1 }, { talla: 43, cantidad: 3 }]
    },
    "7891011121301": {
        nombre: "Tenis Runner Pro",
        marca: "Nike",
        tallas: [{ talla: 38, cantidad: 4 }, { talla: 39, cantidad: 2 }, { talla: 40, cantidad: 0 }, { talla: 41, cantidad: 6 }, { talla: 42, cantidad: 3 }]
    },
    "7891011121302": {
        nombre: "Mocasín Clásico",
        marca: "Hush Puppies",
        tallas: [{ talla: 40, cantidad: 3 }, { talla: 41, cantidad: 1 }, { talla: 42, cantidad: 2 }]
    },
    "7891011121303": {
        nombre: "Sandalia Verano",
        marca: "Adidas",
        tallas: [{ talla: 36, cantidad: 5 }, { talla: 37, cantidad: 5 }, { talla: 38, cantidad: 2 }]
    },
    "7891011121304": {
        nombre: "Tenis Court Classic",
        marca: "Puma",
        tallas: [{ talla: 36, cantidad: 3 }, { talla: 37, cantidad: 6 }, { talla: 38, cantidad: 5 }, { talla: 39, cantidad: 2 }]
    },
    "7891011121305": {
        nombre: "Bota Trabajo Industrial",
        marca: "Timberland",
        tallas: [{ talla: 40, cantidad: 2 }, { talla: 41, cantidad: 3 }, { talla: 42, cantidad: 3 }, { talla: 43, cantidad: 2 }, { talla: 44, cantidad: 1 }]
    },
    "7891011121306": {
        nombre: "Tenis Old Skool",
        marca: "Vans",
        tallas: [{ talla: 37, cantidad: 1 }, { talla: 38, cantidad: 4 }, { talla: 39, cantidad: 4 }, { talla: 40, cantidad: 2 }]
    },
    "7891011121307": {
        nombre: "Chuck Taylor High",
        marca: "Converse",
        tallas: [{ talla: 36, cantidad: 2 }, { talla: 38, cantidad: 3 }, { talla: 40, cantidad: 5 }, { talla: 42, cantidad: 0 }]
    },
    "7891011121308": {
        nombre: "Sandalia Clog",
        marca: "Crocs",
        tallas: [{ talla: 38, cantidad: 8 }, { talla: 40, cantidad: 6 }, { talla: 42, cantidad: 4 }]
    },
    "7891011121309": {
        nombre: "Zapatilla Walk Comfort",
        marca: "Skechers",
        tallas: [{ talla: 36, cantidad: 2 }, { talla: 37, cantidad: 3 }, { talla: 38, cantidad: 3 }, { talla: 39, cantidad: 0 }]
    },
    "7891011121310": {
        nombre: "Tenis Edición Limitada",
        marca: "Puma",
        tallas: [{ talla: 41, cantidad: 1 }]
    },
    "7891011121311": {
        nombre: "Zapato Escolar Negro",
        marca: "Flexi",
        tallas: [{ talla: 34, cantidad: 6 }, { talla: 35, cantidad: 6 }, { talla: 36, cantidad: 5 }, { talla: 37, cantidad: 4 }, { talla: 38, cantidad: 2 }]
    },
    "7891011121312": {
        nombre: "Tenis Training Flex",
        marca: "Reebok",
        tallas: [{ talla: 41, cantidad: 4 }, { talla: 42, cantidad: 5 }, { talla: 43, cantidad: 3 }]
    }
};

/* Catálogo de modelos: nombre y marca de los modelos que tienen etiqueta impresa.
   Es una copia hecha al cargar la página, ANTES de que se traiga el inventario del
   servidor. Así, aunque el administrador deje el inventario vacío, Bodega sigue
   sabiendo cómo se llama cada modelo cuando se escanea y se registra por primera vez. */
const CATALOGO_MODELOS = {};
Object.keys(PRODUCTOS).forEach((sku) => {
    CATALOGO_MODELOS[sku] = { nombre: PRODUCTOS[sku].nombre, marca: PRODUCTOS[sku].marca };
});

/* Tabla pasillos: texto del código de barra -> letra del pasillo */
const PASILLOS = {
    "PASILLO-A": "A",
    "PASILLO-B": "B",
    "PASILLO-C": "C",
    "PASILLO-D": "D"
};

/* Pasillo de cada modelo (igual que el SQL) */
const PASILLO_POR_MODELO = {
    "7891011121314": "B", "7891011121301": "A", "7891011121302": "C",
    "7891011121303": "A", "7891011121304": "B", "7891011121305": "D",
    "7891011121306": "B", "7891011121307": "C", "7891011121308": "B",
    "7891011121309": "A", "7891011121310": "A", "7891011121311": "A",
    "7891011121312": "D"
};

/* productos_pasillo por VARIANTE: { codigo_barra: "SKU-talla", pasillo: "A" } */
const PRODUCTOS_PASILLO = [];
Object.keys(PRODUCTOS).forEach((sku) => {
    PRODUCTOS[sku].tallas.forEach(({ talla }) => {
        PRODUCTOS_PASILLO.push({ codigo_barra: sku + '-' + talla, pasillo: PASILLO_POR_MODELO[sku] });
    });
});

/* "7891011121301-40" -> { sku, talla: 40 } | "7891011121301" -> { sku, talla: null } | otro -> null */
function parsearCodigo(codigo) {
    const m = /^(\d{13})(?:-(\d{1,2}))?$/.exec(String(codigo).trim());
    if (!m) return null;
    return { sku: m[1], talla: m[2] ? Number(m[2]) : null };
}

function esCodigoDeVariante(codigo) {
    const datos = parsearCodigo(codigo);
    return datos !== null && datos.talla !== null;
}

/* ¿Existe el código? No modifica nada */
function existeCodigo(codigo) {
    const datos = parsearCodigo(codigo);
    if (!datos || !PRODUCTOS[datos.sku]) return false;
    if (datos.talla === null) return true;
    return PRODUCTOS[datos.sku].tallas.some((t) => t.talla === datos.talla);
}

function nombreDeCodigo(codigo) {
    const datos = parsearCodigo(codigo);
    if (!datos) return 'Producto nuevo';
    if (PRODUCTOS[datos.sku]) return PRODUCTOS[datos.sku].nombre;      // está en el inventario
    if (CATALOGO_MODELOS[datos.sku]) return CATALOGO_MODELOS[datos.sku].nombre; // inventario vacío, pero se conoce el modelo
    return 'Producto nuevo';                                            // modelo desconocido
}

/* Revisa si existe y decide: sumar, agregar talla nueva o crear producto nuevo */
function registrarEntrada(codigo, cantidad = 1) {
    if (!esCodigoDeVariante(codigo) || !(cantidad > 0)) {
        return { estado: 'invalido', codigo };
    }
    const { sku, talla } = parsearCodigo(codigo);

    if (!PRODUCTOS[sku]) {
        const modelo = CATALOGO_MODELOS[sku];
        PRODUCTOS[sku] = {
            nombre: modelo ? modelo.nombre : 'Producto nuevo ' + sku,
            marca: modelo ? modelo.marca : 'Sin definir',
            tallas: [{ talla, cantidad }]
        };
        return { estado: 'producto-nuevo', codigo, cantidad };
    }
    const fila = PRODUCTOS[sku].tallas.find((t) => t.talla === talla);
    if (fila) {
        fila.cantidad += cantidad;
        return { estado: 'sumado', codigo, cantidad: fila.cantidad };
    }
    PRODUCTOS[sku].tallas.push({ talla, cantidad });
    return { estado: 'talla-nueva', codigo, cantidad };
}

function asignarPasillo(codigo, pasillo) {
    const yaExiste = PRODUCTOS_PASILLO.some((r) => r.codigo_barra === codigo && r.pasillo === pasillo);
    if (!yaExiste) PRODUCTOS_PASILLO.push({ codigo_barra: codigo, pasillo });
}

function pasilloDeModelo(sku) {
    const letras = [...new Set(
        PRODUCTOS_PASILLO.filter((r) => r.codigo_barra.startsWith(sku + '-')).map((r) => r.pasillo)
    )].sort();
    return letras.length ? letras.join(', ') : 'Sin asignar';
}