// URL OFICIAL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLgQItcfeq9SW1j70jPBy_LCdEmmsAptXRMVoH8rmCVJiEf8LCGZ2--SyknXr9a.../exec";

document.addEventListener('DOMContentLoaded', () => {
    const btnOpenModal = document.getElementById('btnOpenModal');
    const privacyModal = document.getElementById('privacyModal');
    const acceptPrivacy = document.getElementById('acceptPrivacy');
    const btnAcceptPrivacy = document.getElementById('btnAcceptPrivacy');
    const btnRejectPrivacy = document.getElementById('btnRejectPrivacy');
    
    const showLogin = document.getElementById('showLogin');
    const showRegister = document.getElementById('showRegister');
    const registrationForm = document.getElementById('registration-form');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const btnLoginSubmit = document.getElementById('btnLoginSubmit');
    const btnLogout = document.getElementById('btnLogout');
    const btnUpdatePrefs = document.getElementById('btnUpdatePrefs');

    const savedUser = localStorage.getItem('ocaso_user');
    if (savedUser) {
        mostrarDashboard(JSON.parse(savedUser));
    }

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registrationForm.style.display = 'none';
        loginView.style.display = 'block';
    });

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registrationForm.style.display = 'block';
    });

    btnOpenModal.addEventListener('click', () => {
        const nombre = document.getElementById('nombre').value.trim();
        const emailUser = document.getElementById('emailUser').value.trim();
        const emailDomain = document.getElementById('emailDomain').value;
        const confirmEmailUser = document.getElementById('confirmEmailUser').value.trim();
        const confirmEmailDomain = document.getElementById('confirmEmailDomain').value;
        const alergias = document.getElementById('alergias').value;

        if (!nombre || !emailUser || !emailDomain || !confirmEmailUser || !confirmEmailDomain || !alergias) {
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
                body: JSON.stringify({ action: "login", correo: emailInput })
            });
            const result = await response.json();

            if (result.status === "success") {
                const clienteData = {
                    nombre: result.nombre,
                    email: emailInput,
                    alergias: result.alergias || "Ninguna"
                };
                localStorage.setItem('ocaso_user', JSON.stringify(clienteData));
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

    btnUpdatePrefs.addEventListener('click', async () => {
        const nuevaAlergia = document.getElementById('editAlergias').value;
        let currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        
        if (!currentUser.email) {
            alert('Sesión no válida.');
            return;
        }

        btnUpdatePrefs.textContent = "Guardando en base de datos...";
        btnUpdatePrefs.disabled = true;

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
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
                alert('¡Preferencias actualizadas y sincronizadas en Google Sheets!');
            } else {
                alert('No se pudo actualizar en la base de datos.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con la base de datos.');
        } finally {
            btnUpdatePrefs.textContent = "Guardar Cambios";
            btnUpdatePrefs.disabled = false;
        }
    });

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('ocaso_user');
        dashboardView.style.display = 'none';
        registrationForm.style.display = 'block';
        document.getElementById('clientForm').reset();
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });
});

// REGISTRO NUEVO CON CAPTURA DE ERROR DETALLADA
async function ejecutarRegistroCliente() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = `${document.getElementById('emailUser').value.trim()}@${document.getElementById('emailDomain').value}`;
    const alergias = document.getElementById('alergias').value;
    const telefono = document.getElementById('telefono').value.trim();
    const fechaAceptacion = new Date().toISOString();

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
    
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
        const result = await response.json();

        if (result.status === "success") {
            const clienteCreado = {
                nombre: result.nombre || nombre,
                email: email,
                alergias: result.alergias || alergias
            };
            localStorage.setItem('ocaso_user', JSON.stringify(clienteCreado));
            mostrarDashboard(clienteCreado);
        } else {
            // Muestra el mensaje exacto que viene del Apps Script
            alert('Detalle del servidor: ' + (result.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error("Error técnico:", error);
        alert('Error técnico detallado: ' + error.message);
    } finally {
        btnOpenModal.textContent = "Obtener mi Código";
    }
}

function mostrarDashboard(user) {
    document.getElementById('registration-form').style.display = 'none';
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    
    document.getElementById('welcomeUser').textContent = `¡Hola, ${user.nombre || 'Socio'}!`;

    if (user.alergias) {
        document.getElementById('editAlergias').value = user.alergias;
    }

    const qr = new QRious({
        element: document.getElementById('qrCanvas'),
        value: `OCA-${user.email}`,
        size: 200,
        background: '#ffffff',
        foreground: '#1c1a17'
    });
}