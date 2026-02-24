console.log("SCRIPT CARREGADO OK");

// ============================================
// CONFIGURAÇÃO DO BACKEND
// ============================================
const API_URL = "https://api.chatbrasil.com";

// ============================================
// SOCKET.IO PARA CHAT EM TEMPO REAL
// ============================================

// Adiciona Socket.IO client
const socket = io(API_URL); // conecta ao backend Socket.IO

// Elementos do chat
const chatContainer = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

// Receber mensagens
socket.on("receive_message", (msg) => {
    if (!chatContainer) return;
    const div = document.createElement("div");
    div.textContent = msg;
    div.classList.add("chat-message");
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Enviar mensagem
if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (message !== "") {
            socket.emit("send_message", message);
            chatInput.value = "";
        }
    });

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            chatSendBtn.click();
        }
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
            console.log("Usuário registrado com sucesso:", data.user.username);
        } else {
            console.log("Erro no registro:", data.error);
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
            console.log("Login realizado com sucesso:", data.username);
            localStorage.setItem("token", data.token);
        } else {
            console.log("Erro no login:", data.error);
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

            // REGRA: Cada palavra deve começar com letra maiúscula
            const namePattern = /^([A-Z][a-z]+)(\s[A-Z][a-z]+)*$/;

            if (!namePattern.test(username)) {
                console.log("Nome inválido: deve começar com letra maiúscula em cada palavra.");
                return;
            }

            registerUser(username, email, password);
        });
    }

    // LOGIN
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            loginUser(email, password);
        });
    }

    // Inicialização geral
    if (typeof init === "function") init();
    if (typeof setupFileMenuListener === "function") setupFileMenuListener();
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

document.addEventListener("click", (e) => {
    if (
        !e.target.closest(".control-btn") &&
        !e.target.closest("#emojiPickerPopup") &&
        !e.target.closest("#filesMenuPopup")
    ) {
        if (typeof closeMenus === "function") closeMenus();
    }
});

window.addEventListener("beforeunload", () => {
    if (typeof config !== "undefined" && config.currentUser) {
        if (typeof saveUserData === "function") saveUserData();
    }
});
