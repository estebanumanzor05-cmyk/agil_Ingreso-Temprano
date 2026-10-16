-- INVENTARIO CORREGIDO: código de barras por modelo + talla (Code 128).
-- PostgreSQL. Script de datos iniciales para una base NUEVA (no migración).
-- Cada escaneo de entrada suma 1 par exclusivamente a la talla escaneada.
-- Las cantidades iniciales se conservan del mock original; para iniciar vacío,
-- cambiar los valores de cantidad en el INSERT de tallas_inventario a 0.
-- Los códigos originales identifican MODELOS, no pares ni tallas.

CREATE TABLE productos (
    sku VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    marca VARCHAR(50) NOT NULL
);

CREATE TABLE tallas_inventario (
    codigo_barra VARCHAR(40) PRIMARY KEY,
    sku VARCHAR(20) NOT NULL REFERENCES productos(sku),
    talla INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    UNIQUE (sku, talla)
);

CREATE TABLE pasillos (
    codigo VARCHAR(20) PRIMARY KEY,
    pasillo CHAR(1) NOT NULL UNIQUE
);

-- La ubicación se asocia a la variante (modelo + talla), no a todo el modelo.
CREATE TABLE productos_pasillo (
    codigo_barra VARCHAR(40) NOT NULL REFERENCES tallas_inventario(codigo_barra),
    pasillo CHAR(1) NOT NULL REFERENCES pasillos(pasillo),
    PRIMARY KEY (codigo_barra, pasillo)
);

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

INSERT INTO tallas_inventario (codigo_barra, sku, talla, cantidad) VALUES
('7891011121314-39', '7891011121314', 39, 2),
('7891011121314-40', '7891011121314', 40, 0),
('7891011121314-41', '7891011121314', 41, 5),
('7891011121314-42', '7891011121314', 42, 1),
('7891011121314-43', '7891011121314', 43, 3),
('7891011121301-38', '7891011121301', 38, 4),
('7891011121301-39', '7891011121301', 39, 2),
('7891011121301-40', '7891011121301', 40, 0),
('7891011121301-41', '7891011121301', 41, 6),
('7891011121301-42', '7891011121301', 42, 3),
('7891011121302-40', '7891011121302', 40, 3),
('7891011121302-41', '7891011121302', 41, 1),
('7891011121302-42', '7891011121302', 42, 2),
('7891011121303-36', '7891011121303', 36, 5),
('7891011121303-37', '7891011121303', 37, 5),
('7891011121303-38', '7891011121303', 38, 2),
('7891011121304-36', '7891011121304', 36, 3),
('7891011121304-37', '7891011121304', 37, 6),
('7891011121304-38', '7891011121304', 38, 5),
('7891011121304-39', '7891011121304', 39, 2),
('7891011121305-40', '7891011121305', 40, 2),
('7891011121305-41', '7891011121305', 41, 3),
('7891011121305-42', '7891011121305', 42, 3),
('7891011121305-43', '7891011121305', 43, 2),
('7891011121305-44', '7891011121305', 44, 1),
('7891011121306-37', '7891011121306', 37, 1),
('7891011121306-38', '7891011121306', 38, 4),
('7891011121306-39', '7891011121306', 39, 4),
('7891011121306-40', '7891011121306', 40, 2),
('7891011121307-36', '7891011121307', 36, 2),
('7891011121307-38', '7891011121307', 38, 3),
('7891011121307-40', '7891011121307', 40, 5),
('7891011121307-42', '7891011121307', 42, 0),
('7891011121308-38', '7891011121308', 38, 8),
('7891011121308-40', '7891011121308', 40, 6),
('7891011121308-42', '7891011121308', 42, 4),
('7891011121309-36', '7891011121309', 36, 2),
('7891011121309-37', '7891011121309', 37, 3),
('7891011121309-38', '7891011121309', 38, 3),
('7891011121309-39', '7891011121309', 39, 0),
('7891011121310-41', '7891011121310', 41, 1),
('7891011121311-34', '7891011121311', 34, 6),
('7891011121311-35', '7891011121311', 35, 6),
('7891011121311-36', '7891011121311', 36, 5),
('7891011121311-37', '7891011121311', 37, 4),
('7891011121311-38', '7891011121311', 38, 2),
('7891011121312-41', '7891011121312', 41, 4),
('7891011121312-42', '7891011121312', 42, 5),
('7891011121312-43', '7891011121312', 43, 3);

INSERT INTO pasillos (codigo, pasillo) VALUES
('PASILLO-A','A'), ('PASILLO-B','B'), ('PASILLO-C','C'), ('PASILLO-D','D');

INSERT INTO productos_pasillo (codigo_barra, pasillo) VALUES
('7891011121314-39', 'B'),
('7891011121314-40', 'B'),
('7891011121314-41', 'B'),
('7891011121314-42', 'B'),
('7891011121314-43', 'B'),
('7891011121301-38', 'A'),
('7891011121301-39', 'A'),
('7891011121301-40', 'A'),
('7891011121301-41', 'A'),
('7891011121301-42', 'A'),
('7891011121302-40', 'C'),
('7891011121302-41', 'C'),
('7891011121302-42', 'C'),
('7891011121303-36', 'A'),
('7891011121303-37', 'A'),
('7891011121303-38', 'A'),
('7891011121304-36', 'B'),
('7891011121304-37', 'B'),
('7891011121304-38', 'B'),
('7891011121304-39', 'B'),
('7891011121305-40', 'D'),
('7891011121305-41', 'D'),
('7891011121305-42', 'D'),
('7891011121305-43', 'D'),
('7891011121305-44', 'D'),
('7891011121306-37', 'B'),
('7891011121306-38', 'B'),
('7891011121306-39', 'B'),
('7891011121306-40', 'B'),
('7891011121307-36', 'C'),
('7891011121307-38', 'C'),
('7891011121307-40', 'C'),
('7891011121307-42', 'C'),
('7891011121308-38', 'B'),
('7891011121308-40', 'B'),
('7891011121308-42', 'B'),
('7891011121309-36', 'A'),
('7891011121309-37', 'A'),
('7891011121309-38', 'A'),
('7891011121309-39', 'A'),
('7891011121310-41', 'A'),
('7891011121311-34', 'A'),
('7891011121311-35', 'A'),
('7891011121311-36', 'A'),
('7891011121311-37', 'A'),
('7891011121311-38', 'A'),
('7891011121312-41', 'D'),
('7891011121312-42', 'D'),
('7891011121312-43', 'D');

-- CONSULTAR una única variante (no todas las tallas del modelo):
-- SELECT p.nombre, p.marca, t.talla, t.cantidad
-- FROM tallas_inventario t JOIN productos p ON p.sku = t.sku
-- WHERE t.codigo_barra = '7891011121301-40';

-- REGISTRAR entrada de UN par escaneado, atómicamente:
-- UPDATE tallas_inventario SET cantidad = cantidad + 1
-- WHERE codigo_barra = '7891011121301-40'
-- RETURNING codigo_barra, sku, talla, cantidad;
-- Si devuelve cero filas, el código no existe: mostrar error, no crear producto.
-- Evitar repetir el UPDATE al consultar: la consulta SELECT no modifica stock.

-- CONSULTAR todas las tallas disponibles de un modelo:
-- SELECT talla, cantidad FROM tallas_inventario
-- WHERE sku = '7891011121301' AND cantidad > 0 ORDER BY talla;

-- BODEGA: consultar variantes en un pasillo:
-- SELECT t.codigo_barra, p.nombre, t.talla, t.cantidad
-- FROM productos_pasillo pp
-- JOIN tallas_inventario t ON t.codigo_barra = pp.codigo_barra
-- JOIN productos p ON p.sku = t.sku
-- WHERE pp.pasillo = 'A' ORDER BY p.nombre, t.talla;

-- BODEGA: asociar una variante escaneada al pasillo B sin duplicar:
-- INSERT INTO productos_pasillo (codigo_barra, pasillo)
-- VALUES ('7891011121301-40', 'B') ON CONFLICT DO NOTHING;
