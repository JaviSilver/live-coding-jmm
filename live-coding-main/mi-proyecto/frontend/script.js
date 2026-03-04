const API_URL = 'http://localhost:3000/api';

// --- ELEMENTOS DEL DOM ---
const authPanel = document.getElementById('auth-panel');
const notesPanel = document.getElementById('notes-panel');
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const navUserArea = document.getElementById('nav-user-area');

const btnGoRegister = document.getElementById('btn-go-register');
const btnGoLogin = document.getElementById('btn-go-login');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const createNoteForm = document.getElementById('create-note-form');

const feedbackDiv = document.getElementById('feedback-message');
const userGreeting = document.getElementById('user-greeting');
const logoutBtn = document.getElementById('logout-btn');
const notesList = document.getElementById('notes-list');

const editModal = document.getElementById('edit-modal');
const closeModalBg = document.getElementById('close-modal-bg');
const closeModalBtn = document.getElementById('close-modal-btn');
const editNoteForm = document.getElementById('edit-note-form');
const editNoteId = document.getElementById('edit-note-id');
const editNoteTitle = document.getElementById('edit-note-title');
const editNoteContent = document.getElementById('edit-note-content');

// --- UTILIDADES ---

function showMessage(message, isError = false) {
    feedbackDiv.innerHTML = `<span class="px-4 py-2 rounded-lg ${isError ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}">${message}</span>`;
    setTimeout(() => feedbackDiv.innerHTML = '', 5000);
}

// [MODIFICADO] Validación detallada de requisitos mínimos
function validarPasswordFrontend(pass) {
    if (/\s/.test(pass)) return "La contraseña no puede contener espacios.";
    if (pass.length < 6 || pass.length > 15) return "La contraseña debe tener entre 6 y 15 caracteres.";
    
    const tieneMayus = /[A-Z]/.test(pass);
    const tieneMinus = /[a-z]/.test(pass);
    const tieneNum = /\d/.test(pass);
    // Hemos añadido . y _ aquí también
    const tieneEspecial = /[@$!%*?&._]/.test(pass);

    let errores = [];
    if (!tieneMayus) errores.push("mayúscula");
    if (!tieneMinus) errores.push("minúscula");
    if (!tieneNum) errores.push("número");
    if (!tieneEspecial) errores.push("especial (@$!%*?&._)");

    if (errores.length > 0) {
        return "Falta: " + errores.join(", ") + ".";
    }
    return null;
}

// --- NAVEGACIÓN Y SESIÓN ---

btnGoRegister.addEventListener('click', (e) => { e.preventDefault(); loginContainer.classList.add('hidden'); registerContainer.classList.remove('hidden'); });
btnGoLogin.addEventListener('click', (e) => { e.preventDefault(); registerContainer.classList.add('hidden'); loginContainer.classList.remove('hidden'); });

function checkAuth() {
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    if (userId) {
        authPanel.classList.add('hidden');
        notesPanel.classList.remove('hidden');
        navUserArea.classList.remove('hidden');
        navUserArea.classList.add('flex');
        userGreeting.textContent = userEmail.split('@')[0];
        cargarNotas(); 
    } else {
        authPanel.classList.remove('hidden');
        notesPanel.classList.add('hidden');
        navUserArea.classList.add('hidden');
    }
}

logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    checkAuth();
    showMessage('Sesión cerrada.');
});

// --- ACCIONES ---

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;

    // [NUEVO] Validaciones Frontend
    const errorMsg = validarPasswordFrontend(password);
    if (errorMsg) return showMessage(errorMsg, true);
    if (password !== confirmPassword) return showMessage('Las contraseñas no coinciden.', true);

    try {
        const response = await fetch(`${API_URL}/register`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, password }) 
        });
        const data = await response.json();
        if (response.ok) {
            showMessage('¡Registro exitoso! Ya puedes entrar.');
            registerForm.reset();
            btnGoLogin.click();
        } else { showMessage(data.mensaje, true); }
    } catch (error) { showMessage('Error de servidor.', true); }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, password }) 
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('user_id', data.usuario.id);
            localStorage.setItem('user_email', data.usuario.email);
            checkAuth();
        } else { showMessage(data.mensaje, true); }
    } catch (error) { showMessage('Error de servidor.', true); }
});

// [CARGAR, CREAR, EDITAR, BORRAR NOTAS SE MANTIENEN IGUAL QUE LA ÚLTIMA VERSIÓN]
// ... (mismas funciones cargarNotas, renderizarNotas, etc.)

async function cargarNotas() {
    const userId = localStorage.getItem('user_id');
    try {
        const response = await fetch(`${API_URL}/notas`, { headers: { 'X-User-Id': userId } });
        const data = await response.json();
        if (response.ok) renderizarNotas(data.notas);
    } catch (error) { console.error(error); }
}

function renderizarNotas(notas) {
    notesList.innerHTML = ''; 
    if (notas.length === 0) {
        notesList.innerHTML = '<div class="col-span-full text-center text-gray-400 py-12 glassmorphism rounded-2xl border-dashed border-2 border-white/20"><p>No hay notas guardadas.</p></div>';
        return;
    }

    notas.reverse().forEach(nota => {
        const card = document.createElement('div');
        card.className = 'glassmorphism rounded-2xl p-6 relative flex flex-col h-full hover:shadow-2xl transition-all';
        
        const title = document.createElement('h4');
        title.className = 'text-xl font-bold text-white mb-2 pb-2 border-b border-white/10';
        title.textContent = nota.titulo; 
        
        const content = document.createElement('p');
        content.className = 'text-gray-300 whitespace-pre-wrap mb-4 text-sm flex-grow';
        content.textContent = nota.contenido;
        
        const footer = document.createElement('div');
        footer.className = 'flex justify-end gap-2 pt-4 border-t border-white/10';

        const btnEditar = document.createElement('button');
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        btnEditar.className = 'text-blue-400 hover:bg-blue-400/10 p-2 rounded-lg';
        btnEditar.onclick = () => abrirModalEdicion(nota);

        const btnBorrar = document.createElement('button');
        btnBorrar.innerHTML = '<i class="fas fa-trash-alt"></i>';
        btnBorrar.className = 'text-red-400 hover:bg-red-400/10 p-2 rounded-lg';
        btnBorrar.onclick = () => borrarNota(nota.id);

        footer.append(btnEditar, btnBorrar);
        card.append(title, content, footer);
        notesList.appendChild(card);
    });
}

createNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('note-title').value;
    const contenido = document.getElementById('note-content').value;
    const userId = localStorage.getItem('user_id');

    try {
        const response = await fetch(`${API_URL}/notas`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }, 
            body: JSON.stringify({ titulo, contenido }) 
        });
        if (response.ok) { showMessage('Guardado.'); createNoteForm.reset(); cargarNotas(); }
    } catch (error) { showMessage('Error.', true); }
});

function abrirModalEdicion(nota) {
    editNoteId.value = nota.id; editNoteTitle.value = nota.titulo; editNoteContent.value = nota.contenido;
    editModal.classList.remove('hidden'); editModal.classList.add('flex');
}

const cerrarModal = () => { editModal.classList.add('hidden'); editModal.classList.remove('flex'); };
closeModalBtn.addEventListener('click', cerrarModal);
closeModalBg.addEventListener('click', cerrarModal);

editNoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('user_id');
    try {
        const response = await fetch(`${API_URL}/notas/${editNoteId.value}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }, 
            body: JSON.stringify({ titulo: editNoteTitle.value, contenido: editNoteContent.value }) 
        });
        if (response.ok) { cerrarModal(); cargarNotas(); showMessage('Actualizada.'); }
    } catch (error) { showMessage('Error.', true); }
});

async function borrarNota(id) {
    if (!confirm('¿Borrar?')) return;
    const userId = localStorage.getItem('user_id');
    try {
        const response = await fetch(`${API_URL}/notas/${id}`, { method: 'DELETE', headers: { 'X-User-Id': userId } });
        if (response.ok) { cargarNotas(); showMessage('Borrada.'); }
    } catch (error) { showMessage('Error.', true); }
}

checkAuth();