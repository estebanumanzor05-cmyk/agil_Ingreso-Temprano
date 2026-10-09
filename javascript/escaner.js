/* =====================================================================
   LECTOR DE CÓDIGOS DE BARRA CON LA CÁMARA
   Usa la librería ZXing (@zxing/library) para decodificar Code 128.

   Cómo funciona:
   1. Abre la cámara trasera del celular en HD y la muestra en un <video>.
   2. Unas 8 veces por segundo copia la franja central del video
      (la zona marcada en pantalla) a un canvas, a resolución completa.
   3. ZXing busca un código de barra en ese canvas. Si lo encuentra,
      llama a la función alLeer(texto).

   Uso:
     const escaner = new EscanerCodigos(document.getElementById('reader'));
     escaner.iniciar((texto) => { ... }).catch((error) => { ... });
     escaner.detener();
   ===================================================================== */

// Zona de lectura: porcentaje del video, centrada (debe coincidir con .zona-lectura en el CSS)
const ZONA_ANCHO = 0.9;
const ZONA_ALTO = 0.4;
const MILISEGUNDOS_ENTRE_LECTURAS = 120;

class EscanerCodigos {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.stream = null;
        this.temporizador = null;
        this.sesion = 0; // cambia en cada iniciar/detener, para descartar arranques cancelados

        // Video de la cámara (playsinline y muted son necesarios en iPhone)
        this.video = document.createElement('video');
        this.video.setAttribute('playsinline', '');
        this.video.muted = true;
        this.video.className = 'video-camara';

        // Recuadro que indica dónde poner el código, con la línea láser
        const zona = document.createElement('div');
        zona.className = 'zona-lectura';
        zona.innerHTML = '<div class="laser"></div>';

        contenedor.append(this.video, zona);

        // Canvas oculto donde se copia la franja central de cada cuadro
        this.canvas = document.createElement('canvas');
        this.contexto = this.canvas.getContext('2d', { willReadFrequently: true });

        // ZXing configurado solo para Code 128 (zapatos y pasillos)
        const pistas = new Map();
        pistas.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.CODE_128]);
        pistas.set(ZXing.DecodeHintType.TRY_HARDER, true);
        this.lector = new ZXing.MultiFormatReader();
        this.lector.setHints(pistas);
    }

    async iniciar(alLeer) {
        this.detener();
        const miSesion = ++this.sesion;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // Pasa cuando la página no se abre con https:// ni desde localhost
            const error = new Error('Cámara no disponible');
            error.name = 'InsecureContextError';
            throw error;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: { ideal: 'environment' }, // cámara trasera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        // Si el usuario canceló mientras se pedía la cámara, se apaga de una vez
        if (miSesion !== this.sesion) {
            stream.getTracks().forEach((pista) => pista.stop());
            return;
        }

        this.stream = stream;
        this.video.srcObject = stream;
        try {
            await this.video.play();
        } catch (error) {
            if (miSesion !== this.sesion) return; // se canceló mientras arrancaba
            throw error;
        }
        if (miSesion !== this.sesion) return;
        this.contenedor.classList.add('camara-activa');

        const buscar = () => {
            if (miSesion !== this.sesion) return; // ya se detuvo

            const texto = this.leerCuadro();
            if (texto !== null) {
                alLeer(texto);
            }
            if (miSesion === this.sesion) {
                this.temporizador = setTimeout(buscar, MILISEGUNDOS_ENTRE_LECTURAS);
            }
        };
        buscar();
    }

    // Busca un código en el cuadro actual del video. Devuelve el texto o null.
    leerCuadro() {
        const anchoVideo = this.video.videoWidth;
        const altoVideo = this.video.videoHeight;
        if (!anchoVideo || !altoVideo) return null; // el video aún no tiene imagen

        // Franja central, a la resolución real de la cámara
        const ancho = Math.round(anchoVideo * ZONA_ANCHO);
        const alto = Math.round(altoVideo * ZONA_ALTO);
        const x = Math.round((anchoVideo - ancho) / 2);
        const y = Math.round((altoVideo - alto) / 2);

        if (this.canvas.width !== ancho || this.canvas.height !== alto) {
            this.canvas.width = ancho;
            this.canvas.height = alto;
        }
        this.contexto.drawImage(this.video, x, y, ancho, alto, 0, 0, ancho, alto);

        try {
            const imagen = new ZXing.BinaryBitmap(
                new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(this.canvas))
            );
            return this.lector.decodeWithState(imagen).getText();
        } catch (error) {
            // Lo normal: en este cuadro no hay un código legible
            return null;
        }
    }

    detener() {
        this.sesion++;
        clearTimeout(this.temporizador);
        this.temporizador = null;

        if (this.stream) {
            this.stream.getTracks().forEach((pista) => pista.stop());
            this.stream = null;
        }
        this.video.pause();
        this.video.srcObject = null;
        this.contenedor.classList.remove('camara-activa');
    }
}
