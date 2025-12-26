const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const cors = require('cors');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

app.use(express.json());

const VITE_WHATSAPP_URL = 'http://31.97.160.145:3333/message/video?key=777';
const VIDEO_PATH = path.join(__dirname, 'video.mp4');

async function enviarMensagemComVideo(dados) {
  try {
    const { telefone, caption } = dados;

    if (!fs.existsSync(VIDEO_PATH)) {
      console.error("Erro: arquivo video.mp4 não encontrado no servidor.");
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
    console.log(response.ok ? `Sucesso ao enviar para ${telefone}!` : "Erro na API de WhatsApp:", result);
  } catch (err) {
    console.error("Erro técnico no processamento do webhook:", err);
  }
}

app.post('/webhook-leads', (req, res) => {
  const payload = req.body;
  
  // Resposta rápida (200 OK) para liberar o frontend imediatamente
  res.status(200).json({ status: "ok", message: `Processando ${payload.id}` });

  // Executa o envio de forma assíncrona
  enviarMensagemComVideo(payload).catch(err => console.error("Erro na fila de envio:", err));
});

app.get('/',(req,res)=>{

  res.status(200).json({ status: "ok", message: "Processamento iniciado em background" });
  
})
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📹 Vídeo esperado em: ${VIDEO_PATH}`);
});