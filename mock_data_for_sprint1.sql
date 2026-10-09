
-- ---------- Tablas: EMPLEADO ----------
CREATE TABLE productos (
    sku     VARCHAR(20)  PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL,
    marca   VARCHAR(50)  NOT NULL
);

CREATE TABLE tallas_inventario (
    sku      VARCHAR(20) NOT NULL REFERENCES productos(sku),
    talla    INT         NOT NULL,
    cantidad INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (sku, talla)
);

-- ---------- Tablas: BODEGA ----------
-- Los 4 pasillos. 'codigo' es el texto que lleva el código de barra del pasillo.
CREATE TABLE pasillos (
    codigo  VARCHAR(20) PRIMARY KEY,
    pasillo CHAR(1)     NOT NULL UNIQUE
);

-- Qué zapatos están registrados en qué pasillo (lo llena el flujo de bodega).
-- Si el equipo quiere un solo pasillo por zapato, la llave primaria sería solo sku.
CREATE TABLE productos_pasillo (
    sku     VARCHAR(20) NOT NULL REFERENCES productos(sku),
    pasillo CHAR(1)     NOT NULL REFERENCES pasillos(pasillo),
    PRIMARY KEY (sku, pasillo)
);

-- ---------- Productos ----------
INSERT INTO productos (sku, nombre, marca) VALUES
('7891011121314', 'Zapato Oxford Clásico', 'Flexi'),
('7891011121301', 'Tenis Runner Pro', 'Nike'),
('7891011121302', 'Mocasín Clásico', 'Hush Puppies'),
('7891011121303', 'Sandalia Verano', 'Adidas'),
('7891011121304', 'Tenis Court Classic', 'Puma'),
('7891011121305', 'Bota Trabajo Industrial', 'Timberland'),
('7891011121306', 'Tenis Old Skool', 'Vans'),
('7891011121307', 'Chuck Taylor High', 'Converse'),
('7891011121308', 'Sandalia Clog', 'Crocs'),
('7891011121309', 'Zapatilla Walk Comfort', 'Skechers'),
('7891011121310', 'Tenis Edición Limitada', 'Puma'),
('7891011121311', 'Zapato Escolar Negro', 'Flexi'),
('7891011121312', 'Tenis Training Flex', 'Reebok');

-- ---------- Tallas y cantidades ----------
-- Cubre los 4 colores de la pantalla: 0 (rojo), 1-2 (naranja), 3-4 (amarillo), 5+ (verde).
-- Incluye tallas agotadas y un producto con una sola talla.
INSERT INTO tallas_inventario (sku, talla, cantidad) VALUES
('7891011121314', 39, 2), ('7891011121314', 40, 0), ('7891011121314', 41, 5), ('7891011121314', 42, 1), ('7891011121314', 43, 3),
('7891011121301', 38, 4), ('7891011121301', 39, 2), ('7891011121301', 40, 0), ('7891011121301', 41, 6), ('7891011121301', 42, 3),
('7891011121302', 40, 3), ('7891011121302', 41, 1), ('7891011121302', 42, 2),
('7891011121303', 36, 5), ('7891011121303', 37, 5), ('7891011121303', 38, 2),
('7891011121304', 36, 3), ('7891011121304', 37, 6), ('7891011121304', 38, 5), ('7891011121304', 39, 2),
('7891011121305', 40, 2), ('7891011121305', 41, 3), ('7891011121305', 42, 3), ('7891011121305', 43, 2), ('7891011121305', 44, 1),
('7891011121306', 37, 1), ('7891011121306', 38, 4), ('7891011121306', 39, 4), ('7891011121306', 40, 2),
('7891011121307', 36, 2), ('7891011121307', 38, 3), ('7891011121307', 40, 5), ('7891011121307', 42, 0),
('7891011121308', 38, 8), ('7891011121308', 40, 6), ('7891011121308', 42, 4),
('7891011121309', 36, 2), ('7891011121309', 37, 3), ('7891011121309', 38, 3), ('7891011121309', 39, 0),
('7891011121310', 41, 1),
('7891011121311', 34, 6), ('7891011121311', 35, 6), ('7891011121311', 36, 5), ('7891011121311', 37, 4), ('7891011121311', 38, 2),
('7891011121312', 41, 4), ('7891011121312', 42, 5), ('7891011121312', 43, 3);

-- ---------- Pasillos (uno por código de barra de bodega) ----------
INSERT INTO pasillos (codigo, pasillo) VALUES
('PASILLO-A', 'A'),
('PASILLO-B', 'B'),
('PASILLO-C', 'C'),
('PASILLO-D', 'D');

-- ---------- Registro inicial de zapatos en pasillos (datos de prueba) ----------
INSERT INTO productos_pasillo (sku, pasillo) VALUES
('7891011121314', 'B'),
('7891011121301', 'A'),
('7891011121302', 'C'),
('7891011121303', 'A'),
('7891011121304', 'B'),
('7891011121305', 'D'),
('7891011121306', 'B'),
('7891011121307', 'C'),
('7891011121308', 'B'),
('7891011121309', 'A'),
('7891011121310', 'A'),
('7891011121311', 'A'),
('7891011121312', 'D');

