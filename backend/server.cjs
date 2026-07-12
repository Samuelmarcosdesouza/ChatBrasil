require("dotenv").config();
const path = require("path");

// Força o dotenv a procurar o arquivo no caminho absoluto
require("dotenv").config();

console.log("DATABASE_URL carregada:", process.env.DATABASE_URL ? "SIM ✅" : "NÃO ❌");

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

app.use(cors());
app.use(express.json());

// ------------------------------
// Conexão com PostgreSQL (Supabase)
// ------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Quase sempre necessário em produção (Render/Heroku)
});


pool.connect()
  .then(() => console.log("✅ Conectado ao PostgreSQL/Supabase"))
  .catch(err => console.error("❌ Erro ao conectar ao banco:", err.message));

// ------------------------------
// Rotas
// ------------------------------
app.get("/", (req, res) => res.send("Servidor Chat Online 🚀"));

// Registro
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, email, hashed]
    );
    res.status(201).json({ message: "Usuário registrado!" });
  } catch (err) {
    console.error("❌ Erro no /register:", err); // mostra o erro completo
    res.status(400).json({ error: "Erro ao registrar." });
  }
});

// --- LOGIN CORRIGIDO ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (result.rows.length > 0 && await bcrypt.compare(password, result.rows[0].password)) {
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      
      // Enviando o ID para o frontend salvar no localStorage
      res.json({ 
        token, 
        username: user.username, 
        userId: user.id 
      });
      
    } else {
      res.status(400).json({ error: "Dados inválidos." });
    }
  } catch (err) {
    console.error("❌ Erro no /login:", err);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// --- ROTA DE USUÁRIOS CORRIGIDA ---
app.get("/messages/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at ASC",
      [user1, user2]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

// ------------------------------
// Chat privado (WebSocket)
// ------------------------------
io.on("connection", socket => {
  console.log(`📡 Usuário conectado: ${socket.id}`);

  socket.on("join", userId => {
    socket.join(userId);
    console.log(`👤 Usuário ${userId} entrou na sua sala privada.`);
  });

  socket.on("send_message", async data => {
    const { sender_id, receiver_id, content } = data;
    try {
      await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
        [sender_id, receiver_id, content]
      );

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
// ------------------------------
// Inicialização do servidor
// ------------------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
