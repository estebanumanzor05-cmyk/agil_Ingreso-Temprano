/*REFERENCIAS DE LISTAS Y VARIABLES*/ 
const vistaMenu = document.getElementById('vista-menu');
const vistaEscaner = document.getElementById('vista-escaner');
const vistaResultados = document.getElementById('vista-resultados');
const vistaEscanerBodega = document.getElementById('vista-escaner-bodega');
const toast = document.getElementById('notificacion-toast');

let html5QrcodeScanner; 

/*CAMBIOS DE PANTALLAS*/ 
function mostrarVista(vistaVisible) {
    vistaMenu.classList.add('hidden');
    vistaEscaner.classList.add('hidden');
    vistaResultados.classList.add('hidden');
    vistaEscanerBodega.classList.add('hidden');
    
    vistaVisible.classList.remove('hidden');
}

/*FUNCIONES DE CÁMARA*/
// Agregamos el parámetro idContenedor
function iniciarCamara(idContenedor) {
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
    };

    // La librería ahora usa el ID que le pasemos
    html5QrcodeScanner = new Html5Qrcode(idContenedor);

    html5QrcodeScanner.start(
        { facingMode: "environment" }, 
        config,
        (textoDecodificado) => {
            console.log("Código leído: ", textoDecodificado);
            
            // Muestra el Toast confirmando el escaneo
            toast.querySelector('span').innerText = "Leído: " + textoDecodificado;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('show'), 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.classList.add('hidden'), 300);
            }, 1000);
            if (idContenedor === 'reader') {
                detenerCamara(); 
                mostrarVista(vistaResultados); 
            } else if (idContenedor === 'reader-bodega') {
            }
        },
        (error) => {
        }
    ).catch((err) => {
        console.warn("Error de cámara: ", err);
    });
}

function detenerCamara() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            console.log("Hardware de cámara liberado.");
            html5QrcodeScanner = null;
        }).catch((err) => {
            console.warn("Error al apagar cámara: ", err);
        });
    }
}


/*EVENTOS DE BOTONES*/ 
document.getElementById('btn-zapateria').addEventListener('click', () => {
    mostrarVista(vistaEscaner);
    iniciarCamara('reader'); 
});

document.getElementById('btn-cancelar-escaner').addEventListener('click', () => {
    detenerCamara(); 
    mostrarVista(vistaMenu);
});

document.getElementById('btn-simular-lectura').addEventListener('click', () => {
    detenerCamara();
    mostrarVista(vistaResultados);
});

document.getElementById('btn-nuevo-escaner').addEventListener('click', () => {
    mostrarVista(vistaEscaner);
    iniciarCamara('reader'); 
});

document.getElementById('btn-inicio').addEventListener('click', () => {
    detenerCamara();
    mostrarVista(vistaMenu);
});

/*EVENTOS DE BOTONES*/
document.getElementById('btn-bodega').addEventListener('click', () => {
    mostrarVista(vistaEscanerBodega);
    iniciarCamara('reader-bodega'); 
});

document.getElementById('btn-cancelar-bodega').addEventListener('click', () => {
    detenerCamara();
    mostrarVista(vistaMenu);
});

document.getElementById('btn-guardar-bodega').addEventListener('click', () => {
    toast.querySelector('span').innerText = "¡Inventario del pasillo guardado!";
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
            detenerCamara();
            mostrarVista(vistaMenu);
        }, 300);
    }, 700);
});