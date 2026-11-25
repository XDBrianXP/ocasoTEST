// URL OFICIAL Y EXACTA DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT (ocasocoffeeclub@gmail.com)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrvgCV5POAUIP7oHG51bAkbiKTEen0wj1jVv-JXcEGjfZ86u0rSkPvx79xLXd2LnSv7g/exec";

// INTERRUPTOR DE FUNCIÓN (Feature Flag):
// false = oculto en registro y perfil (envía "Ninguna" por defecto a Sheets)
// true  = visible y editable en registro y en "Tu Ritual de Consumo"
const HABILITAR_PREFERENCIAS_CONSUMO = false;

// CATÁLOGO VISUAL DEL MENÚ (carpeta /menu)
const MENU_ITEMS = [
    { src: "menu/01-bebidas-precios.jpeg", titulo: "Menú de Bebidas", etiqueta: "Precios" },
    { src: "menu/02-alimentos-precios.jpeg", titulo: "Menú de Alimentos", etiqueta: "Precios" },
    { src: "menu/03-coffee-classics.jpeg", titulo: "Coffee Classics", etiqueta: "Fotos" },
    { src: "menu/04-coffee-creations.jpeg", titulo: "Coffee Creations", etiqueta: "Fotos" },
    { src: "menu/05-beyond-coffee.jpeg", titulo: "Beyond Coffee", etiqueta: "Fotos" },
    { src: "menu/06-dirty-functional.jpeg", titulo: "Dirty & Functional", etiqueta: "Fotos" },
    { src: "menu/07-alimentos-fotos.jpeg", titulo: "Alimentos", etiqueta: "Fotos" }
];

let filtroFechaInicializado = false;
let ticketsSeleccionados = new Set();
let ultimoFiltroKey = "";
let vistaClubPublica = "register"; // "register" | "login"

// Estado del Lightbox
let lightboxListaActual = MENU_ITEMS;
let lightboxIndiceActual = 0;

document.addEventListener('DOMContentLoaded', () => {
    const btnOpenModal = document.getElementById('btnOpenModal');
    const privacyModal = document.getElementById('privacyModal');
    const acceptPrivacy = document.getElementById('acceptPrivacy');
    const btnAcceptPrivacy = document.getElementById('btnAcceptPrivacy');
    const btnRejectPrivacy = document.getElementById('btnRejectPrivacy');
    
    const publicTabBtns = document.querySelectorAll('.public-tab-btn');
    const btnMenuToRegister = document.getElementById('btnMenuToRegister');

    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');
    const dashboardView = document.getElementById('dashboard-view');
    const btnLoginSubmit = document.getElementById('btnLoginSubmit');
    const btnLogout = document.getElementById('btnLogout');
    
    const grupoPreferenciasRegistro = document.getElementById('grupoPreferenciasRegistro');
    const bloqueNotasBarista = document.getElementById('bloqueNotasBarista');
    const selectPreferenciasRegistro = document.getElementById('alergias');

    const btnToggleEditNotas = document.getElementById('btnToggleEditNotas');
    const editNotasContainer = document.getElementById('editNotasContainer');
    const btnCancelEditNotas = document.getElementById('btnCancelEditNotas');
    const btnUpdatePrefs = document.getElementById('btnUpdatePrefs');

    const filterFechaInicio = document.getElementById('filterFechaInicio');
    const filterFechaFin = document.getElementById('filterFechaFin');
    const btnVerTodosTickets = document.getElementById('btnVerTodosTickets');
    const chkSelectAllTickets = document.getElementById('chkSelectAllTickets');
    const ticketsList = document.getElementById('ticketsList');
    const btnSendEmailPDF = document.getElementById('btnSendEmailPDF');

    // Inicializar galerías del menú (pública y dashboard) + Lightbox
    renderizarGaleriaMenu('publicMenuGallery');
    renderizarGaleriaMenu('dashboardMenuGallery');
    inicializarLightbox();

    // Aplicar estado del interruptor de preferencias al iniciar
    if (grupoPreferenciasRegistro) {
        grupoPreferenciasRegistro.style.display = HABILITAR_PREFERENCIAS_CONSUMO ? 'block' : 'none';
    }
    if (bloqueNotasBarista) {
        bloqueNotasBarista.style.display = HABILITAR_PREFERENCIAS_CONSUMO ? 'block' : 'none';
    }
    if (selectPreferenciasRegistro) {
        selectPreferenciasRegistro.required = HABILITAR_PREFERENCIAS_CONSUMO;
        if (!HABILITAR_PREFERENCIAS_CONSUMO) {
            selectPreferenciasRegistro.value = 'Ninguna';
        }
    }

    // Control de navegación pública (Club de Socios vs Menú)
    publicTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-public-target');
            if (target === 'menu') {
                mostrarVistaPublica('menu');
            } else {
                mostrarVistaPublica(vistaClubPublica);
            }
        });
    });

    if (btnMenuToRegister) {
        btnMenuToRegister.addEventListener('click', () => {
            vistaClubPublica = 'register';
            mostrarVistaPublica('register');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Verificar sesión activa previa y sincronizar con Google Sheets
    const savedUser = localStorage.getItem('ocaso_user');
    const abrirMenuDirecto = window.location.hash.toLowerCase() === '#menu';

    if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        mostrarDashboard(parsedUser);
        if (abrirMenuDirecto) {
            activarPestanaDashboard('tab-menu');
        }
        if (parsedUser.email) {
            sincronizarDatosCliente(parsedUser.email);
        }
    } else if (abrirMenuDirecto) {
        mostrarVistaPublica('menu');
    } else {
        mostrarVistaPublica('register');
    }

    // Permitir abrir #menu en caliente si cambia el hash
    window.addEventListener('hashchange', () => {
        if (window.location.hash.toLowerCase() === '#menu') {
            if (localStorage.getItem('ocaso_user')) {
                activarPestanaDashboard('tab-menu');
            } else {
                mostrarVistaPublica('menu');
            }
        }
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        vistaClubPublica = 'login';
        mostrarVistaPublica('login');
    });

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        vistaClubPublica = 'register';
        mostrarVistaPublica('register');
    });

    btnOpenModal.addEventListener('click', () => {
        const nombre = document.getElementById('nombre').value.trim();
        const emailUser = document.getElementById('emailUser').value.trim();
        const emailDomain = document.getElementById('emailDomain').value;
        const confirmEmailUser = document.getElementById('confirmEmailUser').value.trim();
        const confirmEmailDomain = document.getElementById('confirmEmailDomain').value;
        const alergias = HABILITAR_PREFERENCIAS_CONSUMO
            ? document.getElementById('alergias').value
            : 'Ninguna';

        if (!nombre || !emailUser || !emailDomain || !confirmEmailUser || !confirmEmailDomain || (HABILITAR_PREFERENCIAS_CONSUMO && !alergias)) {
            alert('Por favor completa todos los campos obligatorios (*).');
            return;
        }

        const email = `${emailUser}@${emailDomain}`;
        const confirmEmail = `${confirmEmailUser}@${confirmEmailDomain}`;

        if (email !== confirmEmail) {
            alert('Los correos electrónicos no coinciden.');
            return;
        }

        privacyModal.style.display = 'flex';
    });

    acceptPrivacy.addEventListener('change', (e) => {
        btnAcceptPrivacy.disabled = !e.target.checked;
    });

    btnRejectPrivacy.addEventListener('click', () => {
        privacyModal.style.display = 'none';
        alert('Debes aceptar el aviso de privacidad para completar tu registro en Ocaso Club.');
    });

    btnAcceptPrivacy.addEventListener('click', () => {
        privacyModal.style.display = 'none';
        ejecutarRegistroCliente();
    });

    // ABRIR Y CERRAR EDICIÓN DE NOTAS (activo solo cuando el interruptor está en true)
    if (btnToggleEditNotas) {
        btnToggleEditNotas.addEventListener('click', (e) => {
            e.preventDefault();
            editNotasContainer.style.display = editNotasContainer.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (btnCancelEditNotas) {
        btnCancelEditNotas.addEventListener('click', () => {
            editNotasContainer.style.display = 'none';
        });
    }

    // EVENTOS DE FILTRADO DE FECHAS PARA TICKETS
    filterFechaInicio.addEventListener('change', () => {
        const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        renderizarTickets(currentUser.tickets || []);
    });

    filterFechaFin.addEventListener('change', () => {
        const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        renderizarTickets(currentUser.tickets || []);
    });

    btnVerTodosTickets.addEventListener('click', (e) => {
        e.preventDefault();
        filterFechaInicio.value = '';
        filterFechaFin.value = '';
        const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        renderizarTickets(currentUser.tickets || []);
    });

    // SELECCIONAR / DESELECCIONAR TODOS LOS TICKETS FILTRADOS
    chkSelectAllTickets.addEventListener('change', (e) => {
        const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        const filtrados = obtenerTicketsFiltrados(currentUser.tickets || []);

        if (e.target.checked) {
            filtrados.forEach(t => ticketsSeleccionados.add(String(t.idTicket)));
        } else {
            filtrados.forEach(t => ticketsSeleccionados.delete(String(t.idTicket)));
        }

        renderizarTickets(currentUser.tickets || []);
    });

    // CHECKBOX INDIVIDUAL POR TICKET
    ticketsList.addEventListener('change', (e) => {
        if (e.target.classList.contains('ticket-item-checkbox')) {
            const idTicket = String(e.target.getAttribute('data-ticket-id'));
            if (e.target.checked) {
                ticketsSeleccionados.add(idTicket);
            } else {
                ticketsSeleccionados.delete(idTicket);
            }

            const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
            renderizarTickets(currentUser.tickets || []);
        }
    });

    // ENVIAR LOTE O TICKET(S) SELECCIONADOS EN PDF AL CORREO
    btnSendEmailPDF.addEventListener('click', async () => {
        const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        if (!currentUser.email) return;

        const fechaInicio = filterFechaInicio.value;
        const fechaFin = filterFechaFin.value;
        const filtrados = obtenerTicketsFiltrados(currentUser.tickets || []);

        let idsAEnviar = [];
        if (filtrados.length === 1) {
            idsAEnviar = [String(filtrados[0].idTicket)];
        } else {
            idsAEnviar = filtrados
                .map(t => String(t.idTicket))
                .filter(id => ticketsSeleccionados.has(id));

            if (idsAEnviar.length === 0) {
                alert('Selecciona al menos un ticket para enviar por correo.');
                return;
            }
        }

        btnSendEmailPDF.textContent = "Generando y enviando PDF...";
        btnSendEmailPDF.disabled = true;

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    action: "sendTicketsPDF",
                    correo: currentUser.email,
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    ticketIds: idsAEnviar
                })
            });
            const result = await response.json();

            if (result.status === "success") {
                alert('¡Listo! ' + result.message);
            } else {
                alert(result.message || 'No se pudo enviar el PDF.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión al enviar el correo.');
        } finally {
            btnSendEmailPDF.textContent = "📩 Enviar ticket(s) al correo en PDF";
            btnSendEmailPDF.disabled = false;
        }
    });

    // INICIAR SESIÓN CONTRA GOOGLE SHEETS
    btnLoginSubmit.addEventListener('click', async () => {
        const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
        if (!emailInput) {
            alert('Por favor ingresa tu correo electrónico.');
            return;
        }

        btnLoginSubmit.textContent = "Buscando cuenta...";
        btnLoginSubmit.disabled = true;

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({ action: "login", correo: emailInput })
            });
            const result = await response.json();

            if (result.status === "success") {
                filtroFechaInicializado = false;
                ultimoFiltroKey = "";
                ticketsSeleccionados.clear();
                const clienteData = {
                    nombre: result.nombre,
                    email: emailInput,
                    qrCode: result.qrCode,
                    visitas: result.visitas !== undefined && result.visitas !== "" ? result.visitas : 0,
                    bebida: result.bebida || "Ninguna",
                    alimento: result.alimento || "Ninguna",
                    alergias: result.alergias || "Ninguna",
                    tickets: result.tickets || []
                };
                localStorage.setItem('ocaso_user', JSON.stringify(clienteData));
                activarPestanaDashboard('tab-qr');
                mostrarDashboard(clienteData);
            } else {
                alert(result.message || 'Cuenta no encontrada.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión con el servidor.');
        } finally {
            btnLoginSubmit.textContent = "Entrar a mi Cuenta";
            btnLoginSubmit.disabled = false;
        }
    });

    // GUARDAR CAMBIOS DE NOTAS EN GOOGLE SHEETS
    if (btnUpdatePrefs) {
        btnUpdatePrefs.addEventListener('click', async () => {
            const nuevaAlergia = document.getElementById('editAlergias').value;
            let currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
            
            if (!currentUser.email) {
                alert('Sesión no válida.');
                return;
            }

            btnUpdatePrefs.textContent = "Guardando...";
            btnUpdatePrefs.disabled = true;

            try {
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({ 
                        action: "update", 
                        correo: currentUser.email, 
                        alergias: nuevaAlergia 
                    })
                });
                const result = await response.json();

                if (result.status === "success") {
                    currentUser.alergias = nuevaAlergia;
                    localStorage.setItem('ocaso_user', JSON.stringify(currentUser));
                    document.getElementById('valNotas').textContent = nuevaAlergia;
                    editNotasContainer.style.display = 'none';
                    alert('¡Nota para el barista actualizada!');
                } else {
                    alert(result.message || 'No se pudo actualizar en la base de datos.');
                }
            } catch (error) {
                console.error(error);
                alert('Error al conectar con la base de datos.');
            } finally {
                btnUpdatePrefs.textContent = "Guardar";
                btnUpdatePrefs.disabled = false;
            }
        });
    }

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('ocaso_user');
        filtroFechaInicializado = false;
        ultimoFiltroKey = "";
        ticketsSeleccionados.clear();
        dashboardView.style.display = 'none';
        activarPestanaDashboard('tab-qr');
        vistaClubPublica = 'register';
        mostrarVistaPublica('register');
        document.getElementById('clientForm').reset();
        if (selectPreferenciasRegistro && !HABILITAR_PREFERENCIAS_CONSUMO) {
            selectPreferenciasRegistro.value = 'Ninguna';
        }
    });

    // PESTAÑAS DEL DASHBOARD: Mi QR | Menú | Tickets
    const dashboardTabBtns = document.querySelectorAll('.dashboard-tab-btn');
    dashboardTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            activarPestanaDashboard(targetId);

            // Solo sincroniza con Google Sheets en QR y Tickets (no hace falta al abrir el Menú)
            if (targetId !== 'tab-menu') {
                const currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
                if (currentUser.email) {
                    sincronizarDatosCliente(currentUser.email);
                }
            }
        });
    });
});

// ==========================================
// NAVEGACIÓN PÚBLICA Y PESTAÑAS
// ==========================================
function mostrarVistaPublica(vista) {
    const publicNav = document.getElementById('public-nav');
    const registrationForm = document.getElementById('registration-form');
    const loginView = document.getElementById('login-view');
    const publicMenuView = document.getElementById('public-menu-view');
    const dashboardView = document.getElementById('dashboard-view');

    dashboardView.style.display = 'none';
    if (publicNav) publicNav.style.display = 'flex';

    registrationForm.style.display = vista === 'register' ? 'block' : 'none';
    loginView.style.display = vista === 'login' ? 'block' : 'none';
    publicMenuView.style.display = vista === 'menu' ? 'block' : 'none';

    document.querySelectorAll('.public-tab-btn').forEach(btn => {
        const target = btn.getAttribute('data-public-target');
        const esActivo = (vista === 'menu' && target === 'menu') || (vista !== 'menu' && target === 'club');
        btn.classList.toggle('active', esActivo);
    });
}

function activarPestanaDashboard(targetId) {
    document.querySelectorAll('.dashboard-tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-target') === targetId);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === targetId);
    });
}

// ==========================================
// MENÚ DIGITAL Y LIGHTBOX
// ==========================================
function renderizarGaleriaMenu(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = MENU_ITEMS.map((item, idx) => `
        <div class="menu-card" data-menu-idx="${idx}">
            <div class="menu-card-header">
                <span class="menu-card-title">${item.titulo}</span>
                <span class="menu-card-badge">${item.etiqueta}</span>
            </div>
            <img class="menu-card-img" src="${item.src}" alt="${item.titulo} - OCASO Coffee Club" loading="lazy">
        </div>
    `).join('');

    container.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const idx = Number(card.getAttribute('data-menu-idx')) || 0;
            abrirLightbox(MENU_ITEMS, idx);
        });
    });
}

function inicializarLightbox() {
    const lightbox = document.getElementById('menuLightbox');
    const stage = document.getElementById('lightboxStage');
    const btnClose = document.getElementById('btnCloseLightbox');
    const btnPrev = document.getElementById('btnLightboxPrev');
    const btnNext = document.getElementById('btnLightboxNext');
    const btnZoom = document.getElementById('btnLightboxZoom');

    if (!lightbox) return;

    btnClose.addEventListener('click', cerrarLightbox);

    btnPrev.addEventListener('click', () => {
        lightboxIndiceActual = (lightboxIndiceActual - 1 + lightboxListaActual.length) % lightboxListaActual.length;
        actualizarLightbox();
    });

    btnNext.addEventListener('click', () => {
        lightboxIndiceActual = (lightboxIndiceActual + 1) % lightboxListaActual.length;
        actualizarLightbox();
    });

    btnZoom.addEventListener('click', () => {
        const zoomed = stage.classList.toggle('is-zoomed');
        btnZoom.textContent = zoomed ? 'Ajustar' : 'Ampliar';
        if (zoomed) {
            stage.scrollTop = 0;
            stage.scrollLeft = 0;
        }
    });

    stage.addEventListener('click', (e) => {
        if (e.target === stage) cerrarLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'none') return;
        if (e.key === 'Escape') cerrarLightbox();
        if (e.key === 'ArrowLeft') btnPrev.click();
        if (e.key === 'ArrowRight') btnNext.click();
    });
}

function abrirLightbox(lista, indice) {
    const lightbox = document.getElementById('menuLightbox');
    lightboxListaActual = lista && lista.length ? lista : MENU_ITEMS;
    lightboxIndiceActual = Math.max(0, Math.min(indice, lightboxListaActual.length - 1));

    actualizarLightbox();
    lightbox.style.display = 'flex';
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
}

function actualizarLightbox() {
    const item = lightboxListaActual[lightboxIndiceActual];
    const img = document.getElementById('lightboxImg');
    const title = document.getElementById('lightboxTitle');
    const counter = document.getElementById('lightboxCounter');
    const stage = document.getElementById('lightboxStage');
    const btnZoom = document.getElementById('btnLightboxZoom');

    if (!item) return;

    stage.classList.remove('is-zoomed');
    btnZoom.textContent = 'Ampliar';
    img.src = item.src;
    img.alt = `${item.titulo} - OCASO Coffee Club`;
    title.textContent = item.titulo;
    counter.textContent = `${lightboxIndiceActual + 1} / ${lightboxListaActual.length}`;
}

function cerrarLightbox() {
    const lightbox = document.getElementById('menuLightbox');
    const stage = document.getElementById('lightboxStage');
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
    stage.classList.remove('is-zoomed');
    document.body.classList.remove('no-scroll');
}

// ==========================================
// SINCRONIZACIÓN AUTOMÁTICA EN SEGUNDO PLANO CON GOOGLE SHEETS
// ==========================================
async function sincronizarDatosCliente(email) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({ action: "login", correo: email.trim().toLowerCase() })
        });
        const result = await response.json();

        if (result.status === "success") {
            const clienteActualizado = {
                nombre: result.nombre,
                email: email.trim().toLowerCase(),
                qrCode: result.qrCode,
                visitas: result.visitas !== undefined && result.visitas !== "" ? result.visitas : 0,
                bebida: result.bebida || "Ninguna",
                alimento: result.alimento || "Ninguna",
                alergias: result.alergias || "Ninguna",
                tickets: result.tickets || []
            };
            localStorage.setItem('ocaso_user', JSON.stringify(clienteActualizado));
            mostrarDashboard(clienteActualizado);
        }
    } catch (error) {
        console.warn("No se pudo sincronizar en segundo plano:", error);
    }
}

// REGISTRO NUEVO DIRECTO A GOOGLE SHEETS
async function ejecutarRegistroCliente() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = `${document.getElementById('emailUser').value.trim()}@${document.getElementById('emailDomain').value}`;
    const alergias = HABILITAR_PREFERENCIAS_CONSUMO
        ? (document.getElementById('alergias').value || 'Ninguna')
        : 'Ninguna';
    const telefono = document.getElementById('telefono').value.trim();
    const fechaAceptacion = new Date().toLocaleString("es-MX");

    const clienteData = {
        action: "register",
        nombre,
        correo: email,
        telefono,
        alergias,
        avisoPrivacidad: "VERDADERO",
        fechaAceptacion
    };

    const btnOpenModal = document.getElementById('btnOpenModal');
    btnOpenModal.textContent = "Registrando...";
    btnOpenModal.disabled = true;
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(clienteData)
        });
        const result = await response.json();

        if (result.status === "success") {
            filtroFechaInicializado = false;
            ultimoFiltroKey = "";
            ticketsSeleccionados.clear();
            const clienteCreado = {
                nombre: result.nombre || nombre,
                email: email,
                qrCode: result.qrCode,
                visitas: 0,
                bebida: "Ninguna",
                alimento: "Ninguna",
                alergias: result.alergias || alergias,
                tickets: []
            };
            localStorage.setItem('ocaso_user', JSON.stringify(clienteCreado));
            activarPestanaDashboard('tab-qr');
            mostrarDashboard(clienteCreado);
        } else {
            alert(result.message || 'Error al registrar en Google Sheets.');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión al registrar.');
    } finally {
        btnOpenModal.textContent = "Obtener mi Código";
        btnOpenModal.disabled = false;
    }
}

function obtenerTicketsFiltrados(tickets) {
    const fechaInicio = document.getElementById('filterFechaInicio').value;
    const fechaFin = document.getElementById('filterFechaFin').value;

    return (tickets || []).filter(t => {
        if (fechaInicio && t.fechaISO < fechaInicio) return false;
        if (fechaFin && t.fechaISO > fechaFin) return false;
        return true;
    });
}

function mostrarDashboard(user) {
    const publicNav = document.getElementById('public-nav');
    const publicMenuView = document.getElementById('public-menu-view');
    if (publicNav) publicNav.style.display = 'none';
    if (publicMenuView) publicMenuView.style.display = 'none';

    document.getElementById('registration-form').style.display = 'none';
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    
    const primerNombre = (user.nombre || 'Socio').trim().split(' ')[0];
    document.getElementById('welcomeUser').textContent = `¡Hola, ${primerNombre}!`;

    document.getElementById('valVisitas').textContent = user.visitas !== undefined && user.visitas !== "" ? user.visitas : 0;
    document.getElementById('valBebida').textContent = user.bebida || 'Ninguna';
    document.getElementById('valAlimento').textContent = user.alimento || 'Ninguna';

    const valNotasEl = document.getElementById('valNotas');
    if (valNotasEl) {
        valNotasEl.textContent = user.alergias || 'Ninguna';
    }

    const editAlergiasEl = document.getElementById('editAlergias');
    if (editAlergiasEl && user.alergias) {
        const existeOpcion = Array.from(editAlergiasEl.options).some(opt => opt.value === user.alergias);
        editAlergiasEl.value = existeOpcion ? user.alergias : 'Ninguna';
    }

    new QRious({
        element: document.getElementById('qrCanvas'),
        value: user.qrCode || `OCA-${user.email}`,
        size: 210,
        background: '#ffffff',
        foreground: '#1c1a17'
    });

    const listaTickets = user.tickets || [];
    const filterFechaInicio = document.getElementById('filterFechaInicio');
    const filterFechaFin = document.getElementById('filterFechaFin');

    if (!filtroFechaInicializado && listaTickets.length > 0) {
        const ultimaFechaISO = listaTickets[0].fechaISO;
        filterFechaInicio.value = ultimaFechaISO;
        filterFechaFin.value = ultimaFechaISO;
        filtroFechaInicializado = true;
    }

    renderizarTickets(listaTickets);
}

function renderizarTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    const btnSendEmailPDF = document.getElementById('btnSendEmailPDF');
    const selectionBar = document.getElementById('ticketSelectionBar');
    const chkSelectAll = document.getElementById('chkSelectAllTickets');
    const txtSelectAllLabel = document.getElementById('txtSelectAllLabel');
    const txtSelectedCount = document.getElementById('txtSelectedCount');

    const fechaInicio = document.getElementById('filterFechaInicio').value;
    const fechaFin = document.getElementById('filterFechaFin').value;

    if (!tickets || tickets.length === 0) {
        selectionBar.style.display = 'none';
        ticketsList.innerHTML = `
            <div class="empty-ticket-state">
                <p>☕ Aún no tienes tickets registrados en tu cuenta.</p>
                <p class="empty-ticket-sub">Tus consumos en cafetería aparecerán aquí automáticamente.</p>
            </div>
        `;
        btnSendEmailPDF.style.display = 'none';
        return;
    }

    const filtrados = obtenerTicketsFiltrados(tickets);

    if (filtrados.length === 0) {
        selectionBar.style.display = 'none';
        ticketsList.innerHTML = `
            <div class="empty-ticket-state">
                <p>📅 No hay tickets en la fecha seleccionada.</p>
                <p class="empty-ticket-sub">Cambia el rango de fechas o pulsa "Ver todos".</p>
            </div>
        `;
        btnSendEmailPDF.style.display = 'none';
        return;
    }

    const filtroKey = `${fechaInicio}|${fechaFin}|${filtrados.map(t => t.idTicket).join(',')}`;
    if (filtroKey !== ultimoFiltroKey) {
        ultimoFiltroKey = filtroKey;
        ticketsSeleccionados.clear();
        filtrados.forEach(t => ticketsSeleccionados.add(String(t.idTicket)));
    }

    const mostrarOpcionesMultiples = filtrados.length > 1;
    selectionBar.style.display = mostrarOpcionesMultiples ? 'flex' : 'none';

    if (mostrarOpcionesMultiples) {
        const idsFiltrados = filtrados.map(t => String(t.idTicket));
        const marcadasEnFiltro = idsFiltrados.filter(id => ticketsSeleccionados.has(id));
        const todosMarcados = marcadasEnFiltro.length === idsFiltrados.length;

        chkSelectAll.checked = todosMarcados;
        txtSelectAllLabel.textContent = todosMarcados ? "Deseleccionar todos" : "Seleccionar todos";
        txtSelectedCount.textContent = `${marcadasEnFiltro.length} de ${idsFiltrados.length} seleccionados`;
    }

    btnSendEmailPDF.style.display = 'block';
    ticketsList.innerHTML = filtrados.map(t => {
        const idStr = String(t.idTicket);
        const isChecked = mostrarOpcionesMultiples ? ticketsSeleccionados.has(idStr) : true;

        const productosHTML = (t.items && t.items.length > 0)
            ? t.items.map(item => `
                <div class="ticket-product-row">
                    <span>${item.cantidad}x ${item.nombre}</span>
                    <span class="ticket-product-Sub">$${Number(item.subtotal).toFixed(2)} MXN</span>
                </div>
            `).join('')
            : `<div class="ticket-product-row"><span>Consumo en barra</span><span>$${Number(t.total).toFixed(2)} MXN</span></div>`;

        const pagoTexto = t.metodoPago ? `Método de pago: ${t.metodoPago}` : '';
        const checkboxHTML = mostrarOpcionesMultiples
            ? `<input type="checkbox" class="ticket-item-checkbox" data-ticket-id="${idStr}" ${isChecked ? 'checked' : ''}>`
            : '';

        return `
            <div class="ticket-item-card ${isChecked ? 'is-selected' : ''}">
                <div class="ticket-item-header">
                    <div class="ticket-header-left">
                        ${checkboxHTML}
                        <span class="ticket-id-badge">Ticket #${t.idTicket}</span>
                    </div>
                    <span class="ticket-date-label">${t.fechaDisplay}</span>
                </div>
                <div class="ticket-item-body">
                    ${productosHTML}
                </div>
                ${pagoTexto ? `<div class="ticket-payment-line">${pagoTexto}</div>` : ''}
                <div class="ticket-item-footer">
                    <span class="ticket-barista">Atendió: ${t.barista}</span>
                    <span class="ticket-total">Total: $${Number(t.total).toFixed(2)} MXN</span>
                </div>
            </div>
        `;
    }).join('');
}