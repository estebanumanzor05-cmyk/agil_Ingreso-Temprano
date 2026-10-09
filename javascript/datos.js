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

/* Tabla pasillos: texto del código de barra -> letra del pasillo */
const PASILLOS = {
    "PASILLO-A": "A",
    "PASILLO-B": "B",
    "PASILLO-C": "C",
    "PASILLO-D": "D"
};

/* Tabla productos_pasillo: registro inicial de zapatos en pasillos (bodega) */
const PRODUCTOS_PASILLO = [
    { sku: "7891011121314", pasillo: "B" },
    { sku: "7891011121301", pasillo: "A" },
    { sku: "7891011121302", pasillo: "C" },
    { sku: "7891011121303", pasillo: "A" },
    { sku: "7891011121304", pasillo: "B" },
    { sku: "7891011121305", pasillo: "D" },
    { sku: "7891011121306", pasillo: "B" },
    { sku: "7891011121307", pasillo: "C" },
    { sku: "7891011121308", pasillo: "B" },
    { sku: "7891011121309", pasillo: "A" },
    { sku: "7891011121310", pasillo: "A" },
    { sku: "7891011121311", pasillo: "A" },
    { sku: "7891011121312", pasillo: "D" }
];
