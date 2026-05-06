const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const cors = require('cors');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();

// 🔒 Configuração CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests sem origin (ex: curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowed =
      /^https:\/\/([a-z0-9-]+\.)?glp1effects\.com\.br$/.test(origin) ||
      origin === 'http://localhost:8080';

    if (allowed) {
      return callback(null, true);
    }

    console.warn('❌ CORS bloqueado para:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// ✅ IMPORTANTE: tratar preflight corretamente
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// 🔧 Config
const VITE_WHATSAPP_URL = 'http://31.97.160.145:3333/message/video?key=191982258940215';
const VIDEO_PATH = path.join(__dirname, 'video.mp4');

// 🚀 Função de envio
async function enviarMensagemComVideo(dados) {
  try {
    const { telefone, caption } = dados;

    if (!fs.existsSync(VIDEO_PATH)) {
      console.error("❌ Erro: arquivo video.mp4 não encontrado.");
      return;
    }

    const videoStream = fs.createReadStream(VIDEO_PATH);
    const formDataPayload = new FormData();

    formDataPayload.append("file", videoStream, "video.mp4");
    formDataPayload.append("id", telefone);
    formDataPayload.append("caption", caption);

    const response = await fetch(VITE_WHATSAPP_URL, {
      method: "POST",
      body: formDataPayload,
      headers: formDataPayload.getHeaders()
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Sucesso ao enviar para ${telefone}`);
    } else {
      console.error("❌ Erro na API de WhatsApp:", result);
    }

  } catch (err) {
    console.error("❌ Erro técnico:", err);
  }
}

// 📩 Webhook principal
app.post('/webhook-leads', (req, res) => {
  const payload = req.body;

  console.log("📥 Recebido:", payload);

  // responde rápido pro frontend
  res.status(200).json({
    status: "ok",
    message: `Processando ${payload?.id || 'sem id'}`
  });

  // processamento async
  enviarMensagemComVideo(payload)
    .catch(err => console.error("❌ Erro no envio async:", err));
});

// 🧪 Rota de teste
app.get('/', (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Servidor rodando 🚀"
  });
});

// 🚀 Start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📹 Vídeo esperado em: ${VIDEO_PATH}`);
});
