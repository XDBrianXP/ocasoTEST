document.addEventListener('DOMContentLoaded', () => {
    const btnOpenModal = document.getElementById('btnOpenModal');
    const privacyModal = document.getElementById('privacyModal');
    const acceptPrivacy = document.getElementById('acceptPrivacy');
    const btnAcceptPrivacy = document.getElementById('btnAcceptPrivacy');
    const btnRejectPrivacy = document.getElementById('btnRejectPrivacy');
    const clientForm = document.getElementById('clientForm');

    // Manejo del Modal de Privacidad
    btnOpenModal.addEventListener('click', () => {
        // Validar formulario antes de abrir modal
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

    // Objeto con datos incluyendo la evidencia del Aviso de Privacidad y fecha/hora
    const clienteData = {
        nombre,
        email,
        alergias,
        telefono,
        avisoPrivacidad: "VERDADERO",
        fechaAceptacion
    };

    // Simulación de guardado exitoso y cambio a vista Dashboard
    localStorage.setItem('ocaso_user', JSON.stringify(clienteData));
    mostrarDashboard(clienteData);
}

function mostrarDashboard(user) {
    document.getElementById('registration-form').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    document.getElementById('welcomeUser').textContent = `¡Hola, ${user.nombre}!`;

    // Generar código QR único
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
    // Aquí puedes conectar el fetch hacia tu base de datos o script de Apps Script
    // Ejemplo simulado de ticket virtual:
    ticketsList.innerHTML = `
        <div class="ticket-card">
            <div class="ticket-header">
                <span>Ticket #91511231</span>
                <span>11/11/2026</span>
            </div>
            <div class="ticket-body">
                <p><strong>1x Carajillo Ocaso</strong> - $140.00 MXN</p>
                <p><strong>1x Croissant de Mantequilla</strong> - $45.00 MXN</p>
                <p class="ticket-notes"><em>Nota cocina: Poca mayonesa</em></p>
            </div>
            <div class="ticket-footer">
                <span>Total: $185.00 MXN</span>
                <span class="badge-success">Completado</span>
            </div>
        </div>
    `;
}