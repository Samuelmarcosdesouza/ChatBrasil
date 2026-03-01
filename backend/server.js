require("dotenv").config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, transports: ["websocket", "polling"] });

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("✅ Conectado ao PostgreSQL"))
  .catch((err) => console.error("❌ Erro ao conectar ao banco:", err.message));

app.get("/", (req, res) => res.send("Servidor Chat Online 🚀"));

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, hashed]);
    res.status(201).json({ message: "Usuário registrado!" });
  } catch (err) { res.status(400).json({ error: "Erro ao registrar." }); }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (result.rows.length > 0 && await bcrypt.compare(password, result.rows[0].password)) {
    const token = jwt.sign({ id: result.rows[0].id }, "secret", { expiresIn: "7d" });
    res.json({ token, username: result.rows[0].username });
  } else { res.status(400).json({ error: "Dados inválidos." }); }
});

// ============================================
// LÓGICA DE CHAT PRIVADO (ESTILO WHATSAPP)
// ============================================
io.on("connection", (socket) => {
  console.log(`📡 Usuário conectado: ${socket.id}`);

  // O usuário entra em uma "sala" com o próprio ID dele (UUID do banco)
  // Assim, quando alguém quiser falar com ele, o servidor sabe onde entregar
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 Usuário ${userId} entrou na sua sala privada.`);
  });

  socket.on("send_message", async (data) => {
    const { sender_id, receiver_id, content } = data;

    try {
      // 1. Grava a mensagem no Banco de Dados (Supabase)
      await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
        [sender_id, receiver_id, content]
      );

      // 2. Envia a mensagem APENAS para o Destinatário e para o Remetente
      // (Diferente do io.emit que mandava para o site inteiro)
      io.to(receiver_id).to(sender_id).emit("receive_message", {
        sender_id,
        content,
        timestamp: new Date()
      });

    } catch (err) {
      console.error("❌ Erro ao salvar mensagem:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Usuário desconectou.");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
