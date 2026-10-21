import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')
DB_PATH = 'inventario.db'

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

# 2. Obtener el inventario sincronizado desde la base de datos SQL
@app.route('/api/inventario', methods=['GET'])
def obtener_inventario():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT sku, nombre, marca FROM productos")
    productos_rows = cur.fetchall()

    cur.execute("SELECT sku, talla, cantidad FROM tallas_inventario ORDER BY talla")
    tallas_rows = cur.fetchall()

    cur.execute("SELECT codigo_barra, pasillo FROM productos_pasillo")
    pasillos_rows = cur.fetchall()
    conn.close()

    # Armamos la estructura exacta que espera tu frontend (PRODUCTOS y PRODUCTOS_PASILLO)
    productos = {}
    for p in productos_rows:
        productos[p['sku']] = {
            'nombre': p['nombre'],
            'marca': p['marca'],
            'tallas': []
        }

    for t in tallas_rows:
        if t['sku'] in productos:
            productos[t['sku']]['tallas'].append({
                'talla': t['talla'],
                'cantidad': t['cantidad']
            })

    productos_pasillo = [
        {'codigo_barra': r['codigo_barra'], 'pasillo': r['pasillo']}
        for r in pasillos_rows
    ]

    return jsonify({
        'productos': productos,
        'productosPasillo': productos_pasillo
    })

# 3. Guardar cambios hechos en Bodega o Administrador directamente en SQL
@app.route('/api/inventario', methods=['POST'])
def guardar_inventario():
    data = request.get_json()
    if not data or 'productos' not in data or 'productosPasillo' not in data:
        return jsonify({'ok': False, 'mensaje': 'Datos inválidos'}), 400

    productos = data['productos']
    productos_pasillo = data['productosPasillo']

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM productos_pasillo")
        cur.execute("DELETE FROM tallas_inventario")
        cur.execute("DELETE FROM productos")

        for sku, info in productos.items():
            cur.execute(
                "INSERT INTO productos (sku, nombre, marca) VALUES (?, ?, ?)",
                (sku, info['nombre'], info['marca'])
            )
            for t in info.get('tallas', []):
                codigo_barra = f"{sku}-{t['talla']}"
                cur.execute(
                    "INSERT INTO tallas_inventario (codigo_barra, sku, talla, cantidad) VALUES (?, ?, ?, ?)",
                    (codigo_barra, sku, int(t['talla']), int(t['cantidad']))
                )

        for pp in productos_pasillo:
            cur.execute(
                "INSERT OR IGNORE INTO productos_pasillo (codigo_barra, pasillo) VALUES (?, ?)",
                (pp['codigo_barra'], pp['pasillo'])
            )

        conn.commit()
        return jsonify({'ok': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'ok': False, 'mensaje': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)