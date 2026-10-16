"""Genera PNG Code 128 por MODELO+TALLA y por pasillo.
Instalar: pip install python-barcode pillow
Ejecutar desde cualquier carpeta: python generar_codigos_barra.py
"""
import re
from pathlib import Path
import barcode
from barcode.writer import ImageWriter
BASE = Path(__file__).resolve().parent
SQL = BASE / "mock_data_sprint1.sql"

def codigos(tabla):
    contenido = SQL.read_text(encoding="utf-8")
    patron = rf"INSERT INTO {tabla}\s*\([^;]*?VALUES\s*(.*?);"
    bloque = re.search(patron, contenido, re.S | re.I)
    if not bloque:
        raise ValueError(f"No se encontró INSERT para {tabla}")
    return list(dict.fromkeys(re.findall(r"\(\s*'([^']+)'", bloque.group(1))))

def generar(lista, carpeta):
    carpeta.mkdir(parents=True, exist_ok=True)
    for archivo in carpeta.glob("*.png"):
        archivo.unlink()  # evita códigos antiguos del modelo sin talla
    tipo = barcode.get_barcode_class("code128")
    for codigo in lista:
        tipo(codigo, writer=ImageWriter()).save(str(carpeta / codigo))
    print(f"{len(lista)} códigos generados en {carpeta}")

if __name__ == "__main__":
    generar(codigos("tallas_inventario"), BASE / "codigos_barra")
    generar(codigos("pasillos"), BASE / "codigos_pasillos")
