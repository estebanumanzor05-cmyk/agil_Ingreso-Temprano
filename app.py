"""
Servidor de ADOC Inventario (Flask).

- Sirve la página (index.html, css, javascript, img).
- Expone la API del inventario en /api/inventario.

Dónde se guardan los datos (ADR 06):
- Si existe la variable de entorno DATABASE_URL (en Render), se usa
  PostgreSQL: los datos sobreviven a reinicios y redespliegues y son los
  mismos para todos los dispositivos.
- Si no existe (en la computadora o en las pruebas), se usa un archivo
  SQLite local.

La base arranca VACÍA: solo se crean las tablas y los 4 pasillos.
Los nombres de los modelos los conoce la página por datos.js
(CATALOGO_MODELOS); no se cargan existencias de prueba.
"""
import os
import re
import sqlite3

import click
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['DATABASE_URL'] = os.environ.get('DATABASE_URL', '')
app.config['DB_PATH'] = os.environ.get('DB_PATH', 'inventario.db')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def no_cache(resp):
    resp.headers['Cache-Control'] = 'no-cache, must-revalidate'
    return resp

DB_PATH = app.config['DB_PATH']

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Si la base de datos aún no existe en el servidor, la crea e inserta el mock_data_sprint1.sql
    if not os.path.exists(DB_PATH):
        conn = get_db()
        with open('mock_data_sprint1.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
        conn.executescript(sql_script)
        conn.commit()
        conn.close()

init_db()

# 1. Servir la aplicación web (index.html y carpetas css, javascript, img)
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

PASILLOS = ['A', 'B', 'C', 'D']
PATRON_SKU = re.compile(r'^\d{13}$')

ESQUEMA = [
    """CREATE TABLE IF NOT EXISTS productos (
        sku    VARCHAR(20)  PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        marca  VARCHAR(50)  NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS tallas_inventario (
        codigo_barra VARCHAR(40) PRIMARY KEY,
        sku          VARCHAR(20) NOT NULL REFERENCES productos(sku),
        talla        INT         NOT NULL,
        cantidad     INT         NOT NULL DEFAULT 0 CHECK (cantidad >= 0)
    )""",
    """CREATE TABLE IF NOT EXISTS pasillos (
        codigo  VARCHAR(20) PRIMARY KEY,
        pasillo CHAR(1)     NOT NULL UNIQUE
    )""",
    """CREATE TABLE IF NOT EXISTS productos_pasillo (
        codigo_barra VARCHAR(40) NOT NULL REFERENCES tallas_inventario(codigo_barra),
        pasillo      CHAR(1)     NOT NULL REFERENCES pasillos(pasillo),
        PRIMARY KEY (codigo_barra, pasillo)
    )""",
]

# Bases ya preparadas en este proceso (para crear las tablas una sola vez)
_bases_listas = set()


# ---------------------------------------------------------------------
# CONEXIÓN
# ---------------------------------------------------------------------
class Conexion:
    """Envuelve SQLite o PostgreSQL con la misma forma de uso.

    Las consultas se escriben con '?' y aquí se adaptan a '%s' si la base
    es PostgreSQL. Las filas se leen como diccionarios: fila['sku'].
    """

    def __init__(self):
        url = app.config['DATABASE_URL']
        if url:
            import psycopg
            from psycopg.rows import dict_row
            self.es_postgres = True
            self.conn = psycopg.connect(url, row_factory=dict_row)
        else:
            self.es_postgres = False
            self.conn = sqlite3.connect(app.config['DB_PATH'])
            self.conn.row_factory = sqlite3.Row

    def ejecutar(self, sql, parametros=()):
        if self.es_postgres:
            sql = sql.replace('?', '%s')
        return self.conn.execute(sql, parametros)

    def __enter__(self):
        return self

    def __exit__(self, tipo, error, traza):
        if tipo is None:
            self.conn.commit()
        else:
            self.conn.rollback()
        self.conn.close()


def conectar():
    """Abre la base y crea las tablas la primera vez."""
    con = Conexion()
    clave = app.config['DATABASE_URL'] or app.config['DB_PATH']
    if clave not in _bases_listas:
        for sentencia in ESQUEMA:
            con.ejecutar(sentencia)
        for letra in PASILLOS:
            con.ejecutar(
                'INSERT INTO pasillos (codigo, pasillo) VALUES (?, ?) ON CONFLICT DO NOTHING',
                ('PASILLO-' + letra, letra),
            )
        con.conn.commit()
        _bases_listas.add(clave)
    return con


# ---------------------------------------------------------------------
# LECTURA
# ---------------------------------------------------------------------
def leer_inventario(con):
    """Devuelve el inventario con la forma que usa la página:
    { productos: { sku: {nombre, marca, tallas: [{talla, cantidad}]} },
      productosPasillo: [{codigo_barra, pasillo}] }"""
    productos = {}
    for p in con.ejecutar('SELECT sku, nombre, marca FROM productos ORDER BY sku'):
        productos[p['sku']] = {'nombre': p['nombre'], 'marca': p['marca'], 'tallas': []}

    for t in con.ejecutar('SELECT sku, talla, cantidad FROM tallas_inventario ORDER BY talla'):
        if t['sku'] in productos:
            productos[t['sku']]['tallas'].append({'talla': t['talla'], 'cantidad': t['cantidad']})

    productos_pasillo = [
        {'codigo_barra': r['codigo_barra'], 'pasillo': r['pasillo']}
        for r in con.ejecutar('SELECT codigo_barra, pasillo FROM productos_pasillo ORDER BY codigo_barra')
    ]
    return {'productos': productos, 'productosPasillo': productos_pasillo}


# ---------------------------------------------------------------------
# VALIDACIÓN DE LOS CAMBIOS
# ---------------------------------------------------------------------
class CambioInvalido(ValueError):
    pass


def _lista(datos, clave):
    valor = datos.get(clave, [])
    if not isinstance(valor, list):
        raise CambioInvalido(clave + ' debe ser una lista')
    return valor


def _sku(valor):
    if not isinstance(valor, str) or not PATRON_SKU.match(valor):
        raise CambioInvalido('SKU inválido: ' + repr(valor))
    return valor


def _entero(valor, nombre, minimo=None, maximo=None):
    if isinstance(valor, bool) or not isinstance(valor, int):
        raise CambioInvalido(nombre + ' debe ser un número entero')
    if (minimo is not None and valor < minimo) or (maximo is not None and valor > maximo):
        raise CambioInvalido(nombre + ' fuera de rango')
    return valor


def _codigo(valor):
    if not isinstance(valor, str) or '-' not in valor:
        raise CambioInvalido('Código inválido: ' + repr(valor))
    sku, talla = valor.rsplit('-', 1)
    _sku(sku)
    if not talla.isdigit():
        raise CambioInvalido('Código inválido: ' + repr(valor))
    return valor


def _texto(valor, nombre, maximo):
    if not isinstance(valor, str) or not valor.strip() or len(valor) > maximo:
        raise CambioInvalido(nombre + ' inválido')
    return valor.strip()


# ---------------------------------------------------------------------
# ESCRITURA: se aplican solo los CAMBIOS, nunca se reemplaza todo
# ---------------------------------------------------------------------
def aplicar_cambios(con, datos):
    """Aplica los cambios que manda la página, dentro de una transacción.

    Formato (todas las listas son opcionales):
      productos:          [{sku, nombre, marca}]      crear o actualizar el modelo
      tallas:             [{sku, talla, delta}]       sumar o restar pares (nunca baja de 0)
      tallasEliminadas:   ["SKU-talla"]               borrar la talla
      productosEliminados:["SKU"]                     borrar el modelo con sus tallas
      pasillosAgregados:  [{codigo_barra, pasillo}]   ubicar una talla en un pasillo
      pasillosQuitados:   [{codigo_barra, pasillo}]   quitar esa ubicación

    Como se suma o resta sobre lo que YA está en la base, dos dispositivos
    que guardan casi al mismo tiempo no se borran los cambios entre sí.
    """
    if not isinstance(datos, dict):
        raise CambioInvalido('Se esperaba un objeto JSON')

    # 1. Ubicaciones que se quitan (antes de borrar tallas o modelos)
    for r in _lista(datos, 'pasillosQuitados'):
        con.ejecutar('DELETE FROM productos_pasillo WHERE codigo_barra = ? AND pasillo = ?',
                     (_codigo(r.get('codigo_barra')), r.get('pasillo')))

    # 2. Tallas y modelos que se borran
    for codigo in _lista(datos, 'tallasEliminadas'):
        codigo = _codigo(codigo)
        con.ejecutar('DELETE FROM productos_pasillo WHERE codigo_barra = ?', (codigo,))
        con.ejecutar('DELETE FROM tallas_inventario WHERE codigo_barra = ?', (codigo,))

    for sku in _lista(datos, 'productosEliminados'):
        sku = _sku(sku)
        con.ejecutar('DELETE FROM productos_pasillo WHERE codigo_barra LIKE ?', (sku + '-%',))
        con.ejecutar('DELETE FROM tallas_inventario WHERE sku = ?', (sku,))
        con.ejecutar('DELETE FROM productos WHERE sku = ?', (sku,))

    # 3. Modelos nuevos o actualizados
    for p in _lista(datos, 'productos'):
        con.ejecutar(
            """INSERT INTO productos (sku, nombre, marca) VALUES (?, ?, ?)
               ON CONFLICT (sku) DO UPDATE SET nombre = excluded.nombre, marca = excluded.marca""",
            (_sku(p.get('sku')), _texto(p.get('nombre'), 'Nombre', 100), _texto(p.get('marca'), 'Marca', 50)),
        )

    # 4. Pares que se suman o restan (la cantidad nunca queda negativa)
    for t in _lista(datos, 'tallas'):
        sku = _sku(t.get('sku'))
        talla = _entero(t.get('talla'), 'Talla', 0, 99)
        delta = _entero(t.get('delta'), 'Delta', -10000, 10000)
        existe = con.ejecutar('SELECT 1 FROM productos WHERE sku = ?', (sku,)).fetchone()
        if not existe:
            raise CambioInvalido('El modelo ' + sku + ' no existe')
        con.ejecutar(
            """INSERT INTO tallas_inventario (codigo_barra, sku, talla, cantidad)
               VALUES (?, ?, ?, ?)
               ON CONFLICT (codigo_barra) DO UPDATE SET cantidad =
                   CASE WHEN tallas_inventario.cantidad + ? < 0 THEN 0
                        ELSE tallas_inventario.cantidad + ? END""",
            (f'{sku}-{talla}', sku, talla, max(0, delta), delta, delta),
        )

    # 5. Ubicaciones nuevas
    for r in _lista(datos, 'pasillosAgregados'):
        codigo = _codigo(r.get('codigo_barra'))
        pasillo = r.get('pasillo')
        if pasillo not in PASILLOS:
            raise CambioInvalido('Pasillo inválido: ' + repr(pasillo))
        if con.ejecutar('SELECT 1 FROM tallas_inventario WHERE codigo_barra = ?', (codigo,)).fetchone():
            con.ejecutar(
                'INSERT INTO productos_pasillo (codigo_barra, pasillo) VALUES (?, ?) ON CONFLICT DO NOTHING',
                (codigo, pasillo),
            )


# ---------------------------------------------------------------------
# RUTAS
# ---------------------------------------------------------------------
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/inventario', methods=['GET'])
def obtener_inventario():
    with conectar() as con:
        respuesta = jsonify(leer_inventario(con))
    respuesta.headers['Cache-Control'] = 'no-store'  # el celular no debe guardar una copia vieja
    return respuesta


@app.route('/api/inventario/cambios', methods=['POST'])
def guardar_cambios():
    datos = request.get_json(silent=True)
    try:
        with conectar() as con:
            aplicar_cambios(con, datos)
            inventario = leer_inventario(con)
    except CambioInvalido as error:
        return jsonify({'ok': False, 'mensaje': str(error)}), 400
    respuesta = jsonify({'ok': True, **inventario})
    respuesta.headers['Cache-Control'] = 'no-store'
    return respuesta


# ---------------------------------------------------------------------
# COMANDO PARA VACIAR LA BASE (antes de la Feria)
#   flask --app app vaciar-inventario
# Con DATABASE_URL definida, vacía la base de Render.
# ---------------------------------------------------------------------
@app.cli.command('vaciar-inventario')
def vaciar_inventario():
    """Borra todos los modelos, tallas y ubicaciones. Deja los 4 pasillos."""
    with conectar() as con:
        con.ejecutar('DELETE FROM productos_pasillo')
        con.ejecutar('DELETE FROM tallas_inventario')
        con.ejecutar('DELETE FROM productos')
    click.echo('Inventario vacío.')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
