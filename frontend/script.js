console.log("SCRIPT CARREGADO OK");

const API_URL = "https://chatbrasil.onrender.com";

// 1. Configuração do Socket (Melhorada para o Render)
const socket = io(API_URL, {
    transports: ["websocket", "polling"]
});

const chatContainer = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

// 2. Receber mensagens (Tratando como OBJETO)
socket.on("receive_message", (data) => {
    if (!chatContainer) return;
    const div = document.createElement("div");
    div.classList.add("chat-message");
    
    // Se o backend enviar objeto, mostra "Nome: Mensagem"
    if (typeof data === 'object') {
        div.innerHTML = `<strong>${data.username}:</strong> ${data.text}`;
    } else {
        div.textContent = data;
    }
    
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// VARIÁVEL GLOBAL PARA SABER COM QUEM ESTOU FALANDO (Igual clicar no contato no Zap)
let contatoSelecionadoId = null; 

// 3. Enviar mensagem PRIVADA (Estilo WhatsApp)
if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener("click", () => {
        const message = chatInput.value.trim();
        const meuId = localStorage.getItem("userId"); // Certifique-se de salvar o userId no Login!

        if (message !== "" && meuId && contatoSelecionadoId) {
            // ENVIA PARA O SOCKET COM A ESTRUTURA DA SUA TABELA 'messages'
            socket.emit("send_message", {
                sender_id: meuId,
                receiver_id: contatoSelecionadoId,
                content: message
            });
            
            chatInput.value = "";
        } else if (!contatoSelecionadoId) {
            alert("Selecione um contato primeiro para conversar!");
        } else if (!meuId) {
            alert("Erro: Você não está logado!");
        }
    });

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") chatSendBtn.click();
    });
}


// 4. Registro
async function registerUser(username, email, password) {
    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) alert("Usuário registrado!");
        else alert("Erro: " + data.error);
    } catch (err) { console.error(err); }
}

// 5. Login (SALVANDO USERNAME)
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
            localStorage.setItem("username", data.username); // ESSENCIAL
            alert("Login OK!");
            location.reload(); // Reinicia para carregar o nome no chat
        } else {
            alert("Erro: " + data.error);
        }
    } catch (err) { console.error(err); }
}

// 6. Eventos
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("registerUsername").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value.trim();
            registerUser(username, email, password);
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            loginUser(email, password);
        });
    }
});
