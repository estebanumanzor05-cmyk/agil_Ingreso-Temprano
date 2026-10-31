"""
Pruebas de la API del inventario (HU Inventario persistente y sincronizado).
Ver docs/especificaciones/HU-inventario-persistente.md

Corren con SQLite en un archivo temporal. Si existe la variable
TEST_DATABASE_URL, también corren contra ese PostgreSQL.
"""
import os

import pytest

import app as servidor

SKU = '7891011121305'   # Bota Trabajo Industrial (está en el catálogo)
SKU2 = '7891011121301'  # Tenis Runner Pro

BASES = ['sqlite']
if os.environ.get('TEST_DATABASE_URL'):
    BASES.append('postgres')


@pytest.fixture(params=BASES)
def base(request, tmp_path):
    """Prepara una base nueva y vacía. Devuelve una función que crea
    'dispositivos' (clientes) contra esa base."""
    servidor._bases_listas.clear()
    if request.param == 'postgres':
        url = os.environ['TEST_DATABASE_URL']
        import psycopg
        with psycopg.connect(url, autocommit=True) as con:
            con.execute('DROP TABLE IF EXISTS productos_pasillo, tallas_inventario, pasillos, productos')
        servidor.app.config.update(DATABASE_URL=url)
    else:
        servidor.app.config.update(DATABASE_URL='', DB_PATH=str(tmp_path / 'inventario.db'))
    servidor.app.config['TESTING'] = True
    yield servidor.app.test_client
    servidor._bases_listas.clear()


def entrada(sku, talla, pares, nombre='Bota Trabajo Industrial', marca='Timberland'):
    """Lo que manda Bodega al registrar pares."""
    return {
        'productos': [{'sku': sku, 'nombre': nombre, 'marca': marca}],
        'tallas': [{'sku': sku, 'talla': talla, 'delta': pares}],
    }


def cantidad(inventario, sku, talla):
    fila = [t for t in inventario['productos'][sku]['tallas'] if t['talla'] == talla]
    return fila[0]['cantidad'] if fila else None


# Criterio 1 · Arranca vacío
def test_base_nueva_arranca_vacia(base):
    r = base().get('/api/inventario')
    assert r.status_code == 200
    assert r.get_json() == {'productos': {}, 'productosPasillo': []}


# Criterio 2 · Se guarda: lo registrado se vuelve a leer
def test_lo_registrado_se_lee_despues(base):
    cliente = base()
    r = cliente.post('/api/inventario/cambios', json=entrada(SKU, 40, 2))
    assert r.status_code == 200 and r.get_json()['ok']

    inventario = cliente.get('/api/inventario').get_json()
    assert cantidad(inventario, SKU, 40) == 2
    assert inventario['productos'][SKU]['nombre'] == 'Bota Trabajo Industrial'


# Criterio 3 · Sobrevive a un reinicio del servidor (se simula olvidando la conexión)
def test_sobrevive_al_reinicio(base):
    base().post('/api/inventario/cambios', json=entrada(SKU, 40, 3))
    servidor._bases_listas.clear()  # como si el proceso arrancara de nuevo
    assert cantidad(base().get('/api/inventario').get_json(), SKU, 40) == 3


# Criterios 4 y 5 · Dos dispositivos: se suman, no se pisan
def test_dos_dispositivos_se_suman(base):
    celular_a, celular_b = base(), base()
    celular_a.post('/api/inventario/cambios', json=entrada(SKU, 40, 2))
    celular_b.post('/api/inventario/cambios', json=entrada(SKU, 40, 1))

    inventario = celular_a.get('/api/inventario').get_json()
    assert cantidad(inventario, SKU, 40) == 3


def test_la_respuesta_trae_lo_de_otros_dispositivos(base):
    celular_a, celular_b = base(), base()
    celular_a.post('/api/inventario/cambios', json=entrada(SKU2, 38, 1, 'Tenis Runner Pro', 'Nike'))
    respuesta_b = celular_b.post('/api/inventario/cambios', json=entrada(SKU, 41, 1)).get_json()
    assert SKU2 in respuesta_b['productos']  # B ve lo que registró A


# Criterio 6 · La venta no baja de cero
def test_venta_no_baja_de_cero(base):
    cliente = base()
    cliente.post('/api/inventario/cambios', json=entrada(SKU, 42, 1))
    venta = {'tallas': [{'sku': SKU, 'talla': 42, 'delta': -1}]}
    cliente.post('/api/inventario/cambios', json=venta)
    cliente.post('/api/inventario/cambios', json=venta)  # el otro dispositivo vende el mismo par

    assert cantidad(cliente.get('/api/inventario').get_json(), SKU, 42) == 0


# Criterio 7 · Se guardan el nombre y la marca que manda la página
def test_conserva_nombre_y_marca(base):
    cliente = base()
    cliente.post('/api/inventario/cambios', json=entrada(SKU2, 39, 1, 'Tenis Runner Pro', 'Nike'))
    producto = cliente.get('/api/inventario').get_json()['productos'][SKU2]
    assert (producto['nombre'], producto['marca']) == ('Tenis Runner Pro', 'Nike')


def test_pasillo_se_asigna_y_se_quita(base):
    cliente = base()
    cambio = entrada(SKU, 40, 1)
    cambio['pasillosAgregados'] = [{'codigo_barra': SKU + '-40', 'pasillo': 'C'}]
    cliente.post('/api/inventario/cambios', json=cambio)
    assert cliente.get('/api/inventario').get_json()['productosPasillo'] == [
        {'codigo_barra': SKU + '-40', 'pasillo': 'C'}]

    cliente.post('/api/inventario/cambios', json={
        'pasillosQuitados': [{'codigo_barra': SKU + '-40', 'pasillo': 'C'}]})
    assert cliente.get('/api/inventario').get_json()['productosPasillo'] == []


def test_eliminar_talla_y_producto(base):
    cliente = base()
    cliente.post('/api/inventario/cambios', json=entrada(SKU, 40, 1))
    cliente.post('/api/inventario/cambios', json=entrada(SKU, 41, 1))

    cliente.post('/api/inventario/cambios', json={'tallasEliminadas': [SKU + '-40']})
    tallas = cliente.get('/api/inventario').get_json()['productos'][SKU]['tallas']
    assert [t['talla'] for t in tallas] == [41]

    cliente.post('/api/inventario/cambios', json={'productosEliminados': [SKU]})
    assert cliente.get('/api/inventario').get_json()['productos'] == {}


@pytest.mark.parametrize('cambio', [
    'no es un objeto',
    {'tallas': [{'sku': 'ABC', 'talla': 40, 'delta': 1}]},           # SKU inválido
    {'tallas': [{'sku': SKU, 'talla': 40, 'delta': 1}]},             # el modelo no existe
    {'tallas': [{'sku': SKU, 'talla': 'cuarenta', 'delta': 1}]},     # talla no numérica
    {'pasillosAgregados': [{'codigo_barra': SKU + '-40', 'pasillo': 'Z'}]},
])
def test_rechaza_cambios_invalidos_sin_guardar_nada(base, cambio):
    cliente = base()
    r = cliente.post('/api/inventario/cambios', json=cambio)
    assert r.status_code == 400
    assert cliente.get('/api/inventario').get_json()['productos'] == {}


def test_el_celular_no_guarda_copias_viejas(base):
    assert base().get('/api/inventario').headers['Cache-Control'] == 'no-store'


def test_sirve_la_pagina(base):
    cliente = base()
    assert cliente.get('/').status_code == 200
    assert cliente.get('/javascript/escaner.js').status_code == 200
