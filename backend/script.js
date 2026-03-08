console.log("SCRIPT CARREGADO OK");

// ============================================
// CONFIGURAÇÃO DO BACKEND
// ============================================
const API_URL = "https://chatbrasil.onrender.com";
let contatoSelecionadoId = null; // Para guardar com quem você está falando

// ============================================
// SOCKET.IO PARA CHAT EM TEMPO REAL
// ============================================

// Conecta enviando o token se ele existir no localStorage
const socket = io(API_URL, {
    auth: {
        token: localStorage.getItem("token")
    }
});

const chatContainer = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

// Receber mensagens (Melhorado para lidar com objetos ou strings)
socket.on("receive_message", (data) => {
    if (!chatContainer) return;
    
    const div = document.createElement("div");
    div.classList.add("chat-message");
    
    // Verifica se recebeu um objeto com nome ou apenas texto
    if (typeof data === 'object') {
        div.innerHTML = `<strong>${data.username}:</strong> ${data.text}`;
    } else {
        div.textContent = data;
    }
    
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Enviar mensagem
if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (message !== "") {
          socket.emit("send_message", { 
    sender_id: localStorage.getItem("userId"),
    receiver_id: contatoSelecionadoId, // Esta variável precisa ser definida ao clicar em um nome
    text: message, 
    token: localStorage.getItem("token") 
});
            chatInput.value = "";
        }
    });

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") chatSendBtn.click();
    });
}

// ============================================
// FUNÇÕES DE LOGIN E REGISTRO
// ============================================

async function registerUser(username, email, password) {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Usuário registrado com sucesso! Faça o login.");
        } else {
            alert("Erro no registro: " + (data.error || "Tente novamente"));
        }
    } catch (err) {
        console.error("Erro ao conectar com backend:", err);
    }
}

async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
// Adicione esta linha logo abaixo do username:
localStorage.setItem("userId", data.userId);
            alert("Login realizado com sucesso!");
            location.reload(); // Recarrega para ativar o Socket com o novo token
        } else {
            alert("Erro no login: " + (data.error || "E-mail ou senha incorretos"));
        }
    } catch (err) {
        console.error("Erro ao conectar com backend:", err);
    }
}

// ============================================
// EVENTOS DOS FORMULÁRIOS
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    // REGISTRO
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("registerUsername").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value.trim();

            // Regex corrigida para aceitar espaços e letras acentuadas (Opcional)
            const namePattern = /^[A-ZÀ-Ú][a-zà-ú]+(\s[A-ZÀ-Ú][a-zà-ú]+)*$/;

            if (!namePattern.test(username)) {
                alert("Nome inválido: Cada palavra deve começar com Maiúscula.");
                return;
            }
            registerUser(username, email, password);
        });
    }
// ... código anterior do loginForm
    
    // ADICIONE ISSO AQUI:
    if (localStorage.getItem("token")) {
        carregarContatos(); 
    }

    // LOGIN
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginUsername").value.trim(); // Se o ID for loginUsername mas pedir e-mail
            const password = document.getElementById("loginPassword").value.trim();
            loginUser(email, password);
        });
    }

    if (typeof init === "function") init();
});

// Fecha menus ao clicar fora
document.addEventListener("click", (e) => {
    if (!e.target.closest(".control-btn") && !e.target.closest(".popup")) {
        if (typeof closeMenus === "function") closeMenus();
    }
});
async function carregarContatos() {
    const res = await fetch(`${API_URL}/users`); // Você precisa criar essa rota no server.js
    const usuarios = await res.json();
    const lista = document.getElementById("contatosList"); // Crie uma div com este ID no HTML
    
    if(lista) {
        lista.innerHTML = "";
        usuarios.forEach(user => {
            const item = document.createElement("li");
            item.textContent = user.username;
            item.onclick = () => {
                contatoSelecionadoId = user.id;
                alert("Conversando com: " + user.username);
            };
            lista.appendChild(item);
        });
    }
}

// Chame essa função dentro do DOMContentLoaded
