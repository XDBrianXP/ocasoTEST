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

    // Verificar si ya hay una sesión activa
    const savedUser = localStorage.getItem('ocaso_user');
    if (savedUser) {
        mostrarDashboard(JSON.parse(savedUser));
    }

    // Cambiar a pantalla de Login
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registrationForm.style.display = 'none';
        loginView.style.display = 'block';
    });

    // Regresar al Registro desde Login
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registrationForm.style.display = 'block';
    });

    // Validar formulario de registro y abrir modal de privacidad
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

    // Al aceptar privacidad, guardamos y registramos
    btnAcceptPrivacy.addEventListener('click', () => {
        privacyModal.style.display = 'none';
        ejecutarRegistroCliente();
    });

    // Iniciar sesión con correo existente
    btnLoginSubmit.addEventListener('click', () => {
        const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
        if (!emailInput) {
            alert('Por favor ingresa tu correo electrónico.');
            return;
        }

        const localData = localStorage.getItem('ocaso_user');
        if (localData) {
            const user = JSON.parse(localData);
            if (user.email.toLowerCase() === emailInput) {
                mostrarDashboard(user);
                return;
            }
        }

        // Acceso rápido si el correo coincide con sesión previa simulada
        const dummyUser = {
            nombre: "Socio Ocaso", // Nombre limpio por defecto en login rápido
            email: emailInput,
            alergias: 'Ninguna'
        };
        localStorage.setItem('ocaso_user', JSON.stringify(dummyUser));
        mostrarDashboard(dummyUser);
    });

    // Guardar cambios de preferencias en la pestaña Preferencias
    btnUpdatePrefs.addEventListener('click', () => {
        const nuevaAlergia = document.getElementById('editAlergias').value;
        let currentUser = JSON.parse(localStorage.getItem('ocaso_user') || '{}');
        currentUser.alergias = nuevaAlergia;
        localStorage.setItem('ocaso_user', JSON.stringify(currentUser));
        alert('¡Preferencias actualizadas correctamente en el sistema!');
    });

    // Cerrar sesión
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('ocaso_user');
        dashboardView.style.display = 'none';
        registrationForm.style.display = 'block';
        document.getElementById('clientForm').reset();
    });

    // Pestañas del Dashboard
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

function ejecutarRegistroCliente() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = `${document.getElementById('emailUser').value.trim()}@${document.getElementById('emailDomain').value}`;
    const alergias = document.getElementById('alergias').value;
    const telefono = document.getElementById('telefono').value.trim();
    const fechaAceptacion = new Date().toISOString();

    const clienteData = {
        nombre,
        email,
        alergias,
        telefono,
        avisoPrivacidad: "VERDADERO",
        fechaAceptacion
    };

    localStorage.setItem('ocaso_user', JSON.stringify(clienteData));
    mostrarDashboard(clienteData);
}

function mostrarDashboard(user) {
    document.getElementById('registration-form').style.display = 'none';
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    
    // Saludo con el nombre real ingresado, evitando mostrar el correo o cadenas rotas
    document.getElementById('welcomeUser').textContent = `¡Hola, ${user.nombre || 'Socio'}!`;

    // Seleccionar la preferencia actual en el selector de edición
    if (user.alergias) {
        document.getElementById('editAlergias').value = user.alergias;
    }

    // Generar QR único
    const qr = new QRious({
        element: document.getElementById('qrCanvas'),
        value: `OCA-${user.email}`,
        size: 200,
        background: '#ffffff',
        foreground: '#1c1a17'
    });

    cargarTicketsVirtuales(user.email);
}

function cargarTicketsVirtuales(email) {
    const ticketsList = document.getElementById('ticketsList');
    // Texto corregido: sin mención confusa a "este dispositivo", directo y profesional
    ticketsList.innerHTML = `
        <div class="empty-ticket-state" style="text-align: center; padding: 30px; color: #666;">
            <p>☕ Aún no tienes tickets registrados en tu cuenta.</p>
            <p style="font-size: 13px; margin-top: 8px;">Tus consumos en cafetería aparecerán aquí automáticamente.</p>
        </div>
    `;
}