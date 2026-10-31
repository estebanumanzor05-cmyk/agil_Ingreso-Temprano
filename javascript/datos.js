
// diccionario maestro para mantener los nombres en memoria
const CATALOGO_MODELOS = {
  "7891011121314": { nombre: "Zapato Oxford Clásico", marca: "Flexi" },
  "7891011121301": { nombre: "Tenis Runner Pro", marca: "Nike" },
  "7891011121302": { nombre: "Mocasín Clásico", marca: "Hush Puppies" },
  "7891011121303": { nombre: "Sandalia Verano", marca: "Adidas" },
  "7891011121304": { nombre: "Tenis Court Classic", marca: "Puma" },
  "7891011121305": { nombre: "Bota Trabajo Industrial", marca: "Timberland" },
  "7891011121306": { nombre: "Tenis Old Skool", marca: "Vans" },
  "7891011121307": { nombre: "Chuck Taylor High", marca: "Converse" },
  "7891011121308": { nombre: "Sandalia Clog", marca: "Crocs" },
  "7891011121309": { nombre: "Zapatilla Walk Comfort", marca: "Skechers" },
  "7891011121310": { nombre: "Tenis Edición Limitada", marca: "Puma" },
  "7891011121311": { nombre: "Zapato Escolar Negro", marca: "Flexi" },
  "7891011121312": { nombre: "Tenis Training Flex", marca: "Reebok" }
};

// inicializacion del inventario global vacio
const PRODUCTOS = {};

// catalogo de letras de pasillos
const PASILLOS = {
  "PASILLO-A": "A",
  "PASILLO-B": "B",
  "PASILLO-C": "C",
  "PASILLO-D": "D"
};

// inicializacion de ubicaciones vacia
const PRODUCTOS_PASILLO = [];

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