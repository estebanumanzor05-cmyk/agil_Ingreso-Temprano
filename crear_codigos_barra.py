import re
from pathlib import Path

import barcode
from barcode.writer import ImageWriter

ARCHIVO_SQL = Path("mock_data_sprint1.sql")
CARPETA_PRODUCTOS = Path("codigos_barra")
CARPETA_PASILLOS = Path("codigos_pasillos")


def leer_codigos(ruta_sql, tabla):
    """Extrae el primer texto de cada fila del INSERT INTO <tabla>, en orden."""
    texto = ruta_sql.read_text(encoding="utf-8")
    bloque = re.search(rf"INSERT INTO {tabla}\b.*?;", texto, re.S | re.I)
    if not bloque:
        raise SystemExit(f"No se encontró 'INSERT INTO {tabla}' en el archivo SQL.")
    # El código es el primer texto entre comillas de cada fila: ('CODIGO', ...)
    codigos = re.findall(r"\(\s*'([^']+)'", bloque.group(0))
    return list(dict.fromkeys(codigos))  # quita repetidos conservando el orden


def generar(codigos, carpeta):
    carpeta.mkdir(exist_ok=True)
    # Code 128 admite letras, números y guion (EAN-13 solo admite números)
    code128 = barcode.get_barcode_class("code128")
    for codigo in codigos:
        imagen = code128(codigo, writer=ImageWriter())
        ruta = imagen.save(str(carpeta / codigo))
        print(f"Generado: {ruta}")
    print(f"-> {len(codigos)} códigos en '{carpeta}/'\n")


def main():
    generar(leer_codigos(ARCHIVO_SQL, "productos"), CARPETA_PRODUCTOS)
    generar(leer_codigos(ARCHIVO_SQL, "pasillos"), CARPETA_PASILLOS)
    print("Listo.")


if __name__ == "__main__":
    main()