// Asegúrate de usar la URL de tu proyecto
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxLgQItcfeq9SW1j70jPBy_LCdEmmsAptXRmVoH8rmCVJiEf8LCGZ2--SyknXr9ayFAvA/exec';

const authContainer = document.getElementById('authContainer');
const vistaRegistro = document.getElementById('vistaRegistro');
const vistaLogin = document.getElementById('vistaLogin');
const seccionQR = document.getElementById('seccionQR');
const imagenQR = document.getElementById('imagenQR');
const mensaje = document.getElementById('mensajeSistema');
const textoBienvenida = document.getElementById('textoBienvenida');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

const dominiosErroneos = ['htomail.com', 'hotmial.com', 'homail.com', 'gnail.com', 'gamil.com', 'gmai.com', 'outlok.com', 'yaho.com', 'yahooo.com'];

document.getElementById('tabRegistro').addEventListener('click', () => cambiarVista('registro'));
document.getElementById('tabLogin').addEventListener('click', () => cambiarVista('login'));

function cambiarVista(vista) {
    mensaje.classList.add('oculto');
    if (vista === 'registro') {
        document.getElementById('tabRegistro').classList.add('active');
        document.getElementById('tabLogin').classList.remove('active');
        vistaRegistro.classList.remove('oculto');
        vistaLogin.classList.add('oculto');
    } else {
        document.getElementById('tabLogin').classList.add('active');
        document.getElementById('tabRegistro').classList.remove('active');
        vistaLogin.classList.remove('oculto');
        vistaRegistro.classList.add('oculto');
    }
}

function validarDominioCorreo(correo) {
    const dominio = correo.split('@')[1];
    if (dominiosErroneos.includes(dominio)) {
        return dominio;
    }
    return null;
}

function actualizarEstadisticas(visitas, bebida, alimento) {
    document.getElementById('statVisitas').textContent = visitas;
    document.getElementById('statBebida').textContent = bebida;
    document.getElementById('statAlimento').textContent = alimento;
    document.getElementById('estadisticasCliente').classList.remove('oculto');
}

// 1. REVISAR MEMORIA Y SINCRONIZAR ESTADÍSTICAS AL ABRIR LA PÁGINA
window.onload = async function() {
    const idGuardado = localStorage.getItem('ocasoQR');
    const nombreGuardado = localStorage.getItem('ocasoNombre');
    
    if (idGuardado) {
        // Mostramos el QR de inmediato para no hacer esperar al cliente
        mostrarQR(idGuardado, nombreGuardado);

        // Pedimos las estadísticas a la base de datos en segundo plano
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: 'sync', idCliente: idGuardado })
            });
            const data = await response.json();
            if (data.estatus === 'exito') {
                actualizarEstadisticas(data.visitas, data.bebida, data.alimento);
            }
        } catch (e) {
            console.log("No se pudieron cargar las estadísticas actualizadas.");
        }
    }
};

function mostrarQR(idCliente, nombreUsuario = "") {
    authContainer.classList.add('oculto');
    mensaje.classList.add('oculto');
    
    if(nombreUsuario) {
        const primerNombre = nombreUsuario.split(" ")[0];
        textoBienvenida.textContent = `¡Hola, ${primerNombre}!`;
        btnCerrarSesion.textContent = `¿No eres ${primerNombre}? Cambiar de cuenta`;
    } else {
        textoBienvenida.textContent = `Tu Código de Acceso`;
        btnCerrarSesion.textContent = `¿No eres tú? Cambiar de cuenta`;
    }
    
    const urlQR = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${idCliente}&color=1B1B19&bgcolor=F7F1E8`;
    imagenQR.src = urlQR;
    seccionQR.classList.remove('oculto');
}

// 2. FORMULARIO DE REGISTRO
document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const btn = document.getElementById('btnRegistrar');
    mensaje.classList.add('oculto');

    const correoIngresado = document.getElementById('correo').value.trim().toLowerCase();
    const dominioMalo = validarDominioCorreo(correoIngresado);
    if (dominioMalo) {
        mostrarError(`Parece que hay un error de dedo en "@${dominioMalo}". Por favor revisa tu correo.`);
        return; 
    }

    btn.disabled = true;
    btn.textContent = 'CREANDO ACCESO...';

    const idGenerado = "OCA-" + new Date().getTime();
    const nombre = document.getElementById('nombre').value;

    const formData = {
        accion: 'registro',
        idCliente: idGenerado,
        nombre: nombre,
        correo: correoIngresado,
        telefono: document.getElementById('telefono').value
    };

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(formData)
        });

        localStorage.setItem('ocasoQR', idGenerado);
        localStorage.setItem('ocasoNombre', nombre);
        
        mostrarQR(idGenerado, nombre);
        // Al ser nuevo registro, las estadísticas son 0
        actualizarEstadisticas(0, "Ninguna", "Ninguno");

    } catch (error) {
        mostrarError('Hubo un error. Intenta de nuevo.');
        btn.disabled = false;
        btn.textContent = 'ORDENAR';
    }
});

// 3. FORMULARIO DE LOGIN
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const btn = document.getElementById('btnLogin');
    mensaje.classList.add('oculto');

    const correoIngresado = document.getElementById('correoLogin').value.trim().toLowerCase();

    btn.disabled = true;
    btn.textContent = 'BUSCANDO...';

    const formData = {
        accion: 'login',
        correo: correoIngresado
    };

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();

        if (data.estatus === 'exito') {
            localStorage.setItem('ocasoQR', data.idCliente);
            localStorage.setItem('ocasoNombre', data.nombre);
            mostrarQR(data.idCliente, data.nombre);
            // Sincronizamos las estadísticas devueltas por Google Sheets
            actualizarEstadisticas(data.visitas, data.bebida, data.alimento);
        } else {
            mostrarError(data.mensaje);
            btn.disabled = false;
            btn.textContent = 'RECUPERAR QR';
        }

    } catch (error) {
        mostrarError('Error de conexión.');
        btn.disabled = false;
        btn.textContent = 'RECUPERAR QR';
    }
});

// 4. BOTÓN PARA CAMBIAR DE CUENTA
btnCerrarSesion.addEventListener('click', function() {
    localStorage.removeItem('ocasoQR');
    localStorage.removeItem('ocasoNombre');
    location.reload(); 
});

function mostrarError(texto) {
    mensaje.textContent = texto;
    mensaje.style.color = '#721c24';
    mensaje.classList.remove('oculto');
}